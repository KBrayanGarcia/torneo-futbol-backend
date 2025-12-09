import { Entity, Column, PrimaryGeneratedColumn, ManyToMany } from 'typeorm';
import { Team } from './team.entity';

@Entity()
export class Player {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  avatar: string;

  @Column('jsonb', { default: {} })
  stats: Record<string, any>;

  @ManyToMany(() => Team, (team) => team.players)
  teams: Team[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
