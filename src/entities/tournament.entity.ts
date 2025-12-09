import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { Team } from './team.entity';
import { Match } from './match.entity';

@Entity()
export class Tournament {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('jsonb')
  config: Record<string, any>;

  @Column()
  status: string;

  @ManyToMany(() => Team, (team) => team.tournaments, { cascade: true })
  @JoinTable()
  participants: Team[];

  @OneToMany(() => Match, (match) => match.tournament)
  matches: Match[];

  @Column({ nullable: true })
  startDate: Date;

  @Column({ nullable: true })
  endDate: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
