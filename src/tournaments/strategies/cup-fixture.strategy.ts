import { Injectable } from '@nestjs/common';
import { Match } from '../../entities/match.entity';
import { Tournament } from '../../entities/tournament.entity';

@Injectable()
export class CupFixtureStrategy {
  generate(tournament: Tournament): Partial<Match>[] {
    const teams = [...tournament.participants].sort(() => 0.5 - Math.random());
    const matches: Partial<Match>[] = [];
    const { config } = tournament;

    // Determine start date
    let matchDate = new Date();
    if (config.startDate) {
      // Parse YYYY-MM-DD manually to avoid timezone issues
      const [y, m, d] = config.startDate.split('-').map(Number);
      matchDate = new Date(y, m - 1, d, 18, 0, 0);
    } else {
      matchDate.setHours(18, 0, 0, 0);
    }

    while (teams.length >= 2) {
      const home = teams.pop()!;
      const away = teams.pop()!;

      matches.push({
        tournament: tournament,
        homeTeam: home,
        awayTeam: away,
        date: matchDate, // Use calculated date
        status: 'SCHEDULED',
        phase: 'Round 1',
        round: 1,
      });
    }
    return matches;
  }
}
