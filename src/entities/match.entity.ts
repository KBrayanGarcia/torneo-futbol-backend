import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Tournament } from './tournament.entity';
import { Team } from './team.entity';

@Entity()
export class Match {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Tournament)
    tournament: Tournament;

    @ManyToOne(() => Team)
    homeTeam: Team;

    @ManyToOne(() => Team)
    awayTeam: Team;

    @Column('jsonb', { nullable: true })
    score: Record<string, any>;

    @Column({ type: 'timestamp' })
    date: Date;

    @Column()
    status: string;

    @Column({ nullable: true })
    round: number;

    @Column({ nullable: true })
    phase: string;
}
