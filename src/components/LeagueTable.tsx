import React from 'react';
import { Schedule, PlayerLeagueStats } from '@/types/schedule';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, TrendingDown } from 'lucide-react';

interface LeagueTableProps {
  schedule: Schedule;
  title?: string;
}

const LeagueTable: React.FC<LeagueTableProps> = ({ schedule, title = "League Table" }) => {
  const calculatePlayerStats = (): PlayerLeagueStats[] => {
    const statsMap = new Map<number, PlayerLeagueStats>();

    // Initialize stats for all players
    schedule.playerStats.forEach(player => {
      statsMap.set(player.playerId, {
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
        const stats = statsMap.get(player.id);
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
        const stats = statsMap.get(player.id);
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

    // Calculate derived stats and sort
    const playerStats = Array.from(statsMap.values()).map(stats => ({
      ...stats,
      pointsDifference: stats.pointsFor - stats.pointsAgainst,
      winPercentage: stats.matchesPlayed > 0 ? (stats.wins / stats.matchesPlayed) * 100 : 0
    }));

    // Sort by win percentage, then by points difference
    return playerStats.sort((a, b) => {
      if (a.winPercentage !== b.winPercentage) {
        return b.winPercentage - a.winPercentage;
      }
      return b.pointsDifference - a.pointsDifference;
    });
  };

  const playerStats = calculatePlayerStats();
  const completedMatches = schedule.matches.filter(m => m.result?.completed).length;
  const totalMatches = schedule.matches.length;

  if (completedMatches === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No completed matches yet. Enter match results to see league standings.
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
            {title}
          </div>
          <Badge variant="secondary">
            {completedMatches}/{totalMatches} matches completed
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {playerStats.map((player, index) => (
              <TableRow key={player.playerId}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {index + 1}
                    {index === 0 && <Trophy className="h-4 w-4 text-yellow-500" />}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{player.playerName}</TableCell>
                <TableCell className="text-center">{player.matchesPlayed}</TableCell>
                <TableCell className="text-center">{player.wins}</TableCell>
                <TableCell className="text-center">{player.losses}</TableCell>
                <TableCell className="text-center">{player.pointsFor}</TableCell>
                <TableCell className="text-center">{player.pointsAgainst}</TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    {player.pointsDifference > 0 && <TrendingUp className="h-3 w-3 text-green-500" />}
                    {player.pointsDifference < 0 && <TrendingDown className="h-3 w-3 text-red-500" />}
                    {player.pointsDifference}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {player.winPercentage.toFixed(1)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default LeagueTable;