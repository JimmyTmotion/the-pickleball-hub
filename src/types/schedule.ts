
export interface Player {
  id: number;
  name: string;
}

export interface Match {
  id: number;
  court: number;
  players: Player[];
  startTime: string;
  endTime: string;
}

export interface ScheduleConfig {
  sessionStart: string;
  sessionEnd: string;
  matchLength: number; // minutes
  numPlayers: number;
  numCourts: number;
  playerNames?: string[]; // Optional custom player names
}

export interface Schedule {
  matches: Match[];
  playerStats: {
    playerId: number;
    playerName: string;
    matchCount: number;
    restTime: number;
  }[];
}
