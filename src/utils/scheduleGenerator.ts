// Global Optimized Pickleball Scheduler with Hard Opponent Gap Constraint

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

interface PlayerStats {
  matchCount: number;
  partnerships: Set<string>;
  opponents: Map<number, number>;
  courtsPlayed: Set<number>;
  sitOutRounds: Set<number>;
}

const getScheduleScore = (schedule: Match[], numRounds: number, numPlayers: number): number => {
  const stats: Record<number, PlayerStats> = {};
  const opponentCounts = new Map<string, number>();

  for (let i = 1; i <= numPlayers; i++) {
    stats[i] = {
      matchCount: 0,
      partnerships: new Set(),
      opponents: new Map(),
      courtsPlayed: new Set(),
      sitOutRounds: new Set()
    };
  }

  const roundMap: Record<number, Set<number>> = {};

  for (const match of schedule) {
    const ids = match.players.map(p => p.id);
    for (const id of ids) {
      stats[id].matchCount++;
      stats[id].courtsPlayed.add(match.court);
    }

    stats[ids[0]].partnerships.add(`${ids[0]}-${ids[1]}`);
    stats[ids[1]].partnerships.add(`${ids[0]}-${ids[1]}`);
    stats[ids[2]].partnerships.add(`${ids[2]}-${ids[3]}`);
    stats[ids[3]].partnerships.add(`${ids[2]}-${ids[3]}`);

    for (const i of [0, 1]) {
      for (const j of [2, 3]) {
        stats[ids[i]].opponents.set(ids[j], (stats[ids[i]].opponents.get(ids[j]) || 0) + 1);
        stats[ids[j]].opponents.set(ids[i], (stats[ids[j]].opponents.get(ids[i]) || 0) + 1);

        const key = ids[i] < ids[j] ? `${ids[i]}-${ids[j]}` : `${ids[j]}-${ids[i]}`;
        opponentCounts.set(key, (opponentCounts.get(key) || 0) + 1);
      }
    }

    roundMap[match.round] ??= new Set();
    ids.forEach(id => roundMap[match.round].add(id));
  }

  for (let r = 1; r <= numRounds; r++) {
    const played = roundMap[r] ?? new Set();
    for (let i = 1; i <= numPlayers; i++) {
      if (!played.has(i)) stats[i].sitOutRounds.add(r);
    }
  }

  // Opponent fairness hard constraint
  const opponentFreqs = [...opponentCounts.values()];
  const maxOpponent = Math.max(...opponentFreqs);
  const minOpponent = Math.min(...opponentFreqs);
  if (maxOpponent - minOpponent > 1) return Infinity;

  let partnershipPenalty = 0;
  let opponentPenalty = 0;
  let courtPenalty = 0;
  let sitOutPenalty = 0;

  const matchCounts = Object.values(stats).map(s => s.matchCount);
  const variance = Math.max(...matchCounts) - Math.min(...matchCounts);

  for (const s of Object.values(stats)) {
    partnershipPenalty += s.partnerships.size;
    opponentPenalty += s.opponents.size;
    courtPenalty += s.courtsPlayed.size;

    const sorted = [...s.sitOutRounds].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === sorted[i - 1] + 1) sitOutPenalty += 1;
    }
  }

  return (
    -partnershipPenalty * 5 -
    opponentPenalty * 3 -
    courtPenalty * 1 -
    sitOutPenalty * 50 +
    variance * 100
  );
};

export const generateSchedule = (config: ScheduleConfig): Schedule => {
  const { numRounds, numPlayers, numCourts, playerNames, randomSeed } = config;
  const rng = new SeededRandom(randomSeed || Date.now());

  const players: Player[] = Array.from({ length: numPlayers }, (_, i) => ({
    id: i + 1,
    name: playerNames?.[i] || `Player ${i + 1}`
  }));

  const allPlayerIds = players.map(p => p.id);
  const playersPerRound = numCourts * 4;

  const generateInitialSchedule = (): Match[] => {
    const matches: Match[] = [];
    for (let round = 1; round <= numRounds; round++) {
      const shuffled = rng.shuffle([...allPlayerIds]);
      const roundPlayers = shuffled.slice(0, playersPerRound);
      for (let c = 0; c < numCourts; c++) {
        const idx = c * 4;
        if (idx + 3 >= roundPlayers.length) break;
        matches.push({
          id: matches.length + 1,
          round,
          court: c + 1,
          players: [
            players.find(p => p.id === roundPlayers[idx])!,
            players.find(p => p.id === roundPlayers[idx + 1])!,
            players.find(p => p.id === roundPlayers[idx + 2])!,
            players.find(p => p.id === roundPlayers[idx + 3])!
          ]
        });
      }
    }
    return matches;
  };

  let current = generateInitialSchedule();
  let currentScore = getScheduleScore(current, numRounds, numPlayers);
  let best = [...current];
  let bestScore = currentScore;

  let temp = 1000;
  const cooling = 0.995;
  const steps = 20000;

  for (let step = 0; step < steps; step++) {
    const next = [...current];

    const i = Math.floor(rng.next() * next.length);
    const j = Math.floor(rng.next() * next.length);
    const m1 = next[i];
    const m2 = next[j];

    const pi = Math.floor(rng.next() * 4);
    const pj = Math.floor(rng.next() * 4);
    const tempPlayer = m1.players[pi];
    m1.players[pi] = m2.players[pj];
    m2.players[pj] = tempPlayer;

    const score = getScheduleScore(next, numRounds, numPlayers);
    const delta = score - currentScore;

    if (score !== Infinity && (delta < 0 || Math.exp(-delta / temp) > rng.next())) {
      current = next;
      currentScore = score;
      if (score < bestScore) {
        best = [...next];
        bestScore = score;
      }
    } else {
      m2.players[pj] = m1.players[pi];
      m1.players[pi] = tempPlayer;
    }

    temp *= cooling;
  }

  const playerStats = players.map(p => ({
    playerId: p.id,
    playerName: p.name,
    matchCount: best.filter(m => m.players.some(pl => pl.id === p.id)).length
  }));

  const roundSittingOut: Record<number, Player[]> = {};
  for (let round = 1; round <= numRounds; round++) {
    const playing = best.filter(m => m.round === round).flatMap(m => m.players.map(p => p.id));
    roundSittingOut[round] = players.filter(p => !playing.includes(p.id));
  }

  return { matches: best, playerStats, roundSittingOut };
};
