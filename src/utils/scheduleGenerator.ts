import { Player, Match, ScheduleConfig, Schedule, ScoringWeights } from '@/types/schedule';

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

const defaultWeights: ScoringWeights = {
  balance: 1.0,
  mustPlay: 2.0,
  partnership: 1.2,
  opposition: 1.0,
  court: 0.5,
};

// Utility functions for array shuffling using Fisher-Yates algorithm
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Generate a single schedule attempt
const generateSingleSchedule = (config: ScheduleConfig): Schedule => {
  const {
    numRounds, 
    numPlayers, 
    numCourts,
    playerNames,
    prioritizeUniquePartnerships,
    avoidConsecutiveSittingOut,
    balanceMatchCounts,
    scoringWeights
  } = config;

  const weights = scoringWeights || defaultWeights;

  const players: Player[] = Array.from({ length: numPlayers }, (_, i) => ({
    id: i + 1,
    name: playerNames?.[i] || `Player ${i + 1}`
  }));

  const matches: Match[] = [];
  const roundSittingOut: Record<number, Player[]> = {};
  const playerStates: Map<number, PlayerState> = new Map(
    players.map(p => [p.id, {
      id: p.id, 
      name: p.name,
      matchCount: 0, 
      lastPlayedRound: -2,
      roundsSincePlayed: 999,
      partnerships: new Set(),
      opponents: new Map(),
      courtsPlayed: new Set()
    }])
  );

  // Helper functions
  const canPlay = (playerId: number, round: number): boolean => {
    const state = playerStates.get(playerId)!;
    return !(avoidConsecutiveSittingOut && state.lastPlayedRound === round - 1);
  };

  const getPartnershipScore = (p1: number, p2: number): number => {
    const state1 = playerStates.get(p1)!;
    const hasPartnered = state1.partnerships.has(p2);
    
    if (prioritizeUniquePartnerships && hasPartnered) {
      return -1000; // Heavily penalize repeated partnerships
    }
    return hasPartnered ? -100 : 100;
  };

  const getOppositionScore = (team1: [number, number], team2: [number, number], round: number): number => {
    let score = 0;
    const decay = 1 - (round / numRounds);
    
    for (const p1 of team1) {
      for (const p2 of team2) {
        const opponentCount = playerStates.get(p1)!.opponents.get(p2) || 0;
        score += opponentCount === 0 ? 200 : -300 * opponentCount * decay;
      }
    }
    return score;
  };

  const getCourtVarietyScore = (playerIds: number[], court: number): number => {
    return playerIds.reduce((acc, id) => {
      const hasPlayedCourt = playerStates.get(id)!.courtsPlayed.has(court);
      return acc + (hasPlayedCourt ? -10 : 25);
    }, 0);
  };

  const scoreMatchCandidate = (candidate: MatchCandidate, round: number): number => {
    const allPlayers = [...candidate.team1, ...candidate.team2];
    const allStates = allPlayers.map(id => playerStates.get(id)!);
    const minMatchCount = Math.min(...Array.from(playerStates.values()).map(s => s.matchCount));
    
    let balanceScore = 0;
    let mustPlayScore = 0;
    
    for (const playerId of allPlayers) {
      const state = playerStates.get(playerId)!;
      
      // Must play bonus for players who sat out last round
      if (avoidConsecutiveSittingOut && state.lastPlayedRound === round - 1) {
        mustPlayScore += 10000;
      }
      
      // Balance score for match counts
      if (balanceMatchCounts) {
        balanceScore += state.matchCount === minMatchCount ? 500 : -200 * (state.matchCount - minMatchCount);
      }
    }

    const partnershipScore = getPartnershipScore(candidate.team1[0], candidate.team1[1]) +
                            getPartnershipScore(candidate.team2[0], candidate.team2[1]);
    
    const oppositionScore = getOppositionScore(candidate.team1, candidate.team2, round);
    const courtScore = getCourtVarietyScore(allPlayers, candidate.court);

    return (mustPlayScore * weights.mustPlay) +
           (balanceScore * weights.balance) +
           (partnershipScore * weights.partnership) +
           (oppositionScore * weights.opposition) +
           (courtScore * weights.court);
  };

  const generateMatchCandidates = (availablePlayers: number[], round: number): MatchCandidate[] => {
    const candidates: MatchCandidate[] = [];
    
    // Generate all possible 4-player combinations
    for (let i = 0; i < availablePlayers.length - 3; i++) {
      for (let j = i + 1; j < availablePlayers.length - 2; j++) {
        for (let k = j + 1; k < availablePlayers.length - 1; k++) {
          for (let l = k + 1; l < availablePlayers.length; l++) {
            const fourPlayers = [availablePlayers[i], availablePlayers[j], availablePlayers[k], availablePlayers[l]];
            
            // Generate all possible team pairings
            const teamPairings = [
              { team1: [fourPlayers[0], fourPlayers[1]], team2: [fourPlayers[2], fourPlayers[3]] },
              { team1: [fourPlayers[0], fourPlayers[2]], team2: [fourPlayers[1], fourPlayers[3]] },
              { team1: [fourPlayers[0], fourPlayers[3]], team2: [fourPlayers[1], fourPlayers[2]] },
            ] as { team1: [number, number], team2: [number, number] }[];
            
            // For each team pairing, try all courts
            for (const pairing of teamPairings) {
              for (let court = 1; court <= numCourts; court++) {
                const candidate: MatchCandidate = {
                  ...pairing,
                  court,
                  score: 0
                };
                candidate.score = scoreMatchCandidate(candidate, round);
                candidates.push(candidate);
              }
            }
          }
        }
      }
    }
    
    return candidates;
  };

  const updatePlayerStates = (match: MatchCandidate, round: number): void => {
    const allPlayers = [...match.team1, ...match.team2];
    
    // Update basic stats
    for (const playerId of allPlayers) {
      const state = playerStates.get(playerId)!;
      state.matchCount++;
      state.lastPlayedRound = round;
      state.courtsPlayed.add(match.court);
    }
    
    // Update partnerships
    const [p1, p2] = match.team1;
    const [p3, p4] = match.team2;
    
    playerStates.get(p1)!.partnerships.add(p2);
    playerStates.get(p2)!.partnerships.add(p1);
    playerStates.get(p3)!.partnerships.add(p4);
    playerStates.get(p4)!.partnerships.add(p3);
    
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

  // Main schedule generation loop
  for (let round = 1; round <= numRounds; round++) {
    let availablePlayers = players.map(p => p.id);
    
    // Generate matches for this round
    for (let courtSlot = 0; courtSlot < numCourts && availablePlayers.length >= 4; courtSlot++) {
      const candidates = generateMatchCandidates(availablePlayers, round);
      
      if (candidates.length === 0) break;
      
      // Sort candidates by score (best first) with random tiebreaker
      candidates.sort((a, b) => {
        const scoreDiff = b.score - a.score;
        return scoreDiff !== 0 ? scoreDiff : Math.random() - 0.5;
      });
      
      const bestCandidate = candidates[0];
      const matchPlayers = [...bestCandidate.team1, ...bestCandidate.team2];
      
      // Remove selected players from available pool
      availablePlayers = availablePlayers.filter(id => !matchPlayers.includes(id));
      
      // Create and add the match
      matches.push({
        id: matches.length + 1,
        court: bestCandidate.court,
        players: matchPlayers.map(id => players.find(p => p.id === id)!),
        round
      });
      
      // Update player states
      updatePlayerStates(bestCandidate, round);
    }
    
    // Record players sitting out this round
    roundSittingOut[round] = players.filter(p => availablePlayers.includes(p.id));
  }

  const playerStats = players.map(p => ({
    playerId: p.id,
    playerName: p.name,
    matchCount: playerStates.get(p.id)!.matchCount
  }));

  return { matches, playerStats, roundSittingOut };
};

// Enhanced schedule scoring function
const scoreSchedule = (schedule: Schedule): number => {
  const partnershipCounts = new Map<string, number>();
  const opponentCounts = new Map<string, number>();
  
  // Calculate partnership and opponent frequencies
  for (const match of schedule.matches) {
    const [a, b, c, d] = match.players.map(p => p.id);
    
    // Record partnerships
    const partnership1 = [a, b].sort().join('-');
    const partnership2 = [c, d].sort().join('-');
    partnershipCounts.set(partnership1, (partnershipCounts.get(partnership1) || 0) + 1);
    partnershipCounts.set(partnership2, (partnershipCounts.get(partnership2) || 0) + 1);
    
    // Record opponents
    for (const team1Player of [a, b]) {
      for (const team2Player of [c, d]) {
        const opponentPair = [team1Player, team2Player].sort().join('-');
        opponentCounts.set(opponentPair, (opponentCounts.get(opponentPair) || 0) + 1);
      }
    }
  }
  
  // Calculate penalties
  const matchCounts = schedule.playerStats.map(p => p.matchCount);
  const minMatches = Math.min(...matchCounts);
  const maxMatches = Math.max(...matchCounts);
  const balancePenalty = (maxMatches - minMatches) * 50;
  
  const partnershipPenalty = Array.from(partnershipCounts.values())
    .reduce((acc, count) => acc + Math.pow(count - 1, 2) * 10, 0);
  
  const opponentPenalty = Array.from(opponentCounts.values())
    .reduce((acc, count) => acc + Math.pow(count - 1, 2) * 5, 0);
  
  // Higher score = better schedule
  const baseScore = 10000;
  const totalPenalty = balancePenalty + partnershipPenalty + opponentPenalty;
  
  return baseScore - totalPenalty;
};

// Main exported function with global optimization
export const generateSchedule = (config: ScheduleConfig): Schedule => {
  const maxAttempts = 50; // Increased attempts for better optimization
  let bestSchedule: Schedule | null = null;
  let bestScore = -Infinity;
  
  console.log(`Generating ${maxAttempts} schedule variations to find the optimal one...`);
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const candidateSchedule = generateSingleSchedule(config);
      const candidateScore = scoreSchedule(candidateSchedule);
      
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