export class UpdateMatchDto {
  score?: {
    home: number;
    away: number;
  };
  status?: string;
  date?: Date;
}
