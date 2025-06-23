
import { Player, Match, ScheduleConfig, Schedule } from '@/types/schedule';

export const generateSchedule = (config: ScheduleConfig): Schedule => {
  const { sessionStart, sessionEnd, matchLength, numPlayers, numCourts } = config;
  
  // Generate players
  const players: Player[] = Array.from({ length: numPlayers }, (_, i) => ({
    id: i + 1,
    name: `Player ${i + 1}`
  }));

  // Calculate time slots
  const startTime = new Date(`2024-01-01T${sessionStart}`);
  const endTime = new Date(`2024-01-01T${sessionEnd}`);
  const sessionDuration = (endTime.getTime() - startTime.getTime()) / (1000 * 60); // minutes
  const numRounds = Math.floor(sessionDuration / matchLength);
  
  const matches: Match[] = [];
  const playerMatchCount = new Map<number, number>();
  const playerLastPlayed = new Map<number, number>();
  const partnershipCount = new Map<string, number>(); // Track how many times players have been partners
  
  // Initialize player stats
  players.forEach(player => {
    playerMatchCount.set(player.id, 0);
    playerLastPlayed.set(player.id, -2); // Allow them to play in first round
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

  // Helper function to find best team pairing with least used partnerships
  const findBestTeamPairing = (availablePlayers: Player[]) => {
    let bestPairing = null;
    let lowestPartnershipSum = Infinity;

    // Try all possible team combinations (2 players per team)
    for (let i = 0; i < availablePlayers.length - 3; i++) {
      for (let j = i + 1; j < availablePlayers.length - 2; j++) {
        for (let k = j + 1; k < availablePlayers.length - 1; k++) {
          for (let l = k + 1; l < availablePlayers.length; l++) {
            const team1 = [availablePlayers[i], availablePlayers[j]];
            const team2 = [availablePlayers[k], availablePlayers[l]];
            
            // Calculate total partnership count for this pairing
            const team1PartnershipCount = getPartnershipCount(team1[0].id, team1[1].id);
            const team2PartnershipCount = getPartnershipCount(team2[0].id, team2[1].id);
            const totalPartnershipCount = team1PartnershipCount + team2PartnershipCount;
            
            if (totalPartnershipCount < lowestPartnershipSum) {
              lowestPartnershipSum = totalPartnershipCount;
              bestPairing = [...team1, ...team2];
            }
          }
        }
      }
    }

    return bestPairing;
  };

  // Generate matches for each round
  for (let round = 0; round < numRounds; round++) {
    const roundStartTime = new Date(startTime.getTime() + round * matchLength * 60000);
    const roundEndTime = new Date(roundStartTime.getTime() + matchLength * 60000);
    
    // Get available players (those who didn't play in the last round)
    const availablePlayers = players.filter(player => 
      (playerLastPlayed.get(player.id) || -2) < round - 1
    );
    
    // Sort by match count (ascending) to ensure fairness
    availablePlayers.sort((a, b) => 
      (playerMatchCount.get(a.id) || 0) - (playerMatchCount.get(b.id) || 0)
    );
    
    // Assign players to courts (4 players per court for doubles)
    const playersPerMatch = 4;
    for (let court = 0; court < numCourts && availablePlayers.length >= playersPerMatch; court++) {
      const matchPlayers = findBestTeamPairing(availablePlayers);
      
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
          startTime: roundStartTime.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          endTime: roundEndTime.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        });
        
        // Update player stats
        matchPlayers.forEach(player => {
          playerMatchCount.set(player.id, (playerMatchCount.get(player.id) || 0) + 1);
          playerLastPlayed.set(player.id, round);
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
    matchCount: playerMatchCount.get(player.id) || 0,
    restTime: (numRounds - (playerMatchCount.get(player.id) || 0)) * matchLength
  }));

  return { matches, playerStats };
};
