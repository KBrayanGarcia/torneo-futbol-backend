import { Team } from '../../entities/team.entity';

export interface TournamentConfig {
  type: 'LEAGUE' | 'CUP';
  startDate?: string;
  endDate?: string;
  hasReturnLeg?: boolean;
  schedulingMode?: 'DAILY_FOR_ALL' | 'DISTRIBUTED';
  excludedDays?: number[];
  [key: string]: any;
}

export type FixtureParticipant = Team | { id: 'BYE'; name: 'BYE' };

export interface FixturePairing {
  round: number;
  home: FixtureParticipant;
  away: FixtureParticipant;
}
