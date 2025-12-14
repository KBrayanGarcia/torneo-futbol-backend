import { Injectable } from '@nestjs/common';
import {
  FixtureParticipant,
  FixturePairing,
} from '../interfaces/fixture.interfaces';
import { Team } from '../../entities/team.entity';

@Injectable()
export class RoundRobinService {
  /**
   * Generates a Round Robin schedule (All vs All).
   * Automatically handles odd number of teams by adding a dummy 'BYE' participant.
   */
  generate(participants: Team[], hasReturnLeg: boolean): FixturePairing[] {
    const teams: FixtureParticipant[] = [...participants];

    // Add dummy team if odd
    if (teams.length % 2 !== 0) {
      teams.push({ id: 'BYE', name: 'BYE' });
    }

    const numTeams = teams.length;
    const rounds = numTeams - 1;
    const half = numTeams / 2;

    let roundPairings: FixturePairing[] = [];

    for (let round = 0; round < rounds; round++) {
      for (let i = 0; i < half; i++) {
        const home = teams[i];
        const away = teams[numTeams - 1 - i];

        // Filter out BYE matches immediately
        if (home.id !== 'BYE' && away.id !== 'BYE') {
          roundPairings.push({
            round: round + 1,
            home: (round + i) % 2 === 0 ? home : away,
            away: (round + i) % 2 === 0 ? away : home,
          });
        }
      }

      // Rotate array: keep first fixed, rotate the rest clockwise
      // [0, 1, 2, 3] -> [0] + [3, 1, 2]
      // pop() removes last, unshift() adds to start.
      // But we need to keep index 0 fixed.
      // logic: splice(1, 0, array.pop()) -> inserts the last element at index 1
      const last = teams.pop();
      if (last) {
        teams.splice(1, 0, last);
      }
    }

    if (hasReturnLeg) {
      const returnLegs = roundPairings.map((p) => ({
        round: p.round + rounds,
        home: p.away,
        away: p.home,
      }));
      roundPairings = [...roundPairings, ...returnLegs];
    }

    // Sort by round
    roundPairings.sort((a, b) => a.round - b.round);

    return roundPairings;
  }
}
