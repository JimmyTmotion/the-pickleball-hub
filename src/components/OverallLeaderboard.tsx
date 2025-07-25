import React from 'react';
import { SavedSchedule, PlayerLeagueStats } from '@/types/schedule';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trophy, Crown, Medal, Award } from 'lucide-react';

interface OverallLeaderboardProps {
  savedSchedules: SavedSchedule[];
}

const OverallLeaderboard: React.FC<OverallLeaderboardProps> = ({ savedSchedules }) => {
  const calculateOverallStats = (): PlayerLeagueStats[] => {
    const statsMap = new Map<string, PlayerLeagueStats>();

    savedSchedules.forEach(savedSchedule => {
      const { schedule } = savedSchedule;
      
      // Initialize stats for all players in this schedule
      schedule.playerStats.forEach(player => {
        if (!statsMap.has(player.playerName)) {
          statsMap.set(player.playerName, {
            playerId: player.playerId,
            playerName: player.playerName,
            matchesPlayed: 0,
            wins: 0,
            losses: 0,
            pointsFor: 0,
            pointsAgainst: 0,
            pointsDifference: 0,
            winPercentage: 0
          });
        }
      });

      // Calculate stats from completed matches
      schedule.matches.forEach(match => {
        if (!match.result?.completed) return;

        const team1 = [match.players[0], match.players[1]];
        const team2 = [match.players[2], match.players[3]];
        const team1Score = match.result.team1Score;
        const team2Score = match.result.team2Score;

        // Update stats for team 1 players
        team1.forEach(player => {
          const stats = statsMap.get(player.name);
          if (stats) {
            stats.matchesPlayed++;
            stats.pointsFor += team1Score;
            stats.pointsAgainst += team2Score;
            if (team1Score > team2Score) {
              stats.wins++;
            } else if (team1Score < team2Score) {
              stats.losses++;
            }
          }
        });

        // Update stats for team 2 players
        team2.forEach(player => {
          const stats = statsMap.get(player.name);
          if (stats) {
            stats.matchesPlayed++;
            stats.pointsFor += team2Score;
            stats.pointsAgainst += team1Score;
            if (team2Score > team1Score) {
              stats.wins++;
            } else if (team2Score < team1Score) {
              stats.losses++;
            }
          }
        });
      });
    });

    // Calculate derived stats and sort
    const playerStats = Array.from(statsMap.values())
      .filter(stats => stats.matchesPlayed > 0) // Only include players who have played
      .map(stats => ({
        ...stats,
        pointsDifference: stats.pointsFor - stats.pointsAgainst,
        winPercentage: stats.matchesPlayed > 0 ? (stats.wins / stats.matchesPlayed) * 100 : 0
      }));

    // Sort by wins, then by win percentage, then by points difference
    return playerStats.sort((a, b) => {
      if (a.wins !== b.wins) {
        return b.wins - a.wins;
      }
      if (a.winPercentage !== b.winPercentage) {
        return b.winPercentage - a.winPercentage;
      }
      return b.pointsDifference - a.pointsDifference;
    });
  };

  const playerStats = calculateOverallStats();
  const totalCompletedMatches = savedSchedules.reduce((total, savedSchedule) => 
    total + savedSchedule.schedule.matches.filter(m => m.result?.completed).length, 0
  );

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="h-4 w-4 text-yellow-500" />;
      case 2: return <Medal className="h-4 w-4 text-gray-400" />;
      case 3: return <Award className="h-4 w-4 text-amber-600" />;
      default: return null;
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1: return <Badge className="bg-yellow-500 hover:bg-yellow-600">Champion</Badge>;
      case 2: return <Badge className="bg-gray-400 hover:bg-gray-500">Runner-up</Badge>;
      case 3: return <Badge className="bg-amber-600 hover:bg-amber-700">3rd Place</Badge>;
      default: return null;
    }
  };

  if (playerStats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Overall Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No completed matches across all schedules yet.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Overall Leaderboard
          </div>
          <Badge variant="secondary">
            {totalCompletedMatches} total matches completed
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Player</TableHead>
              <TableHead className="text-center">MP</TableHead>
              <TableHead className="text-center">W</TableHead>
              <TableHead className="text-center">L</TableHead>
              <TableHead className="text-center">PF</TableHead>
              <TableHead className="text-center">PA</TableHead>
              <TableHead className="text-center">PD</TableHead>
              <TableHead className="text-center">Win%</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {playerStats.map((player, index) => (
              <TableRow key={player.playerName} className={index < 3 ? 'bg-muted/50' : ''}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {index + 1}
                    {getRankIcon(index + 1)}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{player.playerName}</TableCell>
                <TableCell className="text-center">{player.matchesPlayed}</TableCell>
                <TableCell className="text-center font-medium">{player.wins}</TableCell>
                <TableCell className="text-center">{player.losses}</TableCell>
                <TableCell className="text-center">{player.pointsFor}</TableCell>
                <TableCell className="text-center">{player.pointsAgainst}</TableCell>
                <TableCell className="text-center">
                  <span className={player.pointsDifference >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {player.pointsDifference > 0 ? '+' : ''}{player.pointsDifference}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  {player.winPercentage.toFixed(1)}%
                </TableCell>
                <TableCell>
                  {getRankBadge(index + 1)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default OverallLeaderboard;