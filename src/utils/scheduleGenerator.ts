// Completely Rewritten Pickleball Scheduler with Strict Fairness Rules

import { Player, Match, ScheduleConfig, Schedule } from '@/types/schedule';

class SeededRandom {
  constructor(private seed: number) {}
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

interface PlayerState {
  id: number;
  partners: Set<number>;
  opponents: Set<number>;
  lastPlayedRound: number;
  matchCount: number;
}

export const generateSchedule = (config: ScheduleConfig): Schedule => {
  const { numRounds, numPlayers, numCourts, playerNames, randomSeed } = config;
  const rng = new SeededRandom(randomSeed || Date.now());

  const players: Player[] = Array.from({ length: numPlayers }, (_, i) => ({
    id: i + 1,
    name: playerNames?.[i] || `Player ${i + 1}`
  }));

  const state: Record<number, PlayerState> = {};
  players.forEach(p => {
    state[p.id] = {
      id: p.id,
      partners: new Set(),
      opponents: new Set(),
      lastPlayedRound: -2,
      matchCount: 0
    };
  });

  const matches: Match[] = [];
  const roundSittingOut: Record<number, Player[]> = {};

  for (let round = 1; round <= numRounds; round++) {
    const available = players.filter(p => round - state[p.id].lastPlayedRound > 1);
    const shuffled = rng.shuffle(available.map(p => p.id));

    const roundMatches: Match[] = [];
    const used = new Set<number>();

    for (let c = 0; c < numCourts && shuffled.length - used.size >= 4; c++) {
      const candidates = shuffled.filter(id => !used.has(id));

      let bestScore = -Infinity;
      let bestGroup: number[] = [];

      // Try all combinations of 4 players
      for (let a = 0; a < candidates.length - 3; a++) {
        for (let b = a + 1; b < candidates.length - 2; b++) {
          for (let c1 = b + 1; c1 < candidates.length - 1; c1++) {
            for (let d = c1 + 1; d < candidates.length; d++) {
              const group = [candidates[a], candidates[b], candidates[c1], candidates[d]];
              const [p1, p2, p3, p4] = group.map(id => state[id]);

              // Try 3 team splits
              const teams = [
                [[p1, p2], [p3, p4]],
                [[p1, p3], [p2, p4]],
                [[p1, p4], [p2, p3]]
              ];

              for (const [[t1a, t1b], [t2a, t2b]] of teams) {
                const t1Partnered = t1a.partners.has(t1b.id);
                const t2Partnered = t2a.partners.has(t2b.id);

                const alreadyOpposed = [
                  t1a.opponents.has(t2a.id),
                  t1a.opponents.has(t2b.id),
                  t1b.opponents.has(t2a.id),
                  t1b.opponents.has(t2b.id)
                ].filter(Boolean).length;

                const score =
                  (t1Partnered ? -100 : 100) +
                  (t2Partnered ? -100 : 100) +
                  -50 * alreadyOpposed;

                if (score > bestScore) {
                  bestScore = score;
                  bestGroup = [t1a.id, t1b.id, t2a.id, t2b.id];
                }
              }
            }
          }
        }
      }

      if (bestGroup.length === 4) {
        const [a, b, c, d] = bestGroup;
        used.add(a);
        used.add(b);
        used.add(c);
        used.add(d);

        const match: Match = {
          id: matches.length + 1,
          round,
          court: c + 1,
          players: [players[a - 1], players[b - 1], players[c - 1], players[d - 1]]
        };

        matches.push(match);

        const team1 = [a, b];
        const team2 = [c, d];
        for (const id of [...team1, ...team2]) {
          state[id].lastPlayedRound = round;
          state[id].matchCount++;
        }
        state[a].partners.add(b);
        state[b].partners.add(a);
        state[c].partners.add(d);
        state[d].partners.add(c);

        for (const id1 of team1) {
          for (const id2 of team2) {
            state[id1].opponents.add(id2);
            state[id2].opponents.add(id1);
          }
        }
      }
    }

    const sittingOut = players.filter(p => !used.has(p.id));
    roundSittingOut[round] = sittingOut;
  }

  const playerStats = players.map(p => ({
    playerId: p.id,
    playerName: p.name,
    matchCount: state[p.id].matchCount
  }));

  return { matches, playerStats, roundSittingOut };
};

export const exportScheduleToCSV = (schedule: Schedule): string => {
  const csvContent = [
    ['Round', 'Court', 'Team 1 Player 1', 'Team 1 Player 2', 'Team 2 Player 1', 'Team 2 Player 2'],
    ...schedule.matches.map(match => [
      match.round.toString(),
      match.court.toString(),
      match.players[0].name,
      match.players[1].name,
      match.players[2].name,
      match.players[3].name
    ])
  ].map(row => row.join(',')).join('\n');

  return csvContent;
};
