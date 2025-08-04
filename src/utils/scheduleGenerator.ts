import { Player, Match, ScheduleConfig, Schedule } from '@/types/schedule';

class SeededRandom {
  private seed: number;
  constructor(seed: number) { this.seed = seed; }
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
  shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

interface PlayerState {
  id: number;
  name: string;
  matchCount: number;
  lastPlayedRound: number;
  roundsSincePlayed: number;
  partnerships: Set<number>;
  opponents: Map<number, number>;
  courtsPlayed: Set<number>;
}

interface MatchCandidate {
  team1: [number, number];
  team2: [number, number];
  court: number;
  score: number;
}

interface ScoringWeights {
  balance: number;
  mustPlay: number;
  partnership: number;
  opposition: number;
  court: number;
}

const defaultWeights: ScoringWeights = {
  balance: 1.0,
  mustPlay: 2.0,
  partnership: 1.2,
  opposition: 1.0,
  court: 0.5,
};

export const generateSchedule = (config: ScheduleConfig): Schedule => {
  const {
    numRounds, numPlayers, numCourts,
    playerNames, randomSeed,
    prioritizeUniquePartnerships,
    avoidConsecutiveSittingOut,
    balanceMatchCounts,
    scoringWeights
  } = config;

  const weights = scoringWeights || defaultWeights;
  const rng = new SeededRandom(randomSeed || Date.now());

  const players: Player[] = Array.from({ length: numPlayers }, (_, i) => ({
    id: i + 1,
    name: playerNames?.[i] || `Player ${i + 1}`
  }));

  const initialSchedule = (): Schedule => {
    const matches: Match[] = [];
    const roundSittingOut: Record<number, Player[]> = {};
    const playerStates: Map<number, PlayerState> = new Map(
      players.map(p => [p.id, {
        id: p.id, name: p.name,
        matchCount: 0, lastPlayedRound: -2,
        roundsSincePlayed: 999,
        partnerships: new Set(),
        opponents: new Map(),
        courtsPlayed: new Set()
      }])
    );

    const canPlay = (pid: number, round: number) => {
      const s = playerStates.get(pid)!;
      return !(avoidConsecutiveSittingOut && s.lastPlayedRound === round - 2);
    };

    const partnershipScore = (p1: number, p2: number) => {
      const s1 = playerStates.get(p1)!;
      const hasPartnered = s1.partnerships.has(p2);
      if (prioritizeUniquePartnerships && hasPartnered) return -1000;
      return hasPartnered ? -100 : 100;
    };

    const oppositionScore = (team1: [number, number], team2: [number, number], round: number) => {
      let score = 0;
      const decay = 1 - round / numRounds;
      for (const p1 of team1) for (const p2 of team2) {
        const count = playerStates.get(p1)!.opponents.get(p2) || 0;
        score += (count === 0 ? 200 : -300 * (count) * decay);
      }
      return score;
    };

    const courtVarietyScore = (ids: number[], court: number) => {
      return ids.reduce((acc, id) => acc + (playerStates.get(id)!.courtsPlayed.has(court) ? -10 : 25), 0);
    };

    const scoreCandidate = (c: MatchCandidate, round: number) => {
      const all = [...c.team1, ...c.team2];
      const minCount = Math.min(...Array.from(playerStates.values()).map(s => s.matchCount));
      let balanceScore = 0, mustPlay = 0;
      for (const pid of all) {
        const s = playerStates.get(pid)!;
        if (avoidConsecutiveSittingOut && s.lastPlayedRound === round - 2) mustPlay += 10000;
        if (balanceMatchCounts) balanceScore += (s.matchCount === minCount) ? 500 : -200 * (s.matchCount - minCount);
      }
      return (mustPlay * weights.mustPlay) +
             (balanceScore * weights.balance) +
             ((partnershipScore(c.team1[0], c.team1[1]) +
               partnershipScore(c.team2[0], c.team2[1])) * weights.partnership) +
             (oppositionScore(c.team1, c.team2, round) * weights.opposition) +
             (courtVarietyScore(all, c.court) * weights.court);
    };

    const genCandidates = (avail: number[], round: number): MatchCandidate[] => {
      const cands: MatchCandidate[] = [];
      for (let i = 0; i < avail.length - 3; i++) {
        for (let j = i + 1; j < avail.length - 2; j++) {
          for (let k = j + 1; k < avail.length - 1; k++) {
            for (let l = k + 1; l < avail.length; l++) {
              const four = [avail[i], avail[j], avail[k], avail[l]];
              const arrs = [
                { team1: [four[0], four[1]], team2: [four[2], four[3]] },
                { team1: [four[0], four[2]], team2: [four[1], four[3]] },
                { team1: [four[0], four[3]], team2: [four[1], four[2]] },
              ] as { team1: [number, number], team2: [number, number] }[];
              for (const arr of arrs) for (let court = 1; court <= numCourts; court++) {
                cands.push({ ...arr, court, score: scoreCandidate({ ...arr, court, score: 0 }, round) });
              }
            }
          }
        }
      }
      return cands;
    };

    for (let round = 1; round <= numRounds; round++) {
      let available = players.map(p => p.id).filter(pid => canPlay(pid, round));
      for (let court = 0; court < numCourts && available.length >= 4; court++) {
        const candidates = genCandidates(available, round);
        if (candidates.length === 0) break;
        candidates.sort((a, b) => b.score - a.score || (rng.next() - 0.5));
        const best = candidates[0];
        const matchPlayers = [...best.team1, ...best.team2];
        available = available.filter(id => !matchPlayers.includes(id));
        matches.push({
          id: matches.length + 1,
          court: court + 1,
          players: matchPlayers.map(id => players.find(p => p.id === id)!),
          round
        });
        for (const pid of matchPlayers) {
          const s = playerStates.get(pid)!;
          s.matchCount++; s.lastPlayedRound = round; s.courtsPlayed.add(best.court);
        }
        const [p1, p2] = best.team1; const [p3, p4] = best.team2;
        playerStates.get(p1)!.partnerships.add(p2); playerStates.get(p2)!.partnerships.add(p1);
        playerStates.get(p3)!.partnerships.add(p4); playerStates.get(p4)!.partnerships.add(p3);
        for (const x of best.team1) for (const y of best.team2) {
          playerStates.get(x)!.opponents.set(y, (playerStates.get(x)!.opponents.get(y) || 0) + 1);
          playerStates.get(y)!.opponents.set(x, (playerStates.get(y)!.opponents.get(x) || 0) + 1);
        }
      }
      roundSittingOut[round] = players.filter(p => available.includes(p.id));
    }
    const playerStats = players.map(p => ({
      playerId: p.id, playerName: p.name,
      matchCount: playerStates.get(p.id)!.matchCount
    }));
    return { matches, playerStats, roundSittingOut };
  };

  // Global optimization: try multiple random schedules, keep best
  let bestSchedule: Schedule = initialSchedule();
  let bestScore = scoreSchedule(bestSchedule);
  for (let attempt = 0; attempt < 25; attempt++) {
    const candidate = initialSchedule();
    const candidateScore = scoreSchedule(candidate);
    if (candidateScore > bestScore) {
      bestScore = candidateScore;
      bestSchedule = candidate;
    }
  }
  return bestSchedule;
};

// Evaluate full schedule quality
const scoreSchedule = (schedule: Schedule): number => {
  // Higher score = better balance and diversity
  const partnerPairs = new Map<string, number>();
  const opponentPairs = new Map<string, number>();
  let balancePenalty = 0;
  const matchCounts = schedule.playerStats.map(p => p.matchCount);
  const minC = Math.min(...matchCounts), maxC = Math.max(...matchCounts);
  balancePenalty = maxC - minC;
  for (const m of schedule.matches) {
    const [a, b, c, d] = m.players.map(p => p.id);
    const p1 = [a, b].sort().join('-'); const p2 = [c, d].sort().join('-');
    partnerPairs.set(p1, (partnerPairs.get(p1) || 0) + 1);
    partnerPairs.set(p2, (partnerPairs.get(p2) || 0) + 1);
    for (const x of [a, b]) for (const y of [c, d]) {
      const key = [x, y].sort().join('-');
      opponentPairs.set(key, (opponentPairs.get(key) || 0) + 1);
    }
  }
  const partnershipPenalty = Array.from(partnerPairs.values()).reduce((acc, v) => acc + (v - 1) * 5, 0);
  const opponentPenalty = Array.from(opponentPairs.values()).reduce((acc, v) => acc + (v - 1) * 2, 0);
  return 10000 - (partnershipPenalty + opponentPenalty + balancePenalty * 20);
};

export const exportScheduleToCSV = (schedule: Schedule): string => {
  const headers = ['Match ID', 'Round', 'Court', 'Team 1 Player 1', 'Team 1 Player 2', 'Team 2 Player 1', 'Team 2 Player 2', 'Players Sitting Out'];
  const rows = schedule.matches.map(match => {
    const sittingOut = schedule.roundSittingOut[match.round] || [];
    const sittingOutNames = sittingOut.map(p => p.name).join('; ');
    return [
      match.id.toString(),
      match.round.toString(),
      match.court.toString(),
      match.players[0]?.name || '',
      match.players[1]?.name || '',
      match.players[2]?.name || '',
      match.players[3]?.name || '',
      sittingOutNames
    ];
  });
  return [headers, ...rows].map(r => r.map(cell => `"${cell}"`).join(',')).join('\n');
};
