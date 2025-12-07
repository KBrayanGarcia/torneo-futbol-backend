import { Entity, Column, PrimaryGeneratedColumn, ManyToMany, JoinTable } from 'typeorm';
import { Player } from './player.entity';
import { Tournament } from './tournament.entity';

@Entity()
export class Team {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ default: false })
    isFixed: boolean;

    @Column('jsonb', { nullable: true, default: {} })
    stats: Record<string, any>;

    @ManyToMany(() => Player, (player) => player.teams)
    @JoinTable()
    players: Player[];

    @ManyToMany(() => Tournament, (tournament) => tournament.participants)
    tournaments: Tournament[];
}
