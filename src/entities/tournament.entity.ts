import { Entity, Column, PrimaryGeneratedColumn, ManyToMany, JoinTable } from 'typeorm';
import { Team } from './team.entity';

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

    @ManyToMany(() => Team, (team) => team.tournaments)
    @JoinTable()
    participants: Team[];

    @Column({ nullable: true })
    startDate: Date;

    @Column({ nullable: true })
    endDate: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;
}
