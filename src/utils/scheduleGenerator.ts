import { Player, Match, ScheduleConfig, Schedule } from '@/types/schedule';

// Simple seeded random number generator
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

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

// Player state tracking
interface PlayerState {
  id: number;
  name: string;
  matchCount: number;
  lastPlayedRound: number;
  roundsSincePlayed: number;
  partnerships: Set<number>;
  opponents: Map<number, number>; // Track opponent frequency
  courtsPlayed: Set<number>;
}

// Match candidate for evaluation
interface MatchCandidate {
  team1: [number, number];
  team2: [number, number];
  court: number;
  score: number;
}

export const generateSchedule = (config: ScheduleConfig): Schedule => {
  const { numRounds, numPlayers, numCourts, playerNames, randomSeed, prioritizeUniquePartnerships, avoidConsecutiveSittingOut, balanceMatchCounts } = config;
  
  const rng = new SeededRandom(randomSeed || Date.now());
  
  // Initialize player states
  const playerStates: Map<number, PlayerState> = new Map();
  const players: Player[] = Array.from({ length: numPlayers }, (_, i) => {
    const player = {
      id: i + 1,
      name: playerNames && playerNames[i] ? playerNames[i] : `Player ${i + 1}`
    };
    
    playerStates.set(player.id, {
      id: player.id,
      name: player.name,
      matchCount: 0,
      lastPlayedRound: -2, // Allow playing in first round
      roundsSincePlayed: 999,
      partnerships: new Set(),
      opponents: new Map(), // Track frequency of each opponent
      courtsPlayed: new Set()
    });
    
    return player;
  });

  const matches: Match[] = [];
  const roundSittingOut: Record<number, Player[]> = {};

  // Priority 1: Equal games & no consecutive sitting out
  const canPlayerPlay = (playerId: number, round: number): boolean => {
    const state = playerStates.get(playerId)!;
    
    // Don't sit out 2 rounds in a row (unless unavoidable) - only if enabled
    if (avoidConsecutiveSittingOut !== false && state.lastPlayedRound === round - 2) {
      return true; // Must play to avoid sitting out 2 in a row
    }
    
    return true; // Can play
  };

  // Priority 2: Unique partnerships
  const getPartnershipScore = (p1: number, p2: number): number => {
    const state1 = playerStates.get(p1)!;
    const hasPartnered = state1.partnerships.has(p2);
    
    if (prioritizeUniquePartnerships && hasPartnered) {
      return -1000; // Heavy penalty for repeat partnerships
    }
    
    return hasPartnered ? -100 : 100; // Prefer new partnerships
  };

  // Priority 3: Unique opposition (heavily weighted against repeated matchups)
  const getOppositionScore = (team1: [number, number], team2: [number, number]): number => {
    let score = 0;
    
    for (const p1 of team1) {
      for (const p2 of team2) {
        const state1 = playerStates.get(p1)!;
        const opponentCount = state1.opponents.get(p2) || 0;
        
        if (opponentCount === 0) {
          score += 200; // High bonus for new opponents
        } else if (opponentCount === 1) {
          score -= 300; // Heavy penalty for second time
        } else {
          score -= 1000 * opponentCount; // Massive penalty for multiple repeats
        }
      }
    }
    
    return score;
  };

  // Priority 4: Court variety
  const getCourtVarietyScore = (playerIds: number[], court: number): number => {
    let score = 0;
    
    for (const playerId of playerIds) {
      const state = playerStates.get(playerId)!;
      if (!state.courtsPlayed.has(court)) {
        score += 25; // Bonus for new court
      }
    }
    
    return score;
  };

  // Main scoring function that respects priority order
  const scoreMatchCandidate = (candidate: MatchCandidate, round: number): number => {
    const { team1, team2, court } = candidate;
    const allPlayers = [...team1, ...team2];
    
    // Priority 1: Match count balance (highest weight)
    const matchCounts = allPlayers.map(id => playerStates.get(id)!.matchCount);
    const minGlobalCount = Math.min(...Array.from(playerStates.values()).map(s => s.matchCount));
    const maxGlobalCount = Math.max(...Array.from(playerStates.values()).map(s => s.matchCount));
    
    let balanceScore = 0;
    let mustPlayBonus = 0;
    
    for (const playerId of allPlayers) {
      const state = playerStates.get(playerId)!;
      const count = state.matchCount;
      
      // Massive bonus for players who must play to avoid sitting out 2 in a row - only if enabled
      if (avoidConsecutiveSittingOut !== false && state.lastPlayedRound === round - 2) {
        mustPlayBonus += 10000;
      }
      
      // Balance match counts - only if enabled
      if (balanceMatchCounts !== false) {
        if (count === minGlobalCount) {
          balanceScore += 5000;
        } else if (count === minGlobalCount + 1) {
          balanceScore += 1000;
        } else {
          balanceScore -= (count - minGlobalCount) * 2000;
        }
      }
    }
    
    // Priority 2: Partnership uniqueness
    const partnershipScore = getPartnershipScore(team1[0], team1[1]) + 
                            getPartnershipScore(team2[0], team2[1]);
    
    // Priority 3: Opposition uniqueness
    const oppositionScore = getOppositionScore(team1, team2);
    
    // Priority 4: Court variety
    const courtScore = getCourtVarietyScore(allPlayers, court);
    
    // Combine scores with appropriate weights to maintain priority order
    return mustPlayBonus + balanceScore + (partnershipScore * 0.8) + (oppositionScore * 0.6) + (courtScore * 0.4);
  };

  // Generate all possible match candidates for a round
  const generateMatchCandidates = (availablePlayerIds: number[], round: number): MatchCandidate[] => {
    const candidates: MatchCandidate[] = [];
    const playerList = [...availablePlayerIds];
    
    // Generate all possible 4-player combinations
    for (let i = 0; i < playerList.length - 3; i++) {
      for (let j = i + 1; j < playerList.length - 2; j++) {
        for (let k = j + 1; k < playerList.length - 1; k++) {
          for (let l = k + 1; l < playerList.length; l++) {
            const fourPlayers = [playerList[i], playerList[j], playerList[k], playerList[l]];
            
            // Try different team arrangements
            const arrangements = [
              { team1: [fourPlayers[0], fourPlayers[1]] as [number, number], team2: [fourPlayers[2], fourPlayers[3]] as [number, number] },
              { team1: [fourPlayers[0], fourPlayers[2]] as [number, number], team2: [fourPlayers[1], fourPlayers[3]] as [number, number] },
              { team1: [fourPlayers[0], fourPlayers[3]] as [number, number], team2: [fourPlayers[1], fourPlayers[2]] as [number, number] }
            ];
            
            for (const arrangement of arrangements) {
              for (let court = 1; court <= numCourts; court++) {
                const candidate: MatchCandidate = {
                  ...arrangement,
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

  // Generate schedule round by round
  for (let round = 1; round <= numRounds; round++) {
    const roundMatches: MatchCandidate[] = [];
    let availablePlayerIds = players.map(p => p.id);
    
    // Update rounds since played
    for (const state of playerStates.values()) {
      if (state.lastPlayedRound < round - 1) {
        state.roundsSincePlayed = round - state.lastPlayedRound - 1;
      } else {
        state.roundsSincePlayed = 0;
      }
    }
    
    // Find best matches for this round
    for (let court = 0; court < numCourts && availablePlayerIds.length >= 4; court++) {
      const candidates = generateMatchCandidates(availablePlayerIds, round);
      
      if (candidates.length === 0) break;
      
      // Sort by score (highest first)
      candidates.sort((a, b) => b.score - a.score);
      
      // Take the best candidate
      const bestMatch = candidates[0];
      const matchPlayers = [...bestMatch.team1, ...bestMatch.team2];
      
      // Remove selected players from available pool
      availablePlayerIds = availablePlayerIds.filter(id => !matchPlayers.includes(id));
      
      // Create match
      const match: Match = {
        id: matches.length + 1,
        court: bestMatch.court,
        players: matchPlayers.map(id => players.find(p => p.id === id)!),
        round
      };
      
      matches.push(match);
      
      // Update player states
      for (const playerId of matchPlayers) {
        const state = playerStates.get(playerId)!;
        state.matchCount++;
        state.lastPlayedRound = round;
        state.courtsPlayed.add(bestMatch.court);
      }
      
      // Update partnerships
      const [p1, p2] = bestMatch.team1;
      const [p3, p4] = bestMatch.team2;
      
      playerStates.get(p1)!.partnerships.add(p2);
      playerStates.get(p2)!.partnerships.add(p1);
      playerStates.get(p3)!.partnerships.add(p4);
      playerStates.get(p4)!.partnerships.add(p3);
      
      // Update opponents (track frequency)
      for (const p1 of bestMatch.team1) {
        for (const p2 of bestMatch.team2) {
          const state1 = playerStates.get(p1)!;
          const state2 = playerStates.get(p2)!;
          state1.opponents.set(p2, (state1.opponents.get(p2) || 0) + 1);
          state2.opponents.set(p1, (state2.opponents.get(p1) || 0) + 1);
        }
      }
    }
    
    // Track sitting out players
    const sittingOutPlayers = players.filter(p => availablePlayerIds.includes(p.id));
    roundSittingOut[round] = sittingOutPlayers;
  }

  // Calculate final player statistics
  const playerStats = players.map(player => ({
    playerId: player.id,
    playerName: player.name,
    matchCount: playerStates.get(player.id)!.matchCount
  }));

  return { matches, playerStats, roundSittingOut };
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
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
  
  return csvContent;
};