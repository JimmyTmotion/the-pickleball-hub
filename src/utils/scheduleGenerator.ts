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
}

const defaultWeights: ScoringWeights = {
  balance:    2.0,
  mustPlay:   3.0,
  partnership:1.5,
  opposition: 1.0,
  court:      0.3,
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

// Combinations
function generatePlayerCombinations(players: number[]): number[][] {
  const combos: number[][] = [];
  for (let i = 0; i < players.length - 3; i++)
    for (let j = i + 1; j < players.length - 2; j++)
      for (let k = j + 1; k < players.length - 1; k++)
        for (let l = k + 1; l < players.length; l++)
          combos.push([players[i], players[j], players[k], players[l]]);
  return combos;
}

// Pairings
function generateTeamPairings(four: number[]): {team1:[number,number];team2:[number,number]}[] {
  const [a,b,c,d] = four;
  return [
    { team1:[a,b], team2:[c,d] },
    { team1:[a,c], team2:[b,d] },
    { team1:[a,d], team2:[b,c] },
  ];
}

// Scoring components
function calculatePartnershipScore(p1:number,p2:number,states:Map<number,PlayerState>):number{
  const cnt = states.get(p1)!.partnerships.get(p2)||0;
  return cnt===0?500:-500 - 100*cnt;
}

function calculateOppositionScore(team1:[number,number],team2:[number,number],states:Map<number,PlayerState>):number{
  let score=0;
  for(const x of team1) for(const y of team2){
    const cnt=states.get(x)!.opponents.get(y)||0;
    score += cnt===0?200:cnt===1?50:-100*(cnt-1)*(cnt-1);
  }
  return score;
}

function calculateBalanceScore(ids:number[],states:Map<number,PlayerState>):number{
  const counts = Array.from(states.values()).map(s=>s.matchCount);
  const min = Math.min(...counts);
  return ids.reduce((sum,id)=>{
    const m=states.get(id)!.matchCount;
    return sum + (m===min?300:m===min+1?100:-150*(m-min));
  },0);
}

function calculateMustPlayScore(ids:number[],round:number,states:Map<number,PlayerState>):number{
  return ids.reduce((sum,id)=>{
    const st=states.get(id)!;
    let s=0;
    if(st.lastPlayedRound===round-1) s+=1000;
    const gap=round-st.lastPlayedRound-1;
    if(gap>0) s+=50*gap;
    return sum+s;
  },0);
}

function calculateCourtScore(ids:number[],court:number,states:Map<number,PlayerState>):number{
  return ids.reduce((sum,id)=>sum + (states.get(id)!.courtsPlayed.has(court)?-5:10),0);
}

// Score a match candidate
function scoreMatchCandidate(
  cand:MatchCandidate, round:number,
  states:Map<number,PlayerState>, config:ScheduleConfig, w:ScoringWeights
):number{
  const all=[...cand.team1,...cand.team2];
  const pScore = calculatePartnershipScore(cand.team1[0],cand.team1[1],states)
               + calculatePartnershipScore(cand.team2[0],cand.team2[1],states);
  const oScore = calculateOppositionScore(cand.team1,cand.team2,states);
  const bScore = calculateBalanceScore(all,states);
  const mScore = calculateMustPlayScore(all,round,states);
  const cScore = calculateCourtScore(all,cand.court,states);
  return pScore*w.partnership + oScore*w.opposition + bScore*w.balance + mScore*w.mustPlay + cScore*w.court;
}

// Update states
function updatePlayerStates(match:MatchCandidate,round:number,states:Map<number,PlayerState>):void{
  const all=[...match.team1,...match.team2];
  all.forEach(id=>{
    const st=states.get(id)!;
    st.matchCount++; st.lastPlayedRound=round;
    st.courtsPlayed.add(match.court);
  });
  const upd=(x:number,y:number)=>{
    states.get(x)!.partnerships.set(y,(states.get(x)!.partnerships.get(y)||0)+1);
    states.get(y)!.partnerships.set(x,(states.get(y)!.partnerships.get(x)||0)+1);
  };
  upd(match.team1[0],match.team1[1]);
  upd(match.team2[0],match.team2[1]);
  for(const x of match.team1) for(const y of match.team2){
    states.get(x)!.opponents.set(y,(states.get(x)!.opponents.get(y)||0)+1);
    states.get(y)!.opponents.set(x,(states.get(y)!.opponents.get(x)||0)+1);
  }
}

// Generate one attempt
function generateSingleSchedule(config:ScheduleConfig):Schedule{
  const {numRounds,numPlayers,numCourts,playerNames,scoringWeights} = config;
  const w = {...defaultWeights,...scoringWeights};
  const players:Player[] = Array.from({length:numPlayers},(_,i)=>({id:i+1,name:playerNames?.[i]||`Player ${i+1}`}));
  const states = new Map<number,PlayerState>(players.map(p=>[p.id,{id:p.id,name:p.name,matchCount:0,lastPlayedRound:-2,partnerships:new Map(),opponents:new Map(),courtsPlayed:new Set()}]));
  const matches:Match[]=[];
  const roundSittingOut:Record<number,Player[]>={};
  for(let round=1;round<=numRounds;round++){
    const available=players.map(p=>p.id);
    const lastOut = round>1?(roundSittingOut[round-1].map(p=>p.id)||[]):[];
    const roundMatches:MatchCandidate[]=[];
    const used=new Set<number>(); const usedCourts=new Set<number>();
    let attempts=0;
    while(used.size<available.length && roundMatches.length<numCourts && attempts++<200){
      const rem=available.filter(id=>!used.has(id)); if(rem.length<4) break;
      let must = rem.filter(id=>lastOut.includes(id));
      let reg  = rem.filter(id=>!lastOut.includes(id));
      let combos = must.length>=4? generatePlayerCombinations(must)
                 : must.length>=2? (()=>{const pool=[...must,...reg]; let c=generatePlayerCombinations(pool).filter(c=>must.every(id=>c.includes(id))); if(!c.length) c=generatePlayerCombinations(pool).filter(c=>must.some(id=>c.includes(id))); return c;})()
                 : generatePlayerCombinations(rem);
      if(!combos.length) break;
      const cands:MatchCandidate[]=[];
      combos.forEach(cmb=> generateTeamPairings(cmb).forEach(pair=>{
        shuffleArray(Array.from({length:numCourts},(_,i)=>i+1).filter(c=>!usedCourts.has(c))).forEach(ct=>{
          const cand:MatchCandidate={...pair,court:ct,score:0};
          cand.score=scoreMatchCandidate(cand,round,states,config,w);
          cands.push(cand);
        });
      }));
      if(!cands.length) break;
      cands.sort((a,b)=>b.score-a.score);
      const best=cands[0]; roundMatches.push(best);
      [...best.team1,...best.team2].forEach(id=>used.add(id)); usedCourts.add(best.court);
      updatePlayerStates(best,round,states);
    }
    // commit matches
    roundMatches.forEach(m=>matches.push({id:matches.length+1,court:m.court,players:[...m.team1,...m.team2].map(i=>players.find(p=>p.id===i)!) as [Player,Player,Player,Player],round}));
    const inMatch=new Set(roundMatches.flatMap(m=>[...m.team1,...m.team2]));
    roundSittingOut[round]=players.filter(p=>!inMatch.has(p.id));
  }
  const stats = players.map(p=>({playerId:p.id,playerName:p.name,matchCount:states.get(p.id)!.matchCount}));
  return {matches,playerStats:stats,roundSittingOut};
}

// Score full schedule
function scoreSchedule(schedule:Schedule,config:ScheduleConfig):number{
  const counts=schedule.playerStats.map(p=>p.matchCount);
  const min=Math.min(...counts), max=Math.max(...counts);
  let score=10000 - (max-min)*500;
  const allIds=schedule.playerStats.map(p=>p.playerId);
  const rounds=Math.max(...schedule.matches.map(m=>m.round));
  let pen=0;
  allIds.forEach(id=>{let cur=0,mx=0; for(let r=1;r<=rounds;r++){const out=schedule.roundSittingOut[r]?.map(p=>p.id)||[]; if(out.includes(id)){cur++; mx=Math.max(mx,cur);} else cur=0;} if(mx>1) pen+=Math.pow(mx,3)*1000;});
  score-=pen;
  const opp=new Map<string,number>(); const part=new Map<string,number>();
  allIds.forEach((a,i)=> allIds.slice(i+1).forEach(b=>opp.set(`${a}-${b}`,0)));
  schedule.matches.forEach(m=>{
    const ids=m.players.map(p=>p.id);
    [[ids[0],ids[1]],[ids[2],ids[3]]].forEach(p=>{const k=`${p[0]}-${p[1]}`; part.set(k,(part.get(k)||0)+1);});
    [[ids[0],ids[2]],[ids[0],ids[3]],[ids[1],ids[2]],[ids[1],ids[3]]].forEach(p=>{const k=[p[0],p[1]].sort().join('-'); opp.set(k,(opp.get(k)||0)+1);});
  });
  const vals=Array.from(opp.values()), rng=Math.max(...vals)-Math.min(...vals), avg=vals.reduce((s,v)=>s+v,0)/vals.length;
  const varO=vals.reduce((s,v)=>s+(v-avg)*(v-avg),0)/vals.length;
  const zeros=vals.filter(v=>v===0).length, highs=vals.filter(v=>v>=3).length;
  score -= rng*300 + varO*50 + zeros*100 + highs*200;
  const repeats=Array.from(part.values()).filter(v=>v>1).length;
  score -= repeats*5000;
  if(rng<=1) score+=500; if(zeros===0) score+=300;
  return score;
}

// Global optimization by swapping
function globalOptimize(schedule:Schedule,config:ScheduleConfig):void{
  let improved=true;
  while(improved){
    improved=false;
    const base=scoreSchedule(schedule,config);
    outer: for(let i=0;i<schedule.matches.length;i++){
      for(let j=i+1;j<schedule.matches.length;j++){
        const m1=schedule.matches[i], m2=schedule.matches[j];
        for(let p1=0;p1<4;p1++){
          for(let p2=0;p2<4;p2++){
            [m1.players[p1],m2.players[p2]]=[m2.players[p2],m1.players[p1]];
            const after=scoreSchedule(schedule,config);
            if(after>base){ improved=true; break outer;} else [m1.players[p1],m2.players[p2]]=[m2.players[p2],m1.players[p1]];
          }
        }
      }
    }
  }
}

// Main export
export function generateSchedule(config:ScheduleConfig):Schedule{
  let best = generateSingleSchedule(config);
  globalOptimize(best,config);
  return best;
}

// CSV output
export function exportScheduleToCSV(schedule:Schedule):string{
  const hdr=['Match ID','Round','Court','T1P1','T1P2','T2P1','T2P2','SittingOut'];
  const rows = schedule.matches.map(m=>{
    const out = schedule.roundSittingOut[m.round]||[];
    return [m.id.toString(),m.round.toString(),m.court.toString(),...m.players.map(p=>p.name),out.map(p=>p.name).join('; ')];
  });
  return [hdr,...rows].map(r=>r.map(c=>`"${c}"`).join(',')).join('\n');
}
