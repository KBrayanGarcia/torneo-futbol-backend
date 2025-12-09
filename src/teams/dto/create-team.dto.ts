export class CreateTeamDto {
  name: string;
  isFixed?: boolean;
  stats?: Record<string, any>;
  playerIds?: string[]; // For linking existing players
}
