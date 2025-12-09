export class CreatePlayerDto {
  name: string;
  avatar?: string;
  stats?: Record<string, any>;
}
