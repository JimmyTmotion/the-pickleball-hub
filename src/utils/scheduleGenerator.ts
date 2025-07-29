// Global Optimized Pickleball Scheduler with Strict Fairness Constraints

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
  partnerships: Map<number, number>;
  opponents: Map<number, number>;
  courtsPlayed: Set<number>;
  sitOutRounds: Set<number>;
}

const getScheduleScore = (schedule: Match[], numRounds: number, numPlayers: number): number => {
  const stats: Record<number, PlayerStats> = {};

  for (let i = 1; i <= numPlayers; i++) {
    stats[i] = {
      matchCount: 0,
      partnerships: new Map(),
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

    const updateMap = (map: Map<number, number>, key: number) => {
      map.set(key, (map.get(key) || 0) + 1);
    };

    // Partnerships
    updateMap(stats[ids[0]].partnerships, ids[1]);
    updateMap(stats[ids[1]].partnerships, ids[0]);
    updateMap(stats[ids[2]].partnerships, ids[3]);
    updateMap(stats[ids[3]].partnerships, ids[2]);

    // Opponents
    for (const i of [0, 1]) {
      for (const j of [2, 3]) {
        updateMap(stats[ids[i]].opponents, ids[j]);
        updateMap(stats[ids[j]].opponents, ids[i]);
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

  // Strict fairness constraint: no player can partner with or face someone more than once above the min
  for (const stat of Object.values(stats)) {
    const partnerCounts = [...stat.partnerships.values()];
    const opponentCounts = [...stat.opponents.values()];

    if (partnerCounts.length > 1) {
      const max = Math.max(...partnerCounts);
      const min = Math.min(...partnerCounts);
      if (max - min > 1) return Infinity;
    }

    if (opponentCounts.length > 1) {
      const max = Math.max(...opponentCounts);
      const min = Math.min(...opponentCounts);
      if (max - min > 1) return Infinity;
    }
  }

  let courtPenalty = 0;
  let sitOutPenalty = 0;
  const matchCounts = Object.values(stats).map(s => s.matchCount);
  const variance = Math.max(...matchCounts) - Math.min(...matchCounts);

  for (const s of Object.values(stats)) {
    courtPenalty += s.courtsPlayed.size;

    const sorted = [...s.sitOutRounds].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === sorted[i - 1] + 1) sitOutPenalty += 1;
    }
  }

  return (
    -courtPenalty * 1 -
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
  const steps = 30000;

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
