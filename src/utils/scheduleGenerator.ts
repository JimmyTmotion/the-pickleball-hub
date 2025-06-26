
import { Player, Match, ScheduleConfig, Schedule } from '@/types/schedule';

export const generateSchedule = (config: ScheduleConfig): Schedule => {
  const { sessionStart, sessionEnd, matchLength, numPlayers, numCourts, playerNames } = config;
  
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
  const playerMatchCount = new Map<number, number>();
  const playerLastPlayed = new Map<number, number>();
  const partnershipCount = new Map<string, number>(); // Track how many times players have been partners
  const playerCourtHistory = new Map<number, Set<number>>(); // Track which courts each player has played on
  
  // Initialize player stats
  players.forEach(player => {
    playerMatchCount.set(player.id, 0);
    playerLastPlayed.set(player.id, -2); // Allow them to play in first round
    playerCourtHistory.set(player.id, new Set());
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

  // Helper function to find best team pairing with least used partnerships and court diversity
  const findBestTeamPairing = (availablePlayers: Player[], court: number) => {
    let bestPairing = null;
    let bestScore = -Infinity;

    // Try all possible team combinations (2 players per team)
    for (let i = 0; i < availablePlayers.length - 3; i++) {
      for (let j = i + 1; j < availablePlayers.length - 2; j++) {
        for (let k = j + 1; k < availablePlayers.length - 1; k++) {
          for (let l = k + 1; l < availablePlayers.length; l++) {
            const team1 = [availablePlayers[i], availablePlayers[j]];
            const team2 = [availablePlayers[k], availablePlayers[l]];
            const allPlayers = [...team1, ...team2];
            
            // Calculate partnership score (lower partnership count is better)
            const team1PartnershipCount = getPartnershipCount(team1[0].id, team1[1].id);
            const team2PartnershipCount = getPartnershipCount(team2[0].id, team2[1].id);
            const partnershipScore = -(team1PartnershipCount + team2PartnershipCount) * 100;
            
            // Calculate court diversity score (higher is better)
            const courtDiversityScore = calculateCourtDiversityScore(allPlayers, court);
            
            // Calculate match count balance score (prefer players with fewer matches)
            const matchCountScore = allPlayers.reduce((sum, player) => {
              return sum - (playerMatchCount.get(player.id) || 0);
            }, 0) * 10;
            
            const totalScore = partnershipScore + courtDiversityScore + matchCountScore;
            
            if (totalScore > bestScore) {
              bestScore = totalScore;
              bestPairing = allPlayers;
            }
          }
        }
      }
    }

    return bestPairing;
  };

  // Generate matches for each round
  for (let round = 1; round <= numRounds; round++) {
    // Get available players - be less restrictive to ensure we don't skip rounds
    let availablePlayers = players.filter(player => 
      (playerLastPlayed.get(player.id) || -2) < round - 1
    );
    
    // If we don't have enough players, include players who played in the previous round
    if (availablePlayers.length < numCourts * 4) {
      availablePlayers = [...players];
    }
    
    // Sort by match count (ascending) to ensure fairness
    availablePlayers.sort((a, b) => 
      (playerMatchCount.get(a.id) || 0) - (playerMatchCount.get(b.id) || 0)
    );
    
    // Assign players to courts (4 players per court for doubles)
    const playersPerMatch = 4;
    for (let court = 0; court < numCourts && availablePlayers.length >= playersPerMatch; court++) {
      const matchPlayers = findBestTeamPairing(availablePlayers, court + 1);
      
      if (matchPlayers && matchPlayers.length === 4) {
        // Remove selected players from available list
        matchPlayers.forEach(player => {
          const index = availablePlayers.findIndex(p => p.id === player.id);
          if (index > -1) availablePlayers.splice(index, 1);
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
      }
    }
  }

  // Calculate player statistics
  const playerStats = players.map(player => ({
    playerId: player.id,
    playerName: player.name,
    matchCount: playerMatchCount.get(player.id) || 0
  }));

  return { matches, playerStats };
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
