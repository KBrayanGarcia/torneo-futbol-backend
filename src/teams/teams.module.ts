import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamsService } from './teams.service';
import { TeamsController } from './teams.controller';
import { Team } from '../entities/team.entity';
import { Player } from '../entities/player.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Team, Player])],
  controllers: [TeamsController],
  providers: [TeamsService],
})
export class TeamsModule {}
