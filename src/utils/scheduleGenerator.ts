import { Player, Match, ScheduleConfig, Schedule, ScoringWeights } from '@/types/schedule';

interface PlayerState {
  id: number;
  name: string;
  matchCount: number;
  lastPlayedRound: number;
  partnerships: Map<number, number>; // partnerId -> count
  opponents: Map<number, number>; // opponentId -> count
  courtsPlayed: Set<number>;
}

interface MatchCandidate {
  team1: [number, number];
  team2: [number, number];
  court: number;
  score: number;
}

const defaultWeights: ScoringWeights = {
  balance: 2.0,     // Higher priority for match balance
  mustPlay: 3.0,    // Highest priority for avoiding consecutive sitting
  partnership: 1.5, // Important for partnership diversity
  opposition: 1.0,  // Base weight for opponent diversity
  court: 0.3,       // Lower priority for court variety
};

// Utility function for array shuffling using Fisher-Yates algorithm
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Generate all possible 4-player combinations from available players
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

// Generate all possible team pairings from 4 players
const generateTeamPairings = (fourPlayers: number[]): { team1: [number, number], team2: [number, number] }[] => {
  const [a, b, c, d] = fourPlayers;
  return [
    { team1: [a, b] as [number, number], team2: [c, d] as [number, number] },
    { team1: [a, c] as [number, number], team2: [b, d] as [number, number] },
    { team1: [a, d] as [number, number], team2: [b, c] as [number, number] },
  ];
};

// Calculate partnership score for two players
const calculatePartnershipScore = (
  p1: number, 
  p2: number, 
  playerStates: Map<number, PlayerState>,
  prioritizeUnique: boolean
): number => {
  const state1 = playerStates.get(p1)!;
  const partnershipCount = state1.partnerships.get(p2) || 0;
  
  if (prioritizeUnique) {
    // Heavily penalize repeated partnerships when prioritizing unique partnerships
    return partnershipCount === 0 ? 100 : -200 * Math.pow(partnershipCount, 2);
  } else {
    // Less penalty for repeated partnerships when prioritizing varied opposition
    return partnershipCount === 0 ? 50 : -50 * partnershipCount;
  }
};

// Calculate opposition score for team matchup
const calculateOppositionScore = (
  team1: [number, number], 
  team2: [number, number], 
  playerStates: Map<number, PlayerState>,
  prioritizeUnique: boolean
): number => {
  let score = 0;
  
  for (const p1 of team1) {
    for (const p2 of team2) {
      const opponentCount = playerStates.get(p1)!.opponents.get(p2) || 0;
      
      if (prioritizeUnique) {
        // Less emphasis on opponent variety when prioritizing partnerships
        score += opponentCount === 0 ? 50 : -25 * opponentCount;
      } else {
        // Higher emphasis on opponent variety
        score += opponentCount === 0 ? 100 : -100 * Math.pow(opponentCount, 1.5);
      }
    }
  }
  
  return score;
};

// Calculate match balance score
const calculateBalanceScore = (
  playerIds: number[], 
  playerStates: Map<number, PlayerState>,
  balanceEnabled: boolean
): number => {
  if (!balanceEnabled) return 0;
  
  const allMatchCounts = Array.from(playerStates.values()).map(s => s.matchCount);
  const minMatches = Math.min(...allMatchCounts);
  const maxMatches = Math.max(...allMatchCounts);
  
  let score = 0;
  for (const playerId of playerIds) {
    const playerMatches = playerStates.get(playerId)!.matchCount;
    
    // Heavily favor players with fewer matches
    if (playerMatches === minMatches) {
      score += 300;
    } else if (playerMatches === minMatches + 1) {
      score += 100;
    } else {
      score -= 150 * (playerMatches - minMatches);
    }
  }
  
  return score;
};

// Calculate must-play score for avoiding consecutive sitting
const calculateMustPlayScore = (
  playerIds: number[], 
  round: number,
  playerStates: Map<number, PlayerState>,
  avoidConsecutive: boolean
): number => {
  if (!avoidConsecutive) return 0;
  
  let score = 0;
  for (const playerId of playerIds) {
    const state = playerStates.get(playerId)!;
    
    // Heavily favor players who sat out last round
    if (state.lastPlayedRound === round - 1) {
      score += 1000;
    }
    
    // Also consider how long since they played
    const roundsSincePlay = round - state.lastPlayedRound - 1;
    if (roundsSincePlay > 0) {
      score += 50 * roundsSincePlay;
    }
  }
  
  return score;
};

// Calculate court variety score
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

// Score a match candidate
const scoreMatchCandidate = (
  candidate: MatchCandidate,
  round: number,
  playerStates: Map<number, PlayerState>,
  config: ScheduleConfig,
  weights: ScoringWeights
): number => {
  const allPlayers = [...candidate.team1, ...candidate.team2];
  
  const partnershipScore = 
    calculatePartnershipScore(candidate.team1[0], candidate.team1[1], playerStates, config.prioritizeUniquePartnerships || false) +
    calculatePartnershipScore(candidate.team2[0], candidate.team2[1], playerStates, config.prioritizeUniquePartnerships || false);
  
  const oppositionScore = calculateOppositionScore(
    candidate.team1, 
    candidate.team2, 
    playerStates, 
    config.prioritizeUniquePartnerships || false
  );
  
  const balanceScore = calculateBalanceScore(allPlayers, playerStates, config.balanceMatchCounts || false);
  const mustPlayScore = calculateMustPlayScore(allPlayers, round, playerStates, config.avoidConsecutiveSittingOut || false);
  const courtScore = calculateCourtScore(allPlayers, candidate.court, playerStates);
  
  return (
    (partnershipScore * weights.partnership) +
    (oppositionScore * weights.opposition) +
    (balanceScore * weights.balance) +
    (mustPlayScore * weights.mustPlay) +
    (courtScore * weights.court)
  );
};

// Update player states after a match is assigned
const updatePlayerStates = (
  match: MatchCandidate,
  round: number,
  playerStates: Map<number, PlayerState>
): void => {
  const allPlayers = [...match.team1, ...match.team2];
  
  // Update basic stats
  for (const playerId of allPlayers) {
    const state = playerStates.get(playerId)!;
    state.matchCount++;
    state.lastPlayedRound = round;
    state.courtsPlayed.add(match.court);
  }
  
  // Update partnerships
  const updatePartnership = (p1: number, p2: number) => {
    const state1 = playerStates.get(p1)!;
    const state2 = playerStates.get(p2)!;
    state1.partnerships.set(p2, (state1.partnerships.get(p2) || 0) + 1);
    state2.partnerships.set(p1, (state2.partnerships.get(p1) || 0) + 1);
  };
  
  updatePartnership(match.team1[0], match.team1[1]);
  updatePartnership(match.team2[0], match.team2[1]);
  
  // Update opponents
  for (const teamMember1 of match.team1) {
    for (const teamMember2 of match.team2) {
      const state1 = playerStates.get(teamMember1)!;
      const state2 = playerStates.get(teamMember2)!;
      
      state1.opponents.set(teamMember2, (state1.opponents.get(teamMember2) || 0) + 1);
      state2.opponents.set(teamMember1, (state2.opponents.get(teamMember1) || 0) + 1);
    }
  }
};

// Generate a single schedule attempt
const generateSingleSchedule = (config: ScheduleConfig): Schedule => {
  const {
    numRounds,
    numPlayers,
    numCourts,
    playerNames,
    scoringWeights
  } = config;

  const weights = { ...defaultWeights, ...scoringWeights };

  const players: Player[] = Array.from({ length: numPlayers }, (_, i) => ({
    id: i + 1,
    name: playerNames?.[i] || `Player ${i + 1}`
  }));

  const matches: Match[] = [];
  const roundSittingOut: Record<number, Player[]> = {};
  
  // Initialize player states
  const playerStates: Map<number, PlayerState> = new Map(
    players.map(p => [p.id, {
      id: p.id,
      name: p.name,
      matchCount: 0,
      lastPlayedRound: -2, // Start with -2 so no one is considered to have sat out round 0
      partnerships: new Map(),
      opponents: new Map(),
      courtsPlayed: new Set()
    }])
  );

  // Main schedule generation loop
  for (let round = 1; round <= numRounds; round++) {
    console.log(`\n=== ROUND ${round} GENERATION ===`);
    
    // Determine available players considering consecutive sitting out constraint
    let availablePlayers = players.map(p => p.id);
    
    // Track who sat out last round
    const lastRoundSitting = round > 1 ? (roundSittingOut[round - 1]?.map(p => p.id) || []) : [];
    console.log(`Last round sitting: [${lastRoundSitting.join(', ')}]`);
    
    const roundMatches: MatchCandidate[] = [];
    const usedPlayers = new Set<number>();
    const usedCourts = new Set<number>();
    
    // Generate matches for this round
    let attempts = 0;
    const maxAttempts = 200;
    
    while (usedPlayers.size < availablePlayers.length && roundMatches.length < numCourts && attempts < maxAttempts) {
      attempts++;
      
      const remainingPlayers = availablePlayers.filter(id => !usedPlayers.has(id));
      
      if (remainingPlayers.length < 4) break;
      
      // If avoiding consecutive sitting and we have players who sat out last round,
      // they MUST be included in the next available match
      let mustPlayPlayers: number[] = [];
      let regularPlayers: number[] = [];
      
      if (config.avoidConsecutiveSittingOut && lastRoundSitting.length > 0) {
        mustPlayPlayers = remainingPlayers.filter(id => lastRoundSitting.includes(id));
        regularPlayers = remainingPlayers.filter(id => !lastRoundSitting.includes(id));
        console.log(`Must play: [${mustPlayPlayers.join(', ')}], Regular: [${regularPlayers.join(', ')}]`);
      } else {
        regularPlayers = remainingPlayers;
      }
      
      // Generate player combinations with strict priority for must-play players
      let playerCombinations: number[][] = [];
      
      if (mustPlayPlayers.length >= 4) {
        // If we have 4+ must-play players, create matches with only them first
        playerCombinations = generatePlayerCombinations(mustPlayPlayers);
        console.log(`Using must-play only combinations: ${playerCombinations.length}`);
      } else if (mustPlayPlayers.length >= 2) {
        // If we have 2-3 must-play players, ensure they're included
        const combinedPool = [...mustPlayPlayers, ...regularPlayers];
        const allCombinations = generatePlayerCombinations(combinedPool);
        
        // Filter to only combinations that include ALL must-play players
        playerCombinations = allCombinations.filter(combo => 
          mustPlayPlayers.every(id => combo.includes(id))
        );
        console.log(`Filtered combinations including all must-play: ${playerCombinations.length}`);
        
        // If no combinations include all must-play players, include as many as possible
        if (playerCombinations.length === 0) {
          playerCombinations = allCombinations.filter(combo => 
            mustPlayPlayers.some(id => combo.includes(id))
          );
          console.log(`Fallback combinations including some must-play: ${playerCombinations.length}`);
        }
      } else {
        // No must-play constraints
        playerCombinations = generatePlayerCombinations(remainingPlayers);
      }
      
      if (playerCombinations.length === 0) {
        console.log(`No valid combinations found, breaking`);
        break;
      }
      
      const allCandidates: MatchCandidate[] = [];
      
      for (const combination of playerCombinations) {
        const teamPairings = generateTeamPairings(combination);
        
        for (const pairing of teamPairings) {
          // Shuffle court assignments to avoid patterns
          const availableCourts = Array.from({length: numCourts}, (_, i) => i + 1)
            .filter(court => !usedCourts.has(court));
          
          const shuffledCourts = shuffleArray(availableCourts);
          
          for (const court of shuffledCourts) {
            const candidate: MatchCandidate = {
              ...pairing,
              court,
              score: 0
            };
            
            candidate.score = scoreMatchCandidate(candidate, round, playerStates, config, weights);
            allCandidates.push(candidate);
          }
        }
      }
      
      if (allCandidates.length === 0) {
        console.log(`No valid candidates found, breaking`);
        break;
      }
      
      // Sort by score and pick the best candidate
      allCandidates.sort((a, b) => b.score - a.score);
      const bestCandidate = allCandidates[0];
      
      console.log(`Selected match: Court ${bestCandidate.court}, Players [${[...bestCandidate.team1, ...bestCandidate.team2].join(', ')}], Score: ${bestCandidate.score.toFixed(2)}`);
      
      // Add to round matches and mark players/court as used
      roundMatches.push(bestCandidate);
      const matchPlayers = [...bestCandidate.team1, ...bestCandidate.team2];
      matchPlayers.forEach(id => usedPlayers.add(id));
      usedCourts.add(bestCandidate.court);
      
      // Update player states
      updatePlayerStates(bestCandidate, round, playerStates);
    }
    
    // Convert match candidates to actual matches
    for (const matchCandidate of roundMatches) {
      const matchPlayers = [...matchCandidate.team1, ...matchCandidate.team2];
      matches.push({
        id: matches.length + 1,
        court: matchCandidate.court,
        players: matchPlayers.map(id => players.find(p => p.id === id)!),
        round
      });
    }
    
    // Record players sitting out this round
    const playersInMatches = new Set(roundMatches.flatMap(m => [...m.team1, ...m.team2]));
    roundSittingOut[round] = players.filter(p => !playersInMatches.has(p.id));
  }

  const playerStats = players.map(p => ({
    playerId: p.id,
    playerName: p.name,
    matchCount: playerStates.get(p.id)!.matchCount
  }));

  return { matches, playerStats, roundSittingOut };
};

// Enhanced schedule scoring function
const scoreSchedule = (schedule: Schedule, config: ScheduleConfig): number => {
  const { prioritizeUniquePartnerships, balanceMatchCounts, avoidConsecutiveSittingOut } = config;
  
  // Calculate match count balance
  const matchCounts = schedule.playerStats.map(p => p.matchCount);
  const minMatches = Math.min(...matchCounts);
  const maxMatches = Math.max(...matchCounts);
  const matchBalance = maxMatches - minMatches;
  
  // Calculate consecutive sitting out penalty
  let consecutiveSittingPenalty = 0;
  if (avoidConsecutiveSittingOut) {
    const allPlayerIds = schedule.playerStats.map(p => p.playerId);
    const maxRound = Math.max(...schedule.matches.map(m => m.round));
    
    for (const playerId of allPlayerIds) {
      let consecutiveRounds = 0;
      let maxConsecutive = 0;
      
      for (let round = 1; round <= maxRound; round++) {
        const sittingPlayers = schedule.roundSittingOut[round]?.map(p => p.id) || [];
        
        if (sittingPlayers.includes(playerId)) {
          consecutiveRounds++;
          maxConsecutive = Math.max(maxConsecutive, consecutiveRounds);
        } else {
          consecutiveRounds = 0;
        }
      }
      
      // Heavily penalize consecutive sitting (exponential penalty)
      if (maxConsecutive > 1) {
        consecutiveSittingPenalty += Math.pow(maxConsecutive, 3) * 1000;
      }
    }
  }
  
  // Calculate partnership distribution
  const partnershipCounts = new Map<string, number>();
  const opponentCounts = new Map<string, number>();
  
  for (const match of schedule.matches) {
    const [a, b, c, d] = match.players.map(p => p.id);
    
    // Record partnerships
    const partnerships = [
      [a, b].sort().join('-'),
      [c, d].sort().join('-')
    ];
    
    partnerships.forEach(partnership => {
      partnershipCounts.set(partnership, (partnershipCounts.get(partnership) || 0) + 1);
    });
    
    // Record opponents
    const opponents = [
      [a, c], [a, d], [b, c], [b, d]
    ];
    
    opponents.forEach(([p1, p2]) => {
      const key = [p1, p2].sort().join('-');
      opponentCounts.set(key, (opponentCounts.get(key) || 0) + 1);
    });
  }
  
  // Calculate scores
  let score = 10000; // Base score
  
  // Consecutive sitting penalty (CRITICAL)
  score -= consecutiveSittingPenalty;
  
  // Match balance penalty (very important if balanceMatchCounts is enabled)
  if (balanceMatchCounts) {
    score -= matchBalance * 500;
  } else {
    score -= matchBalance * 100;
  }
  
  // Partnership diversity scoring
  const partnershipVariance = Array.from(partnershipCounts.values())
    .reduce((acc, count) => acc + Math.pow(count - 1, 2), 0);
  
  if (prioritizeUniquePartnerships) {
    score -= partnershipVariance * 50;
  } else {
    score -= partnershipVariance * 20;
  }
  
  // Opponent diversity scoring
  const opponentVariance = Array.from(opponentCounts.values())
    .reduce((acc, count) => acc + Math.pow(count - 1, 2), 0);
  
  if (!prioritizeUniquePartnerships) {
    score -= opponentVariance * 30;
  } else {
    score -= opponentVariance * 15;
  }
  
  return score;
};

// Main exported function with global optimization
export const generateSchedule = (config: ScheduleConfig): Schedule => {
  const maxAttempts = 100; // Increased for better optimization
  let bestSchedule: Schedule | null = null;
  let bestScore = -Infinity;
  
  console.log(`Generating ${maxAttempts} schedule variations to find the optimal one...`);
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const candidateSchedule = generateSingleSchedule(config);
      const candidateScore = scoreSchedule(candidateSchedule, config);
      
      if (candidateScore > bestScore) {
        bestScore = candidateScore;
        bestSchedule = candidateSchedule;
        console.log(`New best schedule found (attempt ${attempt + 1}): score ${candidateScore}`);
      }
    } catch (error) {
      console.warn(`Schedule generation attempt ${attempt + 1} failed:`, error);
      continue;
    }
  }
  
  if (!bestSchedule) {
    throw new Error('Failed to generate any valid schedule');
  }
  
  console.log(`Final schedule selected with score: ${bestScore}`);
  
  // Log final statistics
  const matchCounts = bestSchedule.playerStats.map(p => p.matchCount);
  const minMatches = Math.min(...matchCounts);
  const maxMatches = Math.max(...matchCounts);
  console.log(`Match distribution: ${minMatches} to ${maxMatches} matches per player`);
  
  return bestSchedule;
};

export const exportScheduleToCSV = (schedule: Schedule): string => {
  const headers = [
    'Match ID',
    'Round',
    'Court',
    'Team 1 Player 1',
    'Team 1 Player 2',
    'Team 2 Player 1',
    'Team 2 Player 2',
    'Players Sitting Out'
  ];

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

  return [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
};