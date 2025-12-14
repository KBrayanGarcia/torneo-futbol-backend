import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { Team } from '../entities/team.entity';
import { Player } from '../entities/player.entity';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private teamRepository: Repository<Team>,
    @InjectRepository(Player)
    private playerRepository: Repository<Player>,
  ) {}

  async create(createTeamDto: CreateTeamDto) {
    const { playerIds, ...teamData } = createTeamDto;

    const team = this.teamRepository.create(teamData);

    if (playerIds && playerIds.length > 0) {
      const players = await this.playerRepository.findBy({ id: In(playerIds) });
      team.players = players;
    }

    return this.teamRepository.save(team);
  }

  findAll() {
    return this.teamRepository.find({ relations: ['players'] });
  }

  findOne(id: string) {
    return this.teamRepository.findOne({
      where: { id },
      relations: ['players'],
    });
  }

  async update(id: string, updateTeamDto: UpdateTeamDto) {
    const { playerIds, ...teamData } = updateTeamDto;

    // First update scalar fields
    await this.teamRepository.update(id, teamData);

    // If playerIds provided, update relations
    if (playerIds) {
      const team = await this.findOne(id);
      if (team) {
        const players = await this.playerRepository.findBy({
          id: In(playerIds),
        });
        team.players = players;
        await this.teamRepository.save(team);
      }
    }

    return this.findOne(id);
  }

  remove(id: string) {
    return this.teamRepository.delete(id);
  }
}
