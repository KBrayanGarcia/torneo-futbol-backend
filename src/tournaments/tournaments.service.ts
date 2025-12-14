import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { Match } from '../entities/match.entity';
import { Tournament } from '../entities/tournament.entity';
import { FixtureGeneratorService } from './fixture-generator.service';

@Injectable()
export class TournamentsService {
  private readonly logger = new Logger(TournamentsService.name);

  constructor(
    @InjectRepository(Tournament)
    private tournamentRepository: Repository<Tournament>,
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
    private fixtureGenerator: FixtureGeneratorService,
  ) {
    this.logger.log('Backend Services Initialized');
  }

  private parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      return new Date(y, m - 1, d, 12, 0, 0);
    } catch (e) {
      return null;
    }
  }

  create(createTournamentDto: CreateTournamentDto) {
    const startDateStr =
      createTournamentDto.startDate || createTournamentDto.config?.startDate;
    const endDateStr =
      createTournamentDto.endDate || createTournamentDto.config?.endDate;

    const tournament = this.tournamentRepository.create({
      ...createTournamentDto,
      startDate: this.parseDate(startDateStr as unknown as string),
      endDate: this.parseDate(endDateStr as unknown as string),
      status: 'DRAFT',
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
          date: 'ASC',
        },
      },
    });
    if (!tournament) {
      throw new NotFoundException(`Tournament with ID ${id} not found`);
    }
    return tournament;
  }

  async update(id: string, updateTournamentDto: UpdateTournamentDto) {
    const tournament = await this.findOne(id);
    this.tournamentRepository.merge(tournament, updateTournamentDto);

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
    this.logger.log(`START: Generating fixture for tournament ${id}`);
    try {
      const tournament = await this.findOne(id);

      if (tournament.status === 'COMPLETED') {
        throw new Error('Cannot generate fixture for completed tournament');
      }

      this.logger.log('Deleting existing matches...');
      await this.matchRepository.delete({
        tournament: { id: tournament.id },
      });

      // Delegate fixture logic to service
      const generatedMatches = this.fixtureGenerator.generate(tournament);
      this.logger.log(
        `Generated ${generatedMatches.length} matches in memory.`,
      );

      if (generatedMatches.length > 0) {
        // Create entity instances from plain objects return by generator
        const matchEntities = this.matchRepository.create(generatedMatches);
        const savedMatches = await this.matchRepository.save(matchEntities);

        await this.tournamentRepository.update(tournament.id, {
          status: 'ACTIVE',
        });

        return savedMatches;
      } else {
        this.logger.warn('WARNING: No matches were generated.');
        return [];
      }
    } catch (error) {
      this.logger.error('CRITICAL ERROR generating fixture:', error);
      throw error;
    }
  }
}
