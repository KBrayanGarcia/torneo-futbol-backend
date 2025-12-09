export class CreateTournamentDto {
  name: string;
  config: Record<string, any>;
  startDate?: Date;
  endDate?: Date;
  participants?: any[];
}
