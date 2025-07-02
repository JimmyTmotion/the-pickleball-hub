
export interface Player {
  id: number;
  name: string;
}

export interface Match {
  id: number;
  court: number;
  players: Player[];
  round: number;
}

export interface ScheduleConfig {
  numRounds: number;
  numPlayers: number;
  numCourts: number;
  playerNames?: string[]; // Optional custom player names
  randomSeed?: number; // Optional random seed for variability
  prioritizeUniquePartnerships?: boolean; // Prioritize unique partnerships
}

export interface SavedSchedule {
  id: string;
  name: string;
  config: ScheduleConfig;
  schedule: Schedule;
  createdAt: Date;
}

export interface Schedule {
  matches: Match[];
  playerStats: {
    playerId: number;
    playerName: string;
    matchCount: number;
  }[];
  roundSittingOut: Record<number, Player[]>; // Track who sits out each round
}
