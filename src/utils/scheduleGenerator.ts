
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

export const generateSchedule = (config: ScheduleConfig): Schedule => {
  const { sessionStart, sessionEnd, matchLength, numPlayers, numCourts, playerNames, randomSeed } = config;
  
  // Initialize random number generator with seed or current time
  const rng = new SeededRandom(randomSeed || Date.now());
  
  // Generate players with custom names if provided
  const players: Player[] = Array.from({ length: numPlayers }, (_, i) => ({
    id: i + 1,
    name: playerNames && playerNames[i] ? playerNames[i] : `Player ${i + 1}`
  }));

  // Calculate number of rounds
  const startTime = new Date(`2024-01-01T${sessionStart}`);
  const endTime = new Date(`2024-01-01T${sessionEnd}`);
  const sessionDuration = (endTime.getTime() - startTime.getTime()) / (1000 * 60); // minutes
  const numRounds = Math.floor(sessionDuration / matchLength);
  
  const matches: Match[] = [];
  const roundSittingOut: Record<number, Player[]> = {}; // Track who sits out each round
  const playerMatchCount = new Map<number, number>();
  const playerLastPlayed = new Map<number, number>();
  const partnershipCount = new Map<string, number>(); // Track how many times players have been partners
  const playerCourtHistory = new Map<number, Set<number>>(); // Track which courts each player has played on
  const recentOpponents = new Map<number, Set<number>>(); // Track recent opponents for each player
  const courtMateSeparation = new Map<string, number>(); // Track when players last played on same court
  
  // Initialize player stats
  players.forEach(player => {
    playerMatchCount.set(player.id, 0);
    playerLastPlayed.set(player.id, -2); // Allow them to play in first round
    playerCourtHistory.set(player.id, new Set());
    recentOpponents.set(player.id, new Set());
  });

  // Helper function to create partnership key
  const getPartnershipKey = (playerId1: number, playerId2: number) => {
    return `${Math.min(playerId1, playerId2)}-${Math.max(playerId1, playerId2)}`;
  };

  // Helper function to get partnership count between two players
  const getPartnershipCount = (playerId1: number, playerId2: number) => {
    const key = getPartnershipKey(playerId1, playerId2);
    return partnershipCount.get(key) || 0;
  };

  // Helper function to calculate court diversity score for a group of players
  const calculateCourtDiversityScore = (players: Player[], court: number) => {
    let score = 0;
    players.forEach(player => {
      const courtsPlayed = playerCourtHistory.get(player.id) || new Set();
      if (!courtsPlayed.has(court)) {
        score += 10; // Bonus for playing on a new court
      }
    });
    return score;
  };

  // Helper function to calculate separation penalty for players who recently played together
  const calculateSeparationPenalty = (playerGroup: Player[], currentRound: number) => {
    let penalty = 0;
    for (let i = 0; i < playerGroup.length; i++) {
      for (let j = i + 1; j < playerGroup.length; j++) {
        const key = getPartnershipKey(playerGroup[i].id, playerGroup[j].id);
        const lastTogetherRound = courtMateSeparation.get(key) || -5;
        const roundsSeparated = currentRound - lastTogetherRound;
        
        // Heavy penalty if they played together in the last 2 rounds
        if (roundsSeparated <= 2) {
          penalty += 1000;
        } else if (roundsSeparated <= 3) {
          penalty += 500;
        }
      }
    }
    return penalty;
  };

  // Helper function to calculate match count balance score (heavily weighted)
  const calculateMatchCountBalance = (playerGroup: Player[]) => {
    const matchCounts = playerGroup.map(p => playerMatchCount.get(p.id) || 0);
    const totalMatches = matchCounts.reduce((sum, count) => sum + count, 0);
    const avgMatches = totalMatches / playerGroup.length;
    
    // Heavily penalize groups where players have significantly different match counts
    let balanceScore = 0;
    matchCounts.forEach(count => {
      const diff = Math.abs(count - avgMatches);
      balanceScore -= diff * 500; // Heavy penalty for imbalance
    });
    
    // Extra bonus for selecting players with the lowest match counts
    const minMatchCount = Math.min(...Array.from(playerMatchCount.values()));
    matchCounts.forEach(count => {
      if (count === minMatchCount) {
        balanceScore += 200; // Bonus for selecting players with minimum matches
      } else if (count === minMatchCount + 1) {
        balanceScore += 100; // Smaller bonus for players with one more match
      }
    });
    
    return balanceScore;
  };

  // Helper function to find best team pairing with enhanced balance prioritization
  const findBestTeamPairing = (availablePlayers: Player[], court: number, currentRound: number) => {
    const bestPairings: Player[][] = [];
    let bestScore = -Infinity;

    // Try all possible team combinations (2 players per team)
    for (let i = 0; i < availablePlayers.length - 3; i++) {
      for (let j = i + 1; j < availablePlayers.length - 2; j++) {
        for (let k = j + 1; k < availablePlayers.length - 1; k++) {
          for (let l = k + 1; l < availablePlayers.length; l++) {
            const team1 = [availablePlayers[i], availablePlayers[j]];
            const team2 = [availablePlayers[k], availablePlayers[l]];
            const allPlayers = [...team1, ...team2];
            
            // Calculate match count balance score (highest priority)
            const matchCountBalance = calculateMatchCountBalance(allPlayers);
            
            // Calculate partnership score (lower partnership count is better)
            const team1PartnershipCount = getPartnershipCount(team1[0].id, team1[1].id);
            const team2PartnershipCount = getPartnershipCount(team2[0].id, team2[1].id);
            const partnershipScore = -(team1PartnershipCount + team2PartnershipCount) * 50;
            
            // Calculate court diversity score (higher is better)
            const courtDiversityScore = calculateCourtDiversityScore(allPlayers, court);
            
            // Calculate separation penalty (heavy penalty for recent court mates)
            const separationPenalty = calculateSeparationPenalty(allPlayers, currentRound);
            
            // Match count balance is the most important factor
            const totalScore = matchCountBalance + partnershipScore + courtDiversityScore - separationPenalty;
            
            if (totalScore > bestScore) {
              bestScore = totalScore;
              bestPairings.length = 0; // Clear array
              bestPairings.push(allPlayers);
            } else if (totalScore === bestScore) {
              bestPairings.push(allPlayers);
            }
          }
        }
      }
    }

    // Randomly select from best pairings if multiple have the same score
    if (bestPairings.length > 0) {
      const randomIndex = Math.floor(rng.next() * bestPairings.length);
      return bestPairings[randomIndex];
    }

    return null;
  };

  // Generate matches for each round
  for (let round = 1; round <= numRounds; round++) {
    console.log(`\n=== Round ${round} ===`);
    
    // Get all players and sort by match count (ascending), then by last played round
    let availablePlayers = [...players];
    
    // Sort primarily by match count, then by rounds since last played
    availablePlayers.sort((a, b) => {
      const matchCountDiff = (playerMatchCount.get(a.id) || 0) - (playerMatchCount.get(b.id) || 0);
      if (matchCountDiff !== 0) return matchCountDiff;
      
      const lastPlayedA = playerLastPlayed.get(a.id) || -2;
      const lastPlayedB = playerLastPlayed.get(b.id) || -2;
      const restDiff = (round - lastPlayedA) - (round - lastPlayedB);
      if (restDiff !== 0) return -restDiff; // Negative because we want more rest to come first
      
      return rng.next() - 0.5; // Random tiebreaker
    });
    
    // Log current match counts for debugging
    const matchCounts = players.map(p => `${p.name}: ${playerMatchCount.get(p.id) || 0}`);
    console.log('Match counts:', matchCounts.join(', '));
    
    const playersInRound = new Set<number>();
    
    // Assign players to courts (4 players per court for doubles)
    const playersPerMatch = 4;
    for (let court = 0; court < numCourts && availablePlayers.length >= playersPerMatch; court++) {
      console.log(`\nCourt ${court + 1} - Available players: ${availablePlayers.map(p => `${p.name}(${playerMatchCount.get(p.id) || 0})`).join(', ')}`);
      
      const matchPlayers = findBestTeamPairing(availablePlayers, court + 1, round);
      
      if (matchPlayers && matchPlayers.length === 4) {
        console.log(`Selected: ${matchPlayers.map(p => `${p.name}(${playerMatchCount.get(p.id) || 0})`).join(', ')}`);
        
        // Remove selected players from available list
        matchPlayers.forEach(player => {
          const index = availablePlayers.findIndex(p => p.id === player.id);
          if (index > -1) availablePlayers.splice(index, 1);
          playersInRound.add(player.id);
        });

        matches.push({
          id: matches.length + 1,
          court: court + 1,
          players: matchPlayers,
          round: round
        });
        
        // Update player stats
        matchPlayers.forEach(player => {
          playerMatchCount.set(player.id, (playerMatchCount.get(player.id) || 0) + 1);
          playerLastPlayed.set(player.id, round);
          // Track court usage
          const courtsPlayed = playerCourtHistory.get(player.id) || new Set();
          courtsPlayed.add(court + 1);
          playerCourtHistory.set(player.id, courtsPlayed);
        });

        // Update partnership counts (first two players are partners, last two are partners)
        const team1Key = getPartnershipKey(matchPlayers[0].id, matchPlayers[1].id);
        const team2Key = getPartnershipKey(matchPlayers[2].id, matchPlayers[3].id);
        partnershipCount.set(team1Key, (partnershipCount.get(team1Key) || 0) + 1);
        partnershipCount.set(team2Key, (partnershipCount.get(team2Key) || 0) + 1);

        // Update court mate separation tracking - track when any two players were on the same court
        for (let i = 0; i < matchPlayers.length; i++) {
          for (let j = i + 1; j < matchPlayers.length; j++) {
            const key = getPartnershipKey(matchPlayers[i].id, matchPlayers[j].id);
            courtMateSeparation.set(key, round);
          }
        }
      } else {
        console.log('No suitable match found for this court');
      }
    }
    
    // Track who is sitting out this round
    const sittingOut = players.filter(player => !playersInRound.has(player.id));
    roundSittingOut[round] = sittingOut;
    console.log(`Sitting out: ${sittingOut.map(p => `${p.name}(${playerMatchCount.get(p.id) || 0})`).join(', ')}`);
  }

  // Log final match distribution
  console.log('\n=== Final Match Distribution ===');
  const finalMatchCounts = players.map(p => `${p.name}: ${playerMatchCount.get(p.id) || 0}`);
  console.log(finalMatchCounts.join(', '));
  
  const matchCountValues = Array.from(playerMatchCount.values());
  const minMatches = Math.min(...matchCountValues);
  const maxMatches = Math.max(...matchCountValues);
  console.log(`Match count range: ${minMatches} - ${maxMatches} (difference: ${maxMatches - minMatches})`);

  // Calculate player statistics
  const playerStats = players.map(player => ({
    playerId: player.id,
    playerName: player.name,
    matchCount: playerMatchCount.get(player.id) || 0
  }));

  return { matches, playerStats, roundSittingOut };
};

export const exportScheduleToCSV = (schedule: Schedule): string => {
  const headers = ['Match ID', 'Round', 'Court', 'Team 1 Player 1', 'Team 1 Player 2', 'Team 2 Player 1', 'Team 2 Player 2'];
  
  const rows = schedule.matches.map(match => [
    match.id.toString(),
    match.round.toString(),
    match.court.toString(),
    match.players[0]?.name || '',
    match.players[1]?.name || '',
    match.players[2]?.name || '',
    match.players[3]?.name || ''
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
  
  return csvContent;
};
