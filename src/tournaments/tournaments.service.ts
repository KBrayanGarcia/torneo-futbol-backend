import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { Match } from '../entities/match.entity';
import { Tournament } from '../entities/tournament.entity';

@Injectable()
export class TournamentsService {
  constructor(
    @InjectRepository(Tournament)
    private tournamentRepository: Repository<Tournament>,
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
  ) {
    console.log('---------------------------------------------------------');
    console.log('   BACKEND WITH LOGS STARTED - READY TO DEBUG FIXTURE    ');
    console.log('---------------------------------------------------------');
  }
  private parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      // Create date at 12:00 (Noon) local time to avoid timezone edge cases (00:00 -> previous day)
      return new Date(y, m - 1, d, 12, 0, 0);
    } catch (e) {
      return null;
    }
  }

  create(createTournamentDto: CreateTournamentDto) {
    // Extract dates from config to ensure columns are populated
    const startDateStr =
      createTournamentDto.startDate || createTournamentDto.config?.startDate;
    const endDateStr =
      createTournamentDto.endDate || createTournamentDto.config?.endDate;

    const tournament = this.tournamentRepository.create({
      ...createTournamentDto,
      startDate: this.parseDate(startDateStr as unknown as string),
      endDate: this.parseDate(endDateStr as unknown as string),
      status: 'DRAFT', // Default status
    });
    return this.tournamentRepository.save(tournament);
  }

  findAll() {
    return this.tournamentRepository.find();
  }

  async findOne(id: string) {
    const tournament = await this.tournamentRepository.findOne({
      where: { id },
      relations: [
        'participants',
        'matches',
        'matches.homeTeam',
        'matches.awayTeam',
      ],
      order: {
        matches: {
          date: 'ASC', // Sort matches by date
        },
      },
    });
    if (!tournament) {
      throw new NotFoundException(`Tournament with ID ${id} not found`);
    }
    console.log(
      `findOne(${id}): found tournament with ${tournament.participants?.length} participants and ${tournament.matches?.length} matches.`,
    );
    return tournament;
  }

  async update(id: string, updateTournamentDto: UpdateTournamentDto) {
    const tournament = await this.findOne(id);
    this.tournamentRepository.merge(tournament, updateTournamentDto);

    // Sync columns with config
    if (tournament.config?.startDate)
      tournament.startDate = this.parseDate(tournament.config.startDate);
    if (tournament.config?.endDate)
      tournament.endDate = this.parseDate(tournament.config.endDate);

    return this.tournamentRepository.save(tournament);
  }

  async remove(id: string) {
    const tournament = await this.findOne(id);
    return this.tournamentRepository.remove(tournament);
  }

  async generateFixture(id: string) {
    console.log(`START: Generating fixture for tournament ${id}`);
    try {
      const tournament = await this.findOne(id);
      console.log(
        `Tournament loaded. Status: ${tournament.status}, Config:`,
        JSON.stringify(tournament.config),
      );

      if (tournament.status === 'COMPLETED') {
        throw new Error('Cannot generate fixture for completed tournament');
      }

      console.log('Deleting existing matches...');
      const deleteResult = await this.matchRepository
        .createQueryBuilder()
        .delete()
        .from(Match)
        .where('tournamentId = :id', { id: tournament.id })
        .execute();
      console.log(
        `Existing matches deleted. Affected: ${deleteResult.affected}`,
      );

      let matches: Match[] = [];
      if (tournament.config.type === 'LEAGUE') {
        console.log('Generating LEAGUE fixture...');
        matches = this.generateLeagueFixture(tournament);
      } else {
        console.log('Generating CUP fixture...');
        matches = this.generateCupFixture(tournament);
      }

      console.log(`Generated ${matches.length} matches in memory.`);

      if (matches.length > 0) {
        console.log('Saving matches to DB...');
        const savedMatches = await this.matchRepository.save(matches);
        const matchIds = savedMatches.map((m) => m.id);
        console.log(
          `Saved ${savedMatches.length} matches to DB. IDs: ${matchIds.join(', ')}`,
        );

        // Update tournament status to ACTIVE using update to avoid side effects on relations
        await this.tournamentRepository.update(tournament.id, {
          status: 'ACTIVE',
        });
        console.log('Tournament status updated to ACTIVE.');

        return savedMatches;
      } else {
        console.warn('WARNING: No matches were generated.');
        return [];
      }
    } catch (error) {
      console.error('CRITICAL ERROR generating fixture:', error);
      throw error;
    }
  }

  private generateLeagueFixture(tournament: Tournament): Match[] {
    console.log('Inside generateLeagueFixture...');
    const teams = [...tournament.participants];
    const { config } = tournament;
    console.log(`Teams count: ${teams.length}, Config:`, config); // Log teams and config

    if (teams.length < 2) {
      console.warn('Not enough teams to generate fixture.');
      return [];
    }

    // Add dummy team if odd
    if (teams.length % 2 !== 0) {
      // Use a special method or just keep logic simple
      // For DB, we can't save a fake team easily unless we create a BYE entity.
      // Better strategy: Filter out BYE matches before saving.
      teams.push({ id: 'BYE', name: 'BYE' } as any);
    }

    const numTeams = teams.length;
    const rounds = numTeams - 1;
    const half = numTeams / 2;

    let roundPairings: { round: number; home: any; away: any }[] = [];

    for (let round = 0; round < rounds; round++) {
      for (let i = 0; i < half; i++) {
        const home = teams[i];
        const away = teams[numTeams - 1 - i];

        if (home.id !== 'BYE' && away.id !== 'BYE') {
          roundPairings.push({
            round: round + 1,
            home: (round + i) % 2 === 0 ? home : away,
            away: (round + i) % 2 === 0 ? away : home,
          });
        }
      }
      // Rotate
      teams.splice(1, 0, teams.pop()!);
    }

    if (config.hasReturnLeg) {
      const returnLegs = roundPairings.map((p) => ({
        round: p.round + rounds,
        home: p.away,
        away: p.home,
      }));
      roundPairings = [...roundPairings, ...returnLegs];
    }

    // Sort by round
    roundPairings.sort((a, b) => a.round - b.round);

    const totalRounds = roundPairings[roundPairings.length - 1]?.round || 0;
    console.log(`[DEBUG] Total formatted rounds: ${totalRounds}`);

    // Scheduling
    const matches: Match[] = [];
    const availableDates: Date[] = [];
    let startDate = new Date();

    if (config.startDate) {
      const [y, m, d] = config.startDate.split('-').map(Number);
      startDate = new Date(y, m - 1, d, 18, 0, 0);
    } else {
      startDate.setHours(18, 0, 0, 0);
    }

    const endDate = config.endDate
      ? new Date(config.endDate + 'T23:59:59')
      : null;
    const excludedDays = config.excludedDays || [];

    const iteratorDate = new Date(startDate);
    const maxDays = 365;
    let daysCount = 0;

    // Generate date pool
    while (daysCount < maxDays) {
      // If we have an end date, check it.
      // BUT if we are in strict DAILY mode (one round per day), we must ensure we have enough dates.
      // So we only break on endDate if we assume distributed or if we don't care about compression.
      // Use case: User expects 1 round/day. If range is too short, we currently overwrite.
      // improved logic: Extend date range if needed for DAILY_FOR_ALL to avoid double headers.

      const isPastEndDate = endDate && iteratorDate > endDate;

      if (isPastEndDate) {
        console.log(`[DEBUG] Breaking date loop. Date > EndDate.`);
        break;
      }

      if (!excludedDays.includes(iteratorDate.getDay())) {
        availableDates.push(new Date(iteratorDate));
      }
      iteratorDate.setDate(iteratorDate.getDate() + 1);
      daysCount++;

      // Safety break
      if (availableDates.length >= totalRounds + 365) break;
    }

    console.log(
      `[DEBUG] Final available dates count: ${availableDates.length}. Required rounds: ${totalRounds}`,
    );

    if (availableDates.length === 0) availableDates.push(startDate);

    if (config.schedulingMode === 'DAILY_FOR_ALL') {
      const generatedMatches = roundPairings
        .map((p) => {
          const dateIndex = p.round - 1;
          // Strict check: if rounds exceed available days, do NOT generate match (truncate)
          if (dateIndex >= availableDates.length) {
            return null;
          }

          const matchDate = new Date(availableDates[dateIndex]);
          matchDate.setHours(18, 0, 0);

          return this.matchRepository.create({
            tournament: tournament,
            homeTeam: p.home,
            awayTeam: p.away,
            date: matchDate,
            status: 'SCHEDULED',
            round: p.round,
            phase: 'Regular Season',
          });
        })
        .filter((m) => m !== null); // Filter out truncated matches

      matches.push(...(generatedMatches as Match[]));
    } else {
      // Distributed
      const totalMatches = roundPairings.length;
      const totalDates = availableDates.length;
      const matchesPerDay = Math.ceil(totalMatches / totalDates);

      matches.push(
        ...roundPairings.map((p, index) => {
          const dayIndex = Math.floor(index / matchesPerDay) % totalDates;
          const matchDate = new Date(availableDates[dayIndex]);
          matchDate.setHours(18, 0, 0);

          const match = this.matchRepository.create({
            tournament: tournament,
            homeTeam: p.home,
            awayTeam: p.away,
            date: matchDate,
            status: 'SCHEDULED',
            round: p.round,
            phase: 'Regular Season',
          });
          return match;
        }),
      );
    }

    return matches;
  }

  private generateCupFixture(tournament: Tournament): Match[] {
    const teams = [...tournament.participants].sort(() => 0.5 - Math.random());
    const matches: Match[] = [];
    const { config } = tournament;

    // Determine start date
    let matchDate = new Date();
    if (config.startDate) {
      // Parse YYYY-MM-DD manually to avoid timezone issues
      const [y, m, d] = config.startDate.split('-').map(Number);
      matchDate = new Date(y, m - 1, d, 18, 0, 0);
    } else {
      matchDate.setHours(18, 0, 0, 0);
    }

    while (teams.length >= 2) {
      const home = teams.pop()!;
      const away = teams.pop()!;

      const match = this.matchRepository.create({
        tournament: tournament,
        homeTeam: home,
        awayTeam: away,
        date: matchDate, // Use calculated date
        status: 'SCHEDULED',
        phase: 'Round 1',
        round: 1,
      });
      matches.push(match);
    }
    return matches;
  }
}
