import { Player, Match, ScheduleConfig, Schedule, ScoringWeights } from '@/types/schedule';

interface PlayerState {
id: number;
name: string;
matchCount: number;
lastPlayedRound: number;
partnerships: Map\<number, number>;
opponents: Map\<number, number>;
courtsPlayed: Set<number>;
}

interface MatchCandidate {
team1: \[number, number];
team2: \[number, number];
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

const shuffleArray = <T>(array: T\[]): T\[] => {
const shuffled = \[...array];
for (let i = shuffled.length - 1; i > 0; i--) {
const j = Math.floor(Math.random() \* (i + 1));
\[shuffled\[i], shuffled\[j]] = \[shuffled\[j], shuffled\[i]];
}
return shuffled;
};

const generatePlayerCombinations = (players: number\[]): number\[]\[] => {
const combinations: number\[]\[] = \[];
for (let i = 0; i < players.length - 3; i++) {
for (let j = i + 1; j < players.length - 2; j++) {
for (let k = j + 1; k < players.length - 1; k++) {
for (let l = k + 1; l < players.length; l++) {
combinations.push(\[players\[i], players\[j], players\[k], players\[l]]);
}
}
}
}
return combinations;
};

const generateTeamPairings = (fourPlayers: number\[]): { team1: \[number, number]; team2: \[number, number] }\[] => {
const \[a, b, c, d] = fourPlayers;
return \[
{ team1: \[a, b], team2: \[c, d] },
{ team1: \[a, c], team2: \[b, d] },
{ team1: \[a, d], team2: \[b, c] },
];
};

const calculatePartnershipScore = (
p1: number,
p2: number,
playerStates: Map\<number, PlayerState>
): number => {
const state1 = playerStates.get(p1)!;
const count = state1.partnerships.get(p2) || 0;
return count === 0 ? 500 : -500 - count \* 100;
};

const calculateOppositionScore = (
team1: \[number, number],
team2: \[number, number],
playerStates: Map\<number, PlayerState>
): number => {
let score = 0;
for (const p1 of team1) {
for (const p2 of team2) {
const cnt = playerStates.get(p1)!.opponents.get(p2) || 0;
if (cnt === 0) score += 200;
else if (cnt === 1) score += 50;
else score -= 100 \* (cnt - 1) \* (cnt - 1);
}
}
return score;
};

const calculateBalanceScore = (
playerIds: number\[],
playerStates: Map\<number, PlayerState>
): number => {
const counts = Array.from(playerStates.values()).map(s => s.matchCount);
const min = Math.min(...counts);
return playerIds.reduce((sum, id) => {
const m = playerStates.get(id)!.matchCount;
if (m === min) return sum + 300;
if (m === min + 1) return sum + 100;
return sum - 150 \* (m - min);
}, 0);
};

const calculateMustPlayScore = (
playerIds: number\[],
round: number,
playerStates: Map\<number, PlayerState>
): number => {
return playerIds.reduce((sum, id) => {
const st = playerStates.get(id)!;
let s = 0;
if (st.lastPlayedRound === round - 1) s += 1000;
const ago = round - st.lastPlayedRound - 1;
if (ago > 0) s += 50 \* ago;
return sum + s;
}, 0);
};

const calculateCourtScore = (
playerIds: number\[],
court: number,
playerStates: Map\<number, PlayerState>
): number => {
return playerIds.reduce((sum, id) => sum + (playerStates.get(id)!.courtsPlayed.has(court) ? -5 : 10), 0);
};

const scoreMatchCandidate = (
c: MatchCandidate,
round: number,
playerStates: Map\<number, PlayerState>,
config: ScheduleConfig,
w: ScoringWeights
): number => {
const all = \[...c.team1, ...c.team2];
const ps = calculatePartnershipScore(c.team1\[0], c.team1\[1], playerStates)
\+ calculatePartnershipScore(c.team2\[0], c.team2\[1], playerStates);
const os = calculateOppositionScore(c.team1, c.team2, playerStates);
const bs = calculateBalanceScore(all, playerStates);
const ms = calculateMustPlayScore(all, round, playerStates);
const cs = calculateCourtScore(all, c.court, playerStates);
return ps \* w\.partnership + os \* w\.opposition + bs \* w\.balance + ms \* w\.mustPlay + cs \* w\.court;
};

const updatePlayerStates = (
m: MatchCandidate,
round: number,
states: Map\<number, PlayerState>
): void => {
const all = \[...m.team1, ...m.team2];
all.forEach(id => {
const st = states.get(id)!;
st.matchCount++;
st.lastPlayedRound = round;
st.courtsPlayed.add(m.court);
});
const upd = (p1: number, p2: number) => {
const s1 = states.get(p1)!;
const s2 = states.get(p2)!;
s1.partnerships.set(p2, (s1.partnerships.get(p2) || 0) + 1);
s2.partnerships.set(p1, (s2.partnerships.get(p1) || 0) + 1);
};
upd(m.team1\[0], m.team1\[1]);
upd(m.team2\[0], m.team2\[1]);
m.team1.forEach(p1 => m.team2.forEach(p2 => {
const s1 = states.get(p1)!;
const s2 = states.get(p2)!;
s1.opponents.set(p2, (s1.opponents.get(p2) || 0) + 1);
s2.opponents.set(p1, (s2.opponents.get(p1) || 0) + 1);
}));
};

const generateSingleSchedule = (config: ScheduleConfig): Schedule => {
const { numRounds, numPlayers, numCourts, playerNames, scoringWeights } = config;
const weights = { ...defaultWeights, ...scoringWeights };
const players: Player\[] = Array.from({ length: numPlayers }, (\_, i) => ({ id: i+1, name: playerNames?.\[i] || `Player ${i+1}` }));
const matches: Match\[] = \[];
const roundSittingOut: Record\<number, Player\[]> = {};
const states = new Map(players.map(p => \[p.id, {
id: p.id, name: p.name, matchCount: 0, lastPlayedRound: -2,
partnerships: new Map(), opponents: new Map(), courtsPlayed: new Set()
}]));

for (let round=1; round<=numRounds; round++) {
const available = players.map(p => p.id);
const lastOut = round>1 ? (roundSittingOut\[round-1]?.map(p=>p.id)||\[]) : \[];
const roundMatches: MatchCandidate\[] = \[];
const usedPlayers = new Set<number>();
const usedCourts = new Set<number>();
let attempts=0;
const maxAttempts=200;
while (usedPlayers.size < available.length && roundMatches.length < numCourts && attempts++ < maxAttempts) {
const rem = available.filter(id=>!usedPlayers.has(id));
if (rem.length<4) break;
let must = lastOut.length>0 ? rem.filter(id=> lastOut.includes(id)) : \[];
let reg = lastOut.length>0 ? rem.filter(id=> !lastOut.includes(id)) : rem;
let combos = must.length>=4 ? generatePlayerCombinations(must)
: must.length>=2 ? generatePlayerCombinations(\[...must,...reg]).filter(c=> must.every(id=>c.includes(id)))
.length? generatePlayerCombinations(\[...must,...reg]).filter(c=> must.every(id=>c.includes(id)))
: generatePlayerCombinations(\[...must,...reg]).filter(c=> must.some(id=>c.includes(id)))
: generatePlayerCombinations(rem);
if (combos.length===0) break;
const candidates: MatchCandidate\[] = \[];
combos.forEach(combo => generateTeamPairings(combo).forEach(pair => {
shuffleArray(Array.from({length\:numCourts},(\_,i)=>i+1).filter(c=>!usedCourts.has(c)))
.forEach(court => {
const cand: MatchCandidate = { ...pair, court, score:0 };
cand.score = scoreMatchCandidate(cand, round, states, config, weights);
candidates.push(cand);
});
}));
if (!candidates.length) break;
const best = candidates.sort((a,b)=>b.score-a.score)\[0];
roundMatches.push(best);
\[...best.team1, ...best.team2].forEach(id=>usedPlayers.add(id));
usedCourts.add(best.court);
updatePlayerStates(best, round, states);
}
roundMatches.forEach(m=> matches.push({
id: matches.length+1,
court: m.court,
players: \[...m.team1, ...m.team2].map(id=> players.find(p=>p.id===id)!) as \[Player,Player,Player,Player],
round
}));
const inMatch = new Set(roundMatches.flatMap(m=>\[...m.team1,...m.team2]));
roundSittingOut\[round] = players.filter(p=>!inMatch.has(p.id));
}
const stats = players.map(p=>({ playerId\:p.id, playerName\:p.name, matchCount: states.get(p.id)!.matchCount }));
return { matches, playerStats: stats, roundSittingOut };
};

const scoreSchedule = (schedule: Schedule, config: ScheduleConfig): number => {
const counts = schedule.playerStats.map(p=>p.matchCount);
const min = Math.min(...counts), max = Math.max(...counts);
let score = 10000;
score -= (max-min)*500;
const allIds = schedule.playerStats.map(p=>p.playerId);
const rounds = Math.max(...schedule.matches.map(m=>m.round));
let consPen=0;
allIds.forEach(id=>{
let curr=0, mx=0;
for(let r=1;r<=rounds;r++){
const out = schedule.roundSittingOut\[r]?.map(p=>p.id)||\[];
if(out.includes(id)) curr++, mx=Math.max(mx,curr); else curr=0;
}
if(mx>1) consPen += Math.pow(mx,3)*1000;
});
score -= consPen;
const oppCounts = new Map\<string,number>();
const partCounts = new Map\<string,number>();
for(let i=0;i\<allIds.length;i++) for(let j=i+1;j\<allIds.length;j++) oppCounts.set(`${allIds[i]}-${allIds[j]}`,0);
schedule.matches.forEach(m=>{
const \[a,b,c,d] = m.players.map(p=>p.id);
\[\[a,b],\[c,d]].forEach(pair=>{
const key = `${pair[0]}-${pair[1]}`;
partCounts.set(key,(partCounts.get(key)||0)+1);
});
\[\[a,c],\[a,d],\[b,c],\[b,d]].forEach(pair=>{
const key = \[pair\[0],pair\[1]].sort().join('-');
oppCounts.set(key,(oppCounts.get(key)||0)+1);
});
});
const valsO = Array.from(oppCounts.values());
const rangeO = Math.max(...valsO)-Math.min(...valsO);
const varO = valsO.reduce((s,v,a)=> s+Math.pow(v-(a.reduce((x,y)=>x+y,0)/a.length),2),0)/valsO.length;
const zeros = valsO.filter(v=>v===0).length;
const highs = valsO.filter(v=>v>=3).length;
score -= rangeO*300 + varO*50 + zeros*100 + highs*200;
const repeats = Array.from(partCounts.values()).filter(v=>v>1).length;
score -= repeats\*5000;
if(rangeO<=1) score+=500;
if(zeros===0) score+=300;
return score;
};

const attemptSwap = (schedule: Schedule, config: ScheduleConfig): boolean => {
const curr = scoreSchedule(schedule, config);
for(let i=0;i\<schedule.matches.length;i++){
for(let j=i+1;j\<schedule.matches.length;j++){
const m1=schedule.matches\[i], m2=schedule.matches\[j];
for(let p1=0;p1<4;p1++) for(let p2=0;p2<4;p2++){
\[m1.players\[p1],m2.players\[p2]]=\[m2.players\[p2],m1.players\[p1]];
const after = scoreSchedule(schedule, config);
if(after>curr) return true;
\[m1.players\[p1],m2.players\[p2]]=\[m2.players\[p2],m1.players\[p1]];
}
}
}
return false;
};

const refineSchedule = (schedule: Schedule, config: ScheduleConfig): void => {
let improved=true;
while(improved) improved=attemptSwap(schedule, config);
};

export const generateSchedule = (config: ScheduleConfig): Schedule => {
const maxAttempts=100;
let best: Schedule|null=null;
let bestScore=-Infinity;
for(let i=0;i\<maxAttempts;i++){
const cand = generateSingleSchedule(config);
const sc = scoreSchedule(cand, config);
if(sc>bestScore){ bestScore=sc; best=cand; }
}
if(!best) throw new Error('No schedule');
refineSchedule(best, config);
return best;
};

export const exportScheduleToCSV = (schedule: Schedule): string => {
const hdr = \['Match ID','Round','Court','Team1P1','Team1P2','Team2P1','Team2P2','SittingOut'];
const rows = schedule.matches.map(m=>{
const out = schedule.roundSittingOut\[m.round]||\[];
return \[m.id,m.round,m.court,...m.players.map(p=>p.name),out.map(p=>p.name).join(';')];
});
return \[hdr,...rows].map(r=>r.join(',')).join('\n');
};
