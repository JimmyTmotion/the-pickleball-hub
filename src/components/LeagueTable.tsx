import React from 'react';
import { Schedule, PlayerLeagueStats } from '@/types/schedule';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, TrendingDown } from 'lucide-react';

interface LeagueTableProps {
  schedule: Schedule;
  title?: string;
  compact?: boolean; // New prop for mobile optimization
}

const LeagueTable: React.FC<LeagueTableProps> = ({ schedule, title = "League Table", compact = false }) => {
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

  if (compact) {
    // Mobile-optimized compact view
    return (
      <div className="space-y-2">
        {playerStats.map((player, index) => (
          <div key={player.playerId} className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">#{index + 1}</span>
                {index === 0 && <Trophy className="h-4 w-4 text-yellow-500" />}
                <span className="font-medium text-sm">{player.playerName}</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {player.winPercentage.toFixed(1)}% wins
              </Badge>
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
              <div className="text-center">
                <div className="font-medium">{player.matchesPlayed}</div>
                <div>Played</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-green-600">{player.wins}</div>
                <div>Won</div>
              </div>
              <div className="text-center">
                <div className="font-medium">{player.pointsFor}</div>
                <div>Points</div>
              </div>
              <div className="text-center">
                <div className={`font-medium flex items-center justify-center gap-1 ${
                  player.pointsDifference > 0 ? 'text-green-600' : 
                  player.pointsDifference < 0 ? 'text-red-600' : 'text-muted-foreground'
                }`}>
                  {player.pointsDifference > 0 && <TrendingUp className="h-3 w-3" />}
                  {player.pointsDifference < 0 && <TrendingDown className="h-3 w-3" />}
                  {player.pointsDifference > 0 ? '+' : ''}{player.pointsDifference}
                </div>
                <div>Diff</div>
              </div>
            </div>
          </div>
        ))}
      </div>
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
        <div className="overflow-x-auto">
          <Table className="text-xs md:text-sm">
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-xs">#</TableHead>
                <TableHead className="text-xs">Player</TableHead>
                <TableHead className="text-center text-xs">MP</TableHead>
                <TableHead className="text-center text-xs">W</TableHead>
                <TableHead className="text-center text-xs">L</TableHead>
                <TableHead className="text-center text-xs">PF</TableHead>
                <TableHead className="text-center text-xs">PA</TableHead>
                <TableHead className="text-center text-xs">PD</TableHead>
                <TableHead className="text-center text-xs">Win%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {playerStats.map((player, index) => (
                <TableRow key={player.playerId}>
                  <TableCell className="font-medium text-xs">
                    <div className="flex items-center gap-1">
                      {index + 1}
                      {index === 0 && <Trophy className="h-3 w-3 text-yellow-500" />}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-xs">{player.playerName}</TableCell>
                  <TableCell className="text-center text-xs">{player.matchesPlayed}</TableCell>
                  <TableCell className="text-center text-xs">{player.wins}</TableCell>
                  <TableCell className="text-center text-xs">{player.losses}</TableCell>
                  <TableCell className="text-center text-xs">{player.pointsFor}</TableCell>
                  <TableCell className="text-center text-xs">{player.pointsAgainst}</TableCell>
                  <TableCell className="text-center text-xs">
                    <div className="flex items-center justify-center gap-1">
                      {player.pointsDifference > 0 && <TrendingUp className="h-3 w-3 text-green-500" />}
                      {player.pointsDifference < 0 && <TrendingDown className="h-3 w-3 text-red-500" />}
                      {player.pointsDifference}
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-xs">
                    {player.winPercentage.toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeagueTable;