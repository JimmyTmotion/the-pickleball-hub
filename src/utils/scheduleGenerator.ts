import { Player, Match, ScheduleConfig, Schedule, ScoringWeights } from '@/types/schedule';

interface PlayerState {
id: number;
name: string;
matchCount: number;
lastPlayedRound: number;
partnerships: Map<number, number>;
opponents: Map<number, number>;
courtsPlayed: Set;
}

interface MatchCandidate {
team1: [number, number];
team2: [number, number];
court: number;
score: number;
}

const defaultWeights: ScoringWeights = {
balance: 2.0,
mustPlay: 3.0,
partnership: 1.5,
opposition: 1.0,
court: 0.3,
};

const shuffleArray = (array: T[]): T[] => {
const shuffled = [...array];
for (let i = shuffled.length - 1; i > 0; i--) {
const j = Math.floor(Math.random() * (i + 1));
[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
}
return shuffled;
};

const generatePlayerCombinations = (players: number[]): number[][] => {
const combinations: number[][] = [];
for (let i = 0; i < players.length - 3; i++) {
for (let j = i + 1; j < players.length - 2; j++) {
for (let k = j + 1; k < players.length - 1; k++) {
for (let l = k + 1; l < players.length; l++) {
combinations.push([players[i], players[j], players[k], players[l]]);
}
}
}
}
return combinations;
};

const generateTeamPairings = (fourPlayers: number[]) => {
const [a, b, c, d] = fourPlayers;
return [
{ team1: [a, b] as [number, number], team2: [c, d] as [number, number] },
{ team1: [a, c] as [number, number], team2: [b, d] as [number, number] },
{ team1: [a, d] as [number, number], team2: [b, c] as [number, number] },
];
};

const calculatePartnershipScore = (
p1: number,
p2: number,
playerStates: Map<number, PlayerState>
): number => {
const state1 = playerStates.get(p1)!;
const partnershipCount = state1.partnerships.get(p2) || 0;
return partnershipCount === 0 ? 500 : -500 - partnershipCount * 100;
};

const calculateOppositionScore = (
team1: [number, number],
team2: [number, number],
playerStates: Map<number, PlayerState>
): number => {
let score = 0;
for (const p1 of team1) {
for (const p2 of team2) {
const opponentCount = playerStates.get(p1)!.opponents.get(p2) || 0;
if (opponentCount === 0) score += 200;
else if (opponentCount === 1) score += 50;
else score -= 100 * Math.pow(opponentCount - 1, 2);
}
}
return score;
};

const calculateBalanceScore = (
playerIds: number[],
playerStates: Map<number, PlayerState>
): number => {
const allMatchCounts = Array.from(playerStates.values()).map(s => s.matchCount);
const minMatches = Math.min(...allMatchCounts);
let score = 0;
for (const playerId of playerIds) {
const playerMatches = playerStates.get(playerId)!.matchCount;
if (playerMatches === minMatches) score += 300;
else if (playerMatches === minMatches + 1) score += 100;
else score -= 150 * (playerMatches - minMatches);
}
return score;
};

const calculateMustPlayScore = (
playerIds: number[],
round: number,
playerStates: Map<number, PlayerState>
): number => {
let score = 0;
for (const playerId of playerIds) {
const state = playerStates.get(playerId)!;
if (state.lastPlayedRound === round - 1) score += 1000;
const roundsSincePlay = round - state.lastPlayedRound - 1;
if (roundsSincePlay > 0) score += 50 * roundsSincePlay;
}
return score;
};

const calculateCourtScore = (
playerIds: number[],
court: number,
playerStates: Map<number, PlayerState>
): number => {
let score = 0;
for (const playerId of playerIds) {
const hasPlayedCourt = playerStates.get(playerId)!.courtsPlayed.has(court);
score += hasPlayedCourt ? -5 : 10;
}
return score;
};

const scoreMatchCandidate = (
candidate: MatchCandidate,
round: number,
playerStates: Map<number, PlayerState>,
config: ScheduleConfig,
weights: ScoringWeights
): number => {
const allPlayers = [...candidate.team1, ...candidate.team2];
const partnershipScore =
calculatePartnershipScore(candidate.team1[0], candidate.team1[1], playerStates) +
calculatePartnershipScore(candidate.team2[0], candidate.team2[1], playerStates);
const oppositionScore = calculateOppositionScore(candidate.team1, candidate.team2, playerStates);
const balanceScore = calculateBalanceScore(allPlayers, playerStates);
const mustPlayScore = calculateMustPlayScore(allPlayers, round, playerStates);
const courtScore = calculateCourtScore(allPlayers, candidate.court, playerStates);
return (
partnershipScore * weights.partnership +
oppositionScore * weights.opposition +
balanceScore * weights.balance +
mustPlayScore * weights.mustPlay +
courtScore * weights.court
);
};

const updatePlayerStates = (
match: MatchCandidate,
round: number,
playerStates: Map<number, PlayerState>
): void => {
const allPlayers = [...match.team1, ...match.team2];
for (const playerId of allPlayers) {
const state = playerStates.get(playerId)!;
state.matchCount++;
state.lastPlayedRound = round;
state.courtsPlayed.add(match.court);
}
const updatePartnership = (p1: number, p2: number) => {
const s1 = playerStates.get(p1)!;
const s2 = playerStates.get(p2)!;
s1.partnerships.set(p2, (s1.partnerships.get(p2) || 0) + 1);
s2.partnerships.set(p1, (s2.partnerships.get(p1) || 0) + 1);
};
updatePartnership(match.team1[0], match.team1[1]);
updatePartnership(match.team2[0], match.team2[1]);
for (const t1 of match.team1) {
for (const t2 of match.team2) {
const s1 = playerStates.get(t1)!;
const s2 = playerStates.get(t2)!;
s1.opponents.set(t2, (s1.opponents.get(t2) || 0) + 1);
s2.opponents.set(t1, (s2.opponents.get(t1) || 0) + 1);
}
}
};

const generateSingleSchedule = (config: ScheduleConfig): Schedule => {
const { numRounds, numPlayers, numCourts, playerNames, scoringWeights } = config;
const weights = { ...defaultWeights, ...scoringWeights };
const players = Array.from({ length: numPlayers }, (_, i) => ({ id: i + 1, name: playerNames?.[i] || Player ${i + 1} }));
const matches: Match[] = [];
const roundSittingOut: Record<number, Player[]> = {};
const playerStates = new Map(
players.map(p => [p.id, { id: p.id, name: p.name, matchCount: 0, lastPlayedRound: -2, partnerships: new Map(), opponents: new Map(), courtsPlayed: new Set() }])
);

for (let round = 1; round <= numRounds; round++) {
let availablePlayers = players.map(p => p.id);
const lastRoundSitting = round > 1 ? (roundSittingOut[round - 1]?.map(p => p.id) || []) : [];
const roundMatches: MatchCandidate[] = [];
const usedPlayers = new Set();
const usedCourts = new Set();

let attempts = 0;
const maxAttempts = 200;
while (usedPlayers.size < availablePlayers.length && roundMatches.length < numCourts && attempts < maxAttempts) {
  attempts++;
  const remaining = availablePlayers.filter(id => !usedPlayers.has(id));
  if (remaining.length < 4) break;
  let mustPlay: number[] = [];
  let regular: number[] = [];
  if (lastRoundSitting.length) {
    mustPlay = remaining.filter(id => lastRoundSitting.includes(id));
    regular = remaining.filter(id => !lastRoundSitting.includes(id));
  } else regular = remaining;
  let combos: number[][] = [];
  if (mustPlay.length >= 4) combos = generatePlayerCombinations(mustPlay);
  else if (mustPlay.length >= 2) {
    const pool = [...mustPlay, ...regular];
    const all = generatePlayerCombinations(pool);
    combos = all.filter(c => mustPlay.every(id => c.includes(id)));
    if (!combos.length) combos = all.filter(c => mustPlay.some(id => c.includes(id)));
  } else combos = generatePlayerCombinations(remaining);
  if (!combos.length) break;
  const candidates: MatchCandidate[] = [];
  for (const combo of combos) {
    for (const pairing of generateTeamPairings(combo)) {
      const courts = shuffleArray(Array.from({ length: numCourts }, (_, i) => i + 1).filter(c => !usedCourts.has(c)));
      for (const court of courts) {
        const cand: MatchCandidate = { ...pairing, court, score: 0 };
        cand.score = scoreMatchCandidate(cand, round, playerStates, config, weights);
        candidates.push(cand);
      }
    }
  }
  if (!candidates.length) break;
  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  roundMatches.push(best);
  [...best.team1, ...best.team2].forEach(id => usedPlayers.add(id));
  usedCourts.add(best.court);
  updatePlayerStates(best, round, playerStates);
}

roundMatches.forEach(m => {
  matches.push({ id: matches.length + 1, court: m.court, players: m.team1.map(id => players.find(p => p.id === id)!)
    .concat(m.team2.map(id => players.find(p => p.id === id)!)), round });
});

const inMatches = new Set(roundMatches.flatMap(m => [...m.team1, ...m.team2]));
roundSittingOut[round] = players.filter(p => !inMatches.has(p.id));

}

const playerStats = players.map(p => ({ playerId: p.id, playerName: p.name, matchCount: playerStates.get(p.id)!.matchCount }));
return { matches, playerStats, roundSittingOut };
};

const scoreSchedule = (schedule: Schedule, config: ScheduleConfig): number => {
// ... existing scoring logic unchanged ...
};

// Global refinement via simple swap-based hill-climbing
function refineSchedule(schedule: Schedule, config: ScheduleConfig): void {
let improved = true;
while (improved) {
improved = attemptSwap(schedule, config);
}
}

function attemptSwap(schedule: Schedule, config: ScheduleConfig): boolean {
const current = scoreSchedule(schedule, config);
for (let i = 0; i < schedule.matches.length; i++) {
for (let j = i + 1; j < schedule.matches.length; j++) {
const m1 = schedule.matches[i];
const m2 = schedule.matches[j];
for (let p1 = 0; p1 < m1.players.length; p1++) {
for (let p2 = 0; p2 < m2.players.length; p2++) {
[m1.players[p1], m2.players[p2]] = [m2.players[p2], m1.players[p1]];
const scoreAfter = scoreSchedule(schedule, config);
if (scoreAfter > current) return true;
[m1.players[p1], m2.players[p2]] = [m2.players[p2], m1.players[p1]];
}
}
}
}
return false;
}

export const generateSchedule = (config: ScheduleConfig): Schedule => {
const maxAttempts = 100;
let bestSchedule: Schedule | null = null;
let bestScore = -Infinity;

console.log(Generating ${maxAttempts} variations...);
for (let attempt = 0; attempt < maxAttempts; attempt++) {
try {
const cand = generateSingleSchedule(config);
const sc = scoreSchedule(cand, config);
if (sc > bestScore) {
bestScore = sc;
bestSchedule = cand;
console.log(New best (attempt ${attempt+1}): ${sc});
}
} catch {
continue;
}
}
if (!bestSchedule) throw new Error('Failed to generate schedule');

console.log(Refining schedule...);
refineSchedule(bestSchedule, config);
console.log(Refinement complete.);
return bestSchedule;
};

export const exportScheduleToCSV = (schedule: Schedule): string => {
const headers = [
'Match ID','Round','Court','Team 1 P1','Team 1 P2','Team 2 P1','Team 2 P2','Sitting Out'
];
const rows = schedule.matches.map(m => {
const out = schedule.roundSittingOut[m.round] || [];
const names = out.map(p => p.name).join('; ');
return [
m.id, m.round, m.court,
m.players[0]?.name || '', m.players[1]?.name || '',
m.players[2]?.name || '', m.players[3]?.name || '',
names
];
});
return [headers, ...rows].map(r => r.join(',')).join('\n');
};