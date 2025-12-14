import { Injectable, Logger } from '@nestjs/common';
import { Match } from '../../entities/match.entity';
import { Tournament } from '../../entities/tournament.entity';
import { RoundRobinService } from '../lib/round-robin.service';
import { FixtureDateService } from '../lib/fixture-date.service';
import {
  TournamentConfig,
  FixturePairing,
} from '../interfaces/fixture.interfaces';

@Injectable()
export class LeagueFixtureStrategy {
  private readonly logger = new Logger(LeagueFixtureStrategy.name);

  constructor(
    private readonly roundRobinService: RoundRobinService,
    private readonly fixtureDateService: FixtureDateService,
  ) {}

  generate(tournament: Tournament): Partial<Match>[] {
    const teams = [...tournament.participants];
    const config = tournament.config as unknown as TournamentConfig;

    this.logger.debug(
      `Teams count: ${teams.length}, Config: ${JSON.stringify(config)}`,
    );

    if (teams.length < 2) {
      this.logger.warn('Not enough teams to generate fixture.');
      return [];
    }

    // 1. Generate Pairings (Math)
    const roundPairings = this.roundRobinService.generate(
      teams,
      !!config.hasReturnLeg,
    );

    // 2. Generate Dates (Calendar)
    const totalRounds = roundPairings[roundPairings.length - 1]?.round || 0;
    const availableDates = this.fixtureDateService.generateDates(
      config,
      totalRounds,
    );

    if (availableDates.length === 0) {
      this.logger.warn('No available dates found for fixture.');
      return [];
    }

    // 3. Schedule Matches (Mapping)
    return this.scheduleMatches(tournament, roundPairings, availableDates);
  }

  private scheduleMatches(
    tournament: Tournament,
    roundPairings: FixturePairing[],
    availableDates: Date[],
  ): Partial<Match>[] {
    const matches: Partial<Match>[] = [];
    const config = tournament.config as unknown as TournamentConfig;

    if (config.schedulingMode === 'DAILY_FOR_ALL') {
      const generatedMatches = roundPairings
        .map((p) => {
          const dateIndex = p.round - 1;
          if (dateIndex >= availableDates.length) {
            return null;
          }

          const matchDate = new Date(availableDates[dateIndex]);
          matchDate.setHours(18, 0, 0);

          return {
            tournament: tournament,
            homeTeam: p.home,
            awayTeam: p.away,
            date: matchDate,
            status: 'SCHEDULED',
            round: p.round,
            phase: 'Regular Season',
          } as Partial<Match>;
        })
        .filter((m) => m !== null);

      matches.push(...(generatedMatches as Partial<Match>[]));
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

          return {
            tournament: tournament,
            homeTeam: p.home,
            awayTeam: p.away,
            date: matchDate,
            status: 'SCHEDULED',
            round: p.round,
            phase: 'Regular Season',
          } as Partial<Match>;
        }),
      );
    }

    return matches;
  }
}
