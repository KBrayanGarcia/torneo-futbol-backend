import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { Player } from '../entities/player.entity';

@Injectable()
export class PlayersService {
  constructor(
    @InjectRepository(Player)
    private playerRepository: Repository<Player>,
  ) {}

  create(createPlayerDto: CreatePlayerDto) {
    const player = this.playerRepository.create(createPlayerDto);
    return this.playerRepository.save(player);
  }

  findAll() {
    return this.playerRepository.find();
  }

  findOne(id: string) {
    return this.playerRepository.findOneBy({ id });
  }

  async update(id: string, updatePlayerDto: UpdatePlayerDto) {
    await this.playerRepository.update(id, updatePlayerDto);
    return this.findOne(id);
  }

  remove(id: string) {
    return this.playerRepository.delete(id);
  }
}
