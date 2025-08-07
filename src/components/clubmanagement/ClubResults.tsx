import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import LeagueTable from '@/components/LeagueTable';
import { Calendar, Trophy, ChevronDown } from 'lucide-react';
import { SavedSchedule } from '@/types/schedule';

interface ClubResultsProps {
  schedules: SavedSchedule[];
}

const ClubResults: React.FC<ClubResultsProps> = ({ schedules }) => {
  const getCompletedMatchesCount = (schedule: SavedSchedule) => {
    return schedule.schedule.matches.filter(m => m.result?.completed).length;
  };

  const areAllMatchesCompleted = (schedule: SavedSchedule) => {
    return schedule.schedule.matches.every(match => match.result?.completed);
  };

  const getPlayerAwards = (schedule: SavedSchedule) => {
    const statsMap = new Map();
    
    // Initialize stats for all players
    schedule.schedule.playerStats.forEach(player => {
      statsMap.set(player.playerId, {
        playerId: player.playerId,
        playerName: player.playerName,
        pointsFor: 0,
        pointsAgainst: 0,
        pointsDifference: 0
      });
    });

    // Calculate stats from completed matches
    schedule.schedule.matches.forEach(match => {
      if (!match.result?.completed) return;

      const team1 = [match.players[0], match.players[1]];
      const team2 = [match.players[2], match.players[3]];
      const team1Score = match.result.team1Score;
      const team2Score = match.result.team2Score;

      team1.forEach(player => {
        const stats = statsMap.get(player.id);
        if (stats) {
          stats.pointsFor += team1Score;
          stats.pointsAgainst += team2Score;
        }
      });

      team2.forEach(player => {
        const stats = statsMap.get(player.id);
        if (stats) {
          stats.pointsFor += team2Score;
          stats.pointsAgainst += team1Score;
        }
      });
    });

    const playerStats = Array.from(statsMap.values()).map(stats => ({
      ...stats,
      pointsDifference: stats.pointsFor - stats.pointsAgainst
    }));

    const completedMatches = schedule.schedule.matches.filter(m => m.result?.completed).length;
    
    if (completedMatches === 0) return null;

    const topScorer = playerStats.reduce((max, player) => 
      player.pointsFor > max.pointsFor ? player : max
    );
    
    const bestDefensive = playerStats.reduce((min, player) => 
      player.pointsAgainst < min.pointsAgainst ? player : min
    );
    
    const mostConsistent = playerStats.reduce((max, player) => 
      player.pointsDifference > max.pointsDifference ? player : max
    );

    return { topScorer, bestDefensive, mostConsistent };
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Club Results ({schedules.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No schedules assigned to this club yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {schedules.map((schedule) => {
                const completedMatches = getCompletedMatchesCount(schedule);
                const allMatchesCompleted = areAllMatchesCompleted(schedule);
                const awards = getPlayerAwards(schedule);
                
                return (
                  <Card key={schedule.id} className="border-l-4 border-l-primary">
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg break-words">{schedule.name}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            Created by {schedule.createdBy.name} on {schedule.createdAt.toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-xs">
                            {schedule.config.numRounds} rounds
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {schedule.config.numPlayers} players
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {schedule.config.numCourts} courts
                          </Badge>
                          {completedMatches > 0 && (
                            <Badge className="text-xs">
                              <Trophy className="h-3 w-3 mr-1" />
                              {completedMatches}/{schedule.schedule.matches.length} complete
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {completedMatches > 0 && (
                        <Collapsible>
                          <CollapsibleTrigger className="flex items-center gap-2 w-full hover:bg-muted/50 p-2 rounded transition-colors">
                            <Trophy className="h-4 w-4 text-yellow-500" />
                            <span className="font-medium">League Table & Results</span>
                            <ChevronDown className="h-4 w-4 ml-auto transition-transform duration-200 data-[state=open]:rotate-180" />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="space-y-4 mt-4">
                            {/* League Table - Mobile Optimized */}
                            <div className="space-y-3">
                              <h4 className="font-medium text-sm">League Table</h4>
                              <div className="block lg:hidden">
                                {/* Mobile compact view */}
                                <LeagueTable schedule={schedule.schedule} compact={true} />
                              </div>
                              <div className="hidden lg:block">
                                {/* Desktop full table */}
                                <LeagueTable schedule={schedule.schedule} />
                              </div>
                            </div>
                            
                            {/* Player Awards */}
                            {allMatchesCompleted && awards && (
                              <div className="space-y-2">
                                <h4 className="font-medium text-sm">Player Awards</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
                                    <CardContent className="p-3 text-center">
                                      <div className="text-lg mb-1">🏆</div>
                                      <h5 className="font-medium text-yellow-700 text-xs">Top Scorer</h5>
                                      <p className="text-sm font-bold">{awards.topScorer.playerName}</p>
                                      <p className="text-xs text-muted-foreground">{awards.topScorer.pointsFor} points</p>
                                    </CardContent>
                                  </Card>
                                  
                                  <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                                    <CardContent className="p-3 text-center">
                                      <div className="text-lg mb-1">🛡️</div>
                                      <h5 className="font-medium text-blue-700 text-xs">Best Defense</h5>
                                      <p className="text-sm font-bold">{awards.bestDefensive.playerName}</p>
                                      <p className="text-xs text-muted-foreground">{awards.bestDefensive.pointsAgainst} conceded</p>
                                    </CardContent>
                                  </Card>
                                  
                                  <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                                    <CardContent className="p-3 text-center">
                                      <div className="text-lg mb-1">📈</div>
                                      <h5 className="font-medium text-green-700 text-xs">Most Consistent</h5>
                                      <p className="text-sm font-bold">{awards.mostConsistent.playerName}</p>
                                      <p className="text-xs text-muted-foreground">+{awards.mostConsistent.pointsDifference}</p>
                                    </CardContent>
                                  </Card>
                                </div>
                              </div>
                            )}
                            
                            {/* Individual Match Results by Round */}
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm">Match Results by Round</h4>
                              <div className="space-y-3">
                                {Array.from(new Set(schedule.schedule.matches.map(m => m.round))).sort().map(round => {
                                  const roundMatches = schedule.schedule.matches.filter(m => m.round === round);
                                  const completedRoundMatches = roundMatches.filter(m => m.result?.completed);
                                  
                                  return (
                                    <div key={round} className="border rounded-lg p-3">
                                      <h5 className="font-medium text-sm mb-2">
                                        Round {round} ({completedRoundMatches.length}/{roundMatches.length} completed)
                                      </h5>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {roundMatches.map(match => (
                                          <div key={match.id} className="text-xs p-2 bg-muted/50 rounded">
                                            <div className="flex justify-between items-center">
                                              <span className="font-medium">Court {match.court}</span>
                                              {match.result?.completed ? (
                                                <Badge variant="secondary" className="text-xs">
                                                  {match.result.team1Score} - {match.result.team2Score}
                                                </Badge>
                                              ) : (
                                                <Badge variant="outline" className="text-xs">
                                                  Not played
                                                </Badge>
                                              )}
                                            </div>
                                            <div className="mt-1">
                                              <p>{match.players[0]?.name} & {match.players[1]?.name}</p>
                                              <p className="text-muted-foreground">vs</p>
                                              <p>{match.players[2]?.name} & {match.players[3]?.name}</p>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                      
                      {completedMatches === 0 && (
                        <div className="text-center py-4 text-muted-foreground">
                          <p className="text-sm">No matches completed yet. Check back when results are available!</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClubResults;