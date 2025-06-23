
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
  
  // Initialize player stats
  players.forEach(player => {
    playerMatchCount.set(player.id, 0);
    playerLastPlayed.set(player.id, -2); // Allow them to play in first round
  });

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
      const matchPlayers = availablePlayers.splice(0, playersPerMatch);
      
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
