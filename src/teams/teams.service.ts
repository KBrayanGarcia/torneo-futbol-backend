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
    // Handling relations in update is more complex, for now basic update
    // If we need to update players, we'd need to fetch, merge, etc.
    // Keeping it simple for prototype: just update fields, ignore players update for now unless needed.
    // Actually, let's just do a basic save for properties.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { playerIds, ...teamData } = updateTeamDto;
    await this.teamRepository.update(id, teamData);
    return this.findOne(id);
  }

  remove(id: string) {
    return this.teamRepository.delete(id);
  }
}
