
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Users } from 'lucide-react';
import { Schedule } from '@/types/schedule';

interface PlayerAnalyticsProps {
  schedule: Schedule;
}

const PlayerAnalytics: React.FC<PlayerAnalyticsProps> = ({ schedule }) => {
  const { matches } = schedule;

  // Create maps to track partnerships and opponent counts
  const partnershipCounts = new Map<string, number>();
  const opponentCounts = new Map<string, number>();
  const allPlayers = new Set<string>();

  // Process matches to count partnerships and opponents
  matches.forEach(match => {
    const players = match.players;
    
    // Add all players to our set
    players.forEach(player => allPlayers.add(player.name));
    
    // Teams are: [0,1] vs [2,3]
    const team1 = [players[0], players[1]];
    const team2 = [players[2], players[3]];
    
    // Count partnerships within teams
    const partnerKey1 = `${team1[0].name}-${team1[1].name}`;
    const partnerKey1Reverse = `${team1[1].name}-${team1[0].name}`;
    const normalizedPartnerKey1 = [team1[0].name, team1[1].name].sort().join('-');
    partnershipCounts.set(normalizedPartnerKey1, (partnershipCounts.get(normalizedPartnerKey1) || 0) + 1);
    
    const partnerKey2 = `${team2[0].name}-${team2[1].name}`;
    const partnerKey2Reverse = `${team2[1].name}-${team2[0].name}`;
    const normalizedPartnerKey2 = [team2[0].name, team2[1].name].sort().join('-');
    partnershipCounts.set(normalizedPartnerKey2, (partnershipCounts.get(normalizedPartnerKey2) || 0) + 1);
    
    // Count opponents (team1 vs team2)
    team1.forEach(p1 => {
      team2.forEach(p2 => {
        const opponentKey = [p1.name, p2.name].sort().join('-');
        opponentCounts.set(opponentKey, (opponentCounts.get(opponentKey) || 0) + 1);
      });
    });
  });

  const playersArray = Array.from(allPlayers).sort();

  // Create partnership matrix
  const partnershipMatrix: Array<Array<number | null>> = playersArray.map(() => 
    playersArray.map(() => null)
  );

  // Create opponent matrix
  const opponentMatrix: Array<Array<number | null>> = playersArray.map(() => 
    playersArray.map(() => null)
  );

  // Fill matrices
  playersArray.forEach((player1, i) => {
    playersArray.forEach((player2, j) => {
      if (i !== j) {
        const key = [player1, player2].sort().join('-');
        partnershipMatrix[i][j] = partnershipCounts.get(key) || 0;
        opponentMatrix[i][j] = opponentCounts.get(key) || 0;
      }
    });
  });

  const getCountColor = (count: number, type: 'partnership' | 'opponent') => {
    if (count === 0) return 'bg-gray-100 text-gray-500';
    if (count === 1) return type === 'partnership' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700';
    if (count === 2) return type === 'partnership' ? 'bg-blue-200 text-blue-800' : 'bg-red-200 text-red-800';
    return type === 'partnership' ? 'bg-blue-300 text-blue-900' : 'bg-red-300 text-red-900';
  };

  return (
    <div className="space-y-6">
      {/* Partnership Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-blue-700">
            <Users className="h-5 w-5" />
            Partnership Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Player</TableHead>
                  {playersArray.map(player => (
                    <TableHead key={player} className="text-center font-semibold min-w-[80px]">
                      {player}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {playersArray.map((player1, i) => (
                  <TableRow key={player1}>
                    <TableCell className="font-medium">{player1}</TableCell>
                    {playersArray.map((player2, j) => (
                      <TableCell key={player2} className="text-center">
                        {i === j ? (
                          <div className="w-8 h-8 bg-gray-200 rounded mx-auto"></div>
                        ) : (
                          <Badge 
                            variant="secondary" 
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${getCountColor(partnershipMatrix[i][j] || 0, 'partnership')}`}
                          >
                            {partnershipMatrix[i][j] || 0}
                          </Badge>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-sm text-gray-600 mt-4">
            This table shows how many times each player has been <strong>partnered</strong> with every other player.
          </p>
        </CardContent>
      </Card>

      {/* Opponent Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-red-700">
            <BarChart3 className="h-5 w-5" />
            Opponent Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Player</TableHead>
                  {playersArray.map(player => (
                    <TableHead key={player} className="text-center font-semibold min-w-[80px]">
                      {player}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {playersArray.map((player1, i) => (
                  <TableRow key={player1}>
                    <TableCell className="font-medium">{player1}</TableCell>
                    {playersArray.map((player2, j) => (
                      <TableCell key={player2} className="text-center">
                        {i === j ? (
                          <div className="w-8 h-8 bg-gray-200 rounded mx-auto"></div>
                        ) : (
                          <Badge 
                            variant="secondary" 
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${getCountColor(opponentMatrix[i][j] || 0, 'opponent')}`}
                          >
                            {opponentMatrix[i][j] || 0}
                          </Badge>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-sm text-gray-600 mt-4">
            This table shows how many times each player has played <strong>against</strong> every other player.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlayerAnalytics;
