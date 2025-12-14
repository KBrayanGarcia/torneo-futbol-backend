import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TournamentsService } from './tournaments.service';
import { TournamentsController } from './tournaments.controller';
import { Tournament } from '../entities/tournament.entity';
import { Match } from '../entities/match.entity';

import { FixtureGeneratorService } from './fixture-generator.service';
import { LeagueFixtureStrategy } from './strategies/league-fixture.strategy';
import { CupFixtureStrategy } from './strategies/cup-fixture.strategy';

import { RoundRobinService } from './lib/round-robin.service';
import { FixtureDateService } from './lib/fixture-date.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tournament, Match])],
  controllers: [TournamentsController],
  providers: [
    TournamentsService,
    FixtureGeneratorService,
    LeagueFixtureStrategy,
    CupFixtureStrategy,
    RoundRobinService,
    FixtureDateService,
  ],
})
export class TournamentsModule {}
