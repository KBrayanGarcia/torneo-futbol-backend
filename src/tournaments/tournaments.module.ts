import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TournamentsService } from './tournaments.service';
import { TournamentsController } from './tournaments.controller';
import { Tournament } from '../entities/tournament.entity';
import { Match } from '../entities/match.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tournament, Match])],
  controllers: [TournamentsController],
  providers: [TournamentsService],
})
export class TournamentsModule {}
