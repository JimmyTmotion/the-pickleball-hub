
export interface Player {
  id: number;
  name: string;
}

export interface MatchResult {
  team1Score: number;
  team2Score: number;
  completed: boolean;
}

export interface Match {
  id: number;
  court: number;
  players: Player[];
  round: number;
  result?: MatchResult;
}

export interface ScoringWeights {
  balance: number;
  mustPlay: number;
  partnership: number;
  opposition: number;
  court: number;
}

export interface ScheduleConfig {
  numRounds: number;
  numPlayers: number;
  numCourts: number;
  playerNames?: string[]; // Optional custom player names
  avoidConsecutiveSittingOut?: boolean; // Avoid players sitting out twice in a row
  balanceMatchCounts?: boolean; // Balance match counts across all players
  scoringWeights?: ScoringWeights; // Optional scoring weights for match generation
}

export interface SavedSchedule {
  id: string;
  name: string;
  config: ScheduleConfig;
  schedule: Schedule;
  createdAt: Date;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  club_id?: string | null;
  subgroup_id?: string | null;
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

export interface PlayerLeagueStats {
  playerId: number;
  playerName: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  pointsDifference: number;
  winPercentage: number;
}
