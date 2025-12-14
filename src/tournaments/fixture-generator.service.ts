import { Injectable, Logger } from '@nestjs/common';
import { Match } from '../entities/match.entity';
import { Tournament } from '../entities/tournament.entity';
import { LeagueFixtureStrategy } from './strategies/league-fixture.strategy';
import { CupFixtureStrategy } from './strategies/cup-fixture.strategy';

@Injectable()
export class FixtureGeneratorService {
  private readonly logger = new Logger(FixtureGeneratorService.name);

  constructor(
    private readonly leagueStrategy: LeagueFixtureStrategy,
    private readonly cupStrategy: CupFixtureStrategy,
  ) {}

  generate(tournament: Tournament): Partial<Match>[] {
    if (tournament.config.type === 'LEAGUE') {
      this.logger.log('Delegating to LeagueFixtureStrategy...');
      return this.leagueStrategy.generate(tournament);
    } else {
      this.logger.log('Delegating to CupFixtureStrategy...');
      return this.cupStrategy.generate(tournament);
    }
  }
}
