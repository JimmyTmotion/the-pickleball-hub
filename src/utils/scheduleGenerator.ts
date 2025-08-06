import { Player, Match, ScheduleConfig, Schedule, ScoringWeights } from '@/types/schedule';

interface PlayerState {
  id: number;
  name: string;
  matchCount: number;
  lastPlayedRound: number;
  partnerships: Map<number, number>; // partnerId -> count
  opponents: Map<number, number>;   // opponentId -> count
  courtsPlayed: Set<number>;
}

interface MatchCandidate {
  team1: [number, number];
  team2: [number, number];
  court: number;
  score: number;
  isRepeatPartnership: boolean;
}

const defaultWeights: ScoringWeights = {
  balance:     2.0,
  mustPlay:    3.0,
  partnership: 1.5,
  opposition:  1.0,
  court:       0.3,
};

// Shuffle utility
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Generate all possible 4-player combinations
function generatePlayerCombinations(players: number[]): number[][] {
  const combos: number[][] = [];
  for (let i = 0; i < players.length - 3; i++) {
    for (let j = i + 1; j < players.length - 2; j++) {
      for (let k = j + 1; k < players.length - 1; k++) {
        for (let l = k + 1; l < players.length; l++) {
          combos.push([players[i], players[j], players[k], players[l]]);
        }
      }
    }
  }
  return combos;
}

// Generate all possible team pairings from 4 players
function generateTeamPairings(players: number[]): Array<{ team1: [number, number]; team2: [number, number] }> {
  const [a, b, c, d] = players;
  return [
    { team1: [a, b], team2: [c, d] },
    { team1: [a, c], team2: [b, d] },
    { team1: [a, d], team2: [b, c] },
  ];
}

// Scoring components
function calculatePartnershipScore(p1: number, p2: number, states: Map<number, PlayerState>): number {
  const cnt = states.get(p1)!.partnerships.get(p2) || 0;
  return cnt === 0 ? 500 : -500 - 100 * cnt;
}

function calculateOppositionScore(
  team1: [number, number],
  team2: [number, number],
  states: Map<number, PlayerState>
): number {
  let score = 0;
  for (const x of team1) {
    for (const y of team2) {
      const cnt = states.get(x)!.opponents.get(y) || 0;
      if (cnt === 0) score += 200;
      else if (cnt === 1) score += 50;
      else score -= 100 * (cnt - 1) * (cnt - 1);
    }
  }
  return score;
}

function calculateBalanceScore(ids: number[], states: Map<number, PlayerState>): number {
  const counts = Array.from(states.values()).map(s => s.matchCount);
  const min = Math.min(...counts);
  return ids.reduce((sum, id) => {
    const m = states.get(id)!.matchCount;
    if (m === min) return sum + 300;
    if (m === min + 1) return sum + 100;
    return sum - 150 * (m - min);
  }, 0);
}

function calculateMustPlayScore(
  ids: number[],
  round: number,
  states: Map<number, PlayerState>
): number {
  return ids.reduce((sum, id) => {
    const st = states.get(id)!;
    let s = 0;
    if (st.lastPlayedRound === round - 1) s += 1000;
    const gap = round - st.lastPlayedRound - 1;
    if (gap > 0) s += 50 * gap;
    return sum + s;
  }, 0);
}

function calculateCourtScore(ids: number[], court: number, states: Map<number, PlayerState>): number {
  return ids.reduce((sum, id) => sum + (states.get(id)!.courtsPlayed.has(court) ? -5 : 10), 0);
}

// Score a match candidate
function scoreMatchCandidate(
  cand: MatchCandidate,
  round: number,
  states: Map<number, PlayerState>,
  config: ScheduleConfig,
  w: ScoringWeights
): number {
  const all = [...cand.team1, ...cand.team2];
  const pScore =
    calculatePartnershipScore(cand.team1[0], cand.team1[1], states) +
    calculatePartnershipScore(cand.team2[0], cand.team2[1], states);
  const oScore = calculateOppositionScore(cand.team1, cand.team2, states);
  const bScore = calculateBalanceScore(all, states);
  const mScore = calculateMustPlayScore(all, round, states);
  const cScore = calculateCourtScore(all, cand.court, states);
  return pScore * w.partnership + oScore * w.opposition + bScore * w.balance + mScore * w.mustPlay + cScore * w.court;
}

// Update player states after a match
function updatePlayerStates(match: MatchCandidate, round: number, states: Map<number, PlayerState>): void {
  const all = [...match.team1, ...match.team2];
  for (const id of all) {
    const st = states.get(id)!;
    st.matchCount++;
    st.lastPlayedRound = round;
    st.courtsPlayed.add(match.court);
  }
  const upd = (x: number, y: number) => {
    states.get(x)!.partnerships.set(y, (states.get(x)!.partnerships.get(y) || 0) + 1);
    states.get(y)!.partnerships.set(x, (states.get(y)!.partnerships.get(x) || 0) + 1);
  };
  upd(match.team1[0], match.team1[1]);
  upd(match.team2[0], match.team2[1]);
  for (const x of match.team1) {
    for (const y of match.team2) {
      states.get(x)!.opponents.set(y, (states.get(x)!.opponents.get(y) || 0) + 1);
      states.get(y)!.opponents.set(x, (states.get(y)!.opponents.get(x) || 0) + 1);
    }
  }
}

// Generate one schedule attempt
function generateSingleSchedule(config: ScheduleConfig): Schedule {
  const { numRounds, numPlayers, numCourts, playerNames, scoringWeights } = config;
  const w = { ...defaultWeights, ...scoringWeights };
  const players: Player[] = Array.from({ length: numPlayers }, (_, i) => ({ id: i + 1, name: playerNames?.[i] || `Player ${i + 1}` }));
  const states = new Map<number, PlayerState>(
    players.map(p => [p.id, { id: p.id, name: p.name, matchCount: 0, lastPlayedRound: -2, partnerships: new Map(), opponents: new Map(), courtsPlayed: new Set() }])
  );
  const matches: Match[] = [];
  const roundSittingOut: Record<number, Player[]> = {};

  for (let round = 1; round <= numRounds; round++) {
    const available = players.map(p => p.id);
    const lastOut = round > 1 ? roundSittingOut[round - 1].map(p => p.id) : [];
    const roundMatches: MatchCandidate[] = [];
    const used = new Set<number>();
    const usedCourts = new Set<number>();
    let attempts = 0;

    while (used.size < available.length && roundMatches.length < numCourts && attempts++ < 200) {
      const rem = available.filter(id => !used.has(id));
      if (rem.length < 4) break;

      // build combinations
      let combos = generatePlayerCombinations(rem);

      // evaluate candidates
      const noRepeat: MatchCandidate[] = [];
      const withRepeat: MatchCandidate[] = [];
      for (const cmb of combos) {
        for (const pair of generateTeamPairings(cmb)) {
          for (const court of shuffleArray(Array.from({ length: numCourts }, (_, i) => i + 1).filter(c => !usedCourts.has(c)))) {
            const isRepeat = states.get(pair.team1[0])!.partnerships.get(pair.team1[1])! > 0 || states.get(pair.team2[0])!.partnerships.get(pair.team2[1])! > 0;
            const cand: MatchCandidate = { ...pair, court, score: 0, isRepeatPartnership: isRepeat };
            cand.score = scoreMatchCandidate(cand, round, states, config, w);
            if (isRepeat) withRepeat.push(cand);
            else noRepeat.push(cand);
          }
        }
      }

      const candidates = noRepeat.length ? noRepeat : withRepeat;
      if (!candidates.length) break;
      candidates.sort((a, b) => b.score - a.score);
      const best = candidates[0];

      roundMatches.push(best);
      [...best.team1, ...best.team2].forEach(id => used.add(id));
      usedCourts.add(best.court);
      updatePlayerStates(best, round, states);
    }

    for (const m of roundMatches) {
      matches.push({
        id: matches.length + 1,
        court: m.court,
        players: [...m.team1, ...m.team2].map(i => players.find(p => p.id === i)!) as [Player, Player, Player, Player],
        round,
      });
    }

    const inMatch = new Set(roundMatches.flatMap(m => [...m.team1, ...m.team2]));
    roundSittingOut[round] = players.filter(p => !inMatch.has(p.id));
  }

  const playerStats = players.map(p => ({ playerId: p.id, playerName: p.name, matchCount: states.get(p.id)!.matchCount }));
  return { matches, playerStats, roundSittingOut };
}

// Score full schedule
function scoreSchedule(schedule: Schedule, config: ScheduleConfig): number {
  const counts = schedule.playerStats.map(p => p.matchCount);
  const min = Math.min(...counts), max = Math.max(...counts);
  let score = 10000 - (max - min) * 500;

  const allIds = schedule.playerStats.map(p => p.playerId);
  const rounds = Math.max(...schedule.matches.map(m => m.round));
  let consPen = 0;
  for (const id of allIds) {
    let curr = 0, mx = 0;
    for (let r = 1; r <= rounds; r++) {
      const out = schedule.roundSittingOut[r]?.map(p => p.id) || [];
      if (out.includes(id)) { curr++; mx = Math.max(mx, curr); } else curr = 0;
    }
    if (mx > 1) consPen += Math.pow(mx, 3) * 1000;
  }
  score -= consPen;

  const oppCounts = new Map<string, number>();
  const partCounts = new Map<string, number>();
  for (let i = 0; i < allIds.length; i++)
    for (let j = i + 1; j < allIds.length; j++)
      oppCounts.set(`${allIds[i]}-${allIds[j]}`, 0);

  for (const m of schedule.matches) {
    const ids = m.players.map(p => p.id);
    [[ids[0], ids[1]], [ids[2], ids[3]]].forEach(pair => {
      const k = `${pair[0]}-${pair[1]}`;
      partCounts.set(k, (partCounts.get(k) || 0) + 1);
    });
    [[ids[0], ids[2]], [ids[0], ids[3]], [ids[1], ids[2]], [ids[1], ids[3]]].forEach(pair => {
      const k = [pair[0], pair[1]].sort().join('-');
      oppCounts.set(k, (oppCounts.get(k) || 0) + 1);
    });
  }

  const oppVals = Array.from(oppCounts.values());
  const rng = Math.max(...oppVals) - Math.min(...oppVals);
  const avg = oppVals.reduce((s, v) => s + v, 0) / oppVals.length;
  const varO = oppVals.reduce((s, v) => s + (v - avg) * (v - avg), 0) / oppVals.length;
  const zeros = oppVals.filter(v => v === 0).length;
  const highs = oppVals.filter(v => v >= 3).length;
  score -= rng * 300 + varO * 50 + zeros * 100 + highs * 200;

  const repeats = Array.from(partCounts.values()).filter(v => v > 1).length;
  score -= repeats * 5000;
  if (rng <= 1) score += 500;
  if (zeros === 0) score += 300;
  return score;
}

// Global optimization by swapping
function globalOptimize(schedule: Schedule, config: ScheduleConfig): void {
  let improved = true;
  while (improved) {
    improved = false;
    const base = scoreSchedule(schedule, config);
    outer: for (let i = 0; i < schedule.matches.length; i++) {
      for (let j = i + 1; j < schedule.matches.length; j++) {
        const m1 = schedule.matches[i], m2 = schedule.matches[j];
        for (let p1 = 0; p1 < 4; p1++) {
          for (let p2 = 0; p2 < 4; p2++) {
            [m1.players[p1], m2.players[p2]] = [m2.players[p2], m1.players[p1]];
            const after = scoreSchedule(schedule, config);
            if (after > base) { improved = true; break outer; }
            [m1.players[p1], m2.players[p2]] = [m2.players[p2], m1.players[p1]];
          }
        }
      }
    }
  }
}

// Main export
export function generateSchedule(config: ScheduleConfig): Schedule {
  let schedule = generateSingleSchedule(config);
  globalOptimize(schedule, config);
  return schedule;
}

// CSV export
export function exportScheduleToCSV(schedule: Schedule): string {
  const headers = ['Match ID','Round','Court','T1P1','T1P2','T2P1','T2P2','SittingOut'];
  const rows = schedule.matches.map(m => {
    const out = schedule.roundSittingOut[m.round] || [];
    return [
      m.id.toString(),
      m.round.toString(),
      m.court.toString(),
      ...m.players.map(p => p.name),
      out.map(p => p.name).join('; ')
    ];
  });
  return [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
}