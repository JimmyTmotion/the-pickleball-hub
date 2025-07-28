import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Schedule, Match, MatchResult } from '@/types/schedule';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ChevronLeft, ChevronRight, Trophy, Edit, SkipForward, SkipBack } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import LeagueTable from '@/components/LeagueTable';
import AnimatedSection from '@/components/AnimatedSection';
import PlayerSwapper from '@/components/PlayerSwapper';
import CountdownTimer from '@/components/CountdownTimer';
import { updateSchedule } from '@/utils/scheduleStorage';

interface TournamentState {
  schedule: Schedule;
  name: string;
  scheduleId?: string; // Add optional scheduleId for saving changes
}

const Tournament = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const tournamentData = location.state as TournamentState;

  const [currentRound, setCurrentRound] = useState(1);
  const [schedule, setSchedule] = useState<Schedule>(tournamentData?.schedule);
  const [showResults, setShowResults] = useState(false);
  const [roundResults, setRoundResults] = useState<Record<number, MatchResult>>({});
  const [tournamentComplete, setTournamentComplete] = useState(false);
  const [editingMatch, setEditingMatch] = useState<number | null>(null);
  const [editingCompletedMatch, setEditingCompletedMatch] = useState<number | null>(null);
  const [editingScores, setEditingScores] = useState<number | null>(null);
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const [audioRef] = useState(new Audio('/siren.mp3'));

  useEffect(() => {
    if (!tournamentData) {
      navigate('/scheduler');
      return;
    }
  }, [tournamentData, navigate]);

  if (!tournamentData) {
    return null;
  }

  const totalRounds = Math.max(...schedule.matches.map(m => m.round));
  const currentRoundMatches = schedule.matches.filter(m => m.round === currentRound);
  const sittingOut = schedule.roundSittingOut[currentRound] || [];
  
  // Check if current round is completed (all matches have results)
  const isCurrentRoundCompleted = currentRoundMatches.every(match => match.result?.completed);

  const handleTimerComplete = () => {
    setIsAlarmActive(true);
    audioRef.loop = true;
    audioRef.play().catch(console.error);
    toast({
      title: "Time's Up!",
      description: "Round timer has finished. Confirm to enter results.",
    });
  };

  const handleConfirmRoundComplete = () => {
    setIsAlarmActive(false);
    audioRef.pause();
    audioRef.currentTime = 0;
    setShowResults(true);
    toast({
      title: "Round Confirmed!",
      description: "Enter the results for all matches in this round.",
    });
  };

  const handleTimerStart = () => {
    toast({
      title: "Round Started!",
      description: `Round ${currentRound} timer has begun.`,
    });
  };

  const handleTimerStop = () => {
    setShowResults(true);
    toast({
      title: "Round Complete!",
      description: "Enter the results for all matches in this round.",
    });
  };

  const handleTimerReset = () => {
    toast({
      title: "Timer Reset",
      description: "Round timer has been reset.",
    });
  };

  const handleResultChange = (matchId: number, field: 'team1Score' | 'team2Score', value: string) => {
    const score = parseInt(value) || 0;
    
    // If editing a completed match, update it directly in the schedule
    if (editingScores === matchId) {
      const updatedMatches = schedule.matches.map(match => {
        if (match.id === matchId) {
          return {
            ...match,
            result: {
              ...match.result!,
              [field]: score
            }
          };
        }
        return match;
      });
      
      setSchedule({
        ...schedule,
        matches: updatedMatches
      });
    } else {
      // Otherwise, update the temporary results for new entries
      setRoundResults(prev => ({
        ...prev,
        [matchId]: {
          ...prev[matchId],
          [field]: score,
          completed: false
        }
      }));
    }
  };

  const handleSaveResults = async () => {
    const updatedMatches = schedule.matches.map(match => {
      if (match.round === currentRound && roundResults[match.id]) {
        const result = roundResults[match.id];
        return {
          ...match,
          result: {
            ...result,
            completed: true
          }
        };
      }
      return match;
    });

    const updatedSchedule = {
      ...schedule,
      matches: updatedMatches
    };

    setSchedule(updatedSchedule);
    setRoundResults({});
    setShowResults(false);

    // Save to database if scheduleId is available
    if (tournamentData.scheduleId) {
      try {
        await updateSchedule(tournamentData.scheduleId, updatedSchedule);
        toast({
          title: "Results Saved!",
          description: `Round ${currentRound} results have been saved to database.`,
        });
      } catch (error) {
        toast({
          title: "Save Error",
          description: "Failed to save results to database, but local changes preserved.",
          variant: "destructive",
        });
      }
    }

    if (currentRound < totalRounds) {
      toast({
        title: "Results Saved!",
        description: `Round ${currentRound} results have been recorded. Ready for round ${currentRound + 1}.`,
      });
      setCurrentRound(currentRound + 1);
    } else {
      setTournamentComplete(true);
      toast({
        title: "Tournament Complete!",
        description: "All rounds completed! Check the final standings.",
      });
    }
  };

  const handlePlayerSwap = async (matchId: number, fromIndex: number, toIndex: number) => {
    const updatedMatches = schedule.matches.map(match => {
      if (match.id === matchId) {
        const newPlayers = [...match.players];
        [newPlayers[fromIndex], newPlayers[toIndex]] = [newPlayers[toIndex], newPlayers[fromIndex]];
        return { ...match, players: newPlayers };
      }
      return match;
    });

    const updatedSchedule = {
      ...schedule,
      matches: updatedMatches
    };

    setSchedule(updatedSchedule);
    
    // Clear any pending results for this match since the lineup changed
    setRoundResults(prev => {
      const updated = { ...prev };
      delete updated[matchId];
      return updated;
    });

    // Save to database if scheduleId is available
    if (tournamentData.scheduleId) {
      try {
        await updateSchedule(tournamentData.scheduleId, updatedSchedule);
      } catch (error) {
        console.error('Failed to save player swap:', error);
      }
    }

    toast({
      title: "Players Swapped",
      description: "Match lineup has been updated successfully. Any unsaved results for this match have been cleared.",
    });
  };

  const handlePreviousRound = () => {
    if (currentRound > 1) {
      setCurrentRound(currentRound - 1);
      setShowResults(false);
      setRoundResults({});
      setEditingMatch(null);
      setEditingCompletedMatch(null);
      setEditingScores(null);
      toast({
        title: "Round Changed",
        description: `Moved to Round ${currentRound - 1}`,
      });
    }
  };

  const handleNextRound = () => {
    if (currentRound < totalRounds) {
      setCurrentRound(currentRound + 1);
      setShowResults(false);
      setRoundResults({});
      setEditingMatch(null);
      setEditingCompletedMatch(null);
      setEditingScores(null);
      toast({
        title: "Round Changed",
        description: `Moved to Round ${currentRound + 1}`,
      });
    }
  };

  const allResultsEntered = currentRoundMatches.every(match => 
    roundResults[match.id] && 
    typeof roundResults[match.id].team1Score === 'number' && 
    typeof roundResults[match.id].team2Score === 'number'
  );

  if (tournamentComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50">
        <div className="container mx-auto px-4 py-8">
          <AnimatedSection animation="scale-in" className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Trophy className="h-12 w-12 text-yellow-500" />
              <h1 className="text-4xl font-bold text-gray-900">Tournament Complete!</h1>
            </div>
            <p className="text-lg text-gray-600">
              Congratulations to all players! Here are the final standings:
            </p>
          </AnimatedSection>

          <AnimatedSection animation="fade-up" delay={100} className="max-w-4xl mx-auto mb-8">
            <LeagueTable schedule={schedule} title="Final Tournament Standings" />
          </AnimatedSection>

          <AnimatedSection animation="fade-up" delay={200} className="text-center">
            <Button onClick={() => navigate('/scheduler')} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Scheduler
            </Button>
          </AnimatedSection>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-white ${isAlarmActive ? 'animate-red-flash' : ''}`}>
      {/* Alarm Confirmation Overlay */}
      {isAlarmActive && (
        <div className="fixed inset-0 bg-red-500/80 flex items-center justify-center z-50">
          <AnimatedSection animation="scale-in" className="bg-white p-8 rounded-lg shadow-2xl text-center max-w-md mx-4">
            <div className="text-red-600 text-6xl mb-4">⏰</div>
            <h2 className="text-2xl font-bold text-red-700 mb-4">TIME'S UP!</h2>
            <p className="text-gray-700 mb-6">Round {currentRound} has finished. Please confirm to enter results.</p>
            <Button 
              onClick={handleConfirmRoundComplete}
              size="lg"
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3"
            >
              Confirm & Enter Results
            </Button>
          </AnimatedSection>
        </div>
      )}
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <AnimatedSection animation="fade-up" className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/scheduler')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Scheduler
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{tournamentData.name}</h1>
              <p className="text-gray-600">Round {currentRound} of {totalRounds}</p>
            </div>
          </div>
        </AnimatedSection>

        {/* Round Navigation */}
        <AnimatedSection animation="fade-up" delay={50}>
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={handlePreviousRound}
                  disabled={currentRound === 1}
                  className="flex items-center gap-2"
                >
                  <SkipBack className="h-4 w-4" />
                  Previous Round
                </Button>
                
                <div className="flex items-center gap-2 text-lg font-semibold">
                  Round {currentRound} of {totalRounds}
                </div>
                
                <Button
                  variant="outline"
                  onClick={handleNextRound}
                  disabled={currentRound === totalRounds}
                  className="flex items-center gap-2"
                >
                  Next Round
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </AnimatedSection>

        {/* Timer */}
        {!showResults && (
          <AnimatedSection animation="scale-in" delay={100} className="mb-8">
            <CountdownTimer
              onTimerComplete={handleTimerComplete}
              onTimerStart={handleTimerStart}
              onTimerStop={handleTimerStop}
              onTimerReset={handleTimerReset}
              onCompleteRound={handleTimerStop}
              currentRound={currentRound}
            />
          </AnimatedSection>
        )}

        {/* Match Display */}
        <AnimatedSection animation="fade-up" delay={150} className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {currentRoundMatches.map((match) => (
            <Card key={match.id} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <Badge variant="outline" className="mb-2">Court {match.court}</Badge>
                  <div className="flex gap-1">
                    {/* Single edit button that handles both cases */}
                    {!showResults && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (isCurrentRoundCompleted) {
                            setEditingCompletedMatch(editingCompletedMatch === match.id ? null : match.id);
                          } else {
                            setEditingMatch(editingMatch === match.id ? null : match.id);
                          }
                        }}
                        className="h-8 w-8 p-0"
                        title={isCurrentRoundCompleted ? "Edit teams" : "Edit teams"}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    )}
                    
                    {/* Score edit button for completed matches */}
                    {match.result?.completed && !showResults && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingScores(editingScores === match.id ? null : match.id)}
                        className="h-8 w-8 p-0"
                        title="Edit scores"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(editingMatch === match.id && !isCurrentRoundCompleted) || (editingCompletedMatch === match.id && isCurrentRoundCompleted) ? (
                  <PlayerSwapper
                    players={match.players}
                    onSwap={(fromIndex, toIndex) => handlePlayerSwap(match.id, fromIndex, toIndex)}
                    className="mt-2"
                  />
                ) : (
                  <div className="space-y-4">
                    {/* Team 1 */}
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="font-semibold text-blue-700 mb-2">Team 1</div>
                      <div className="space-y-1">
                        <div className="font-medium">{match.players[0]?.name}</div>
                        <div className="font-medium">{match.players[1]?.name}</div>
                      </div>
                      {showResults && (
                        <div className="mt-3">
                          <Label htmlFor={`team1-${match.id}`} className="text-sm">Score:</Label>
                          <Input
                            id={`team1-${match.id}`}
                            type="number"
                            min="0"
                            className="mt-1"
                            onChange={(e) => handleResultChange(match.id, 'team1Score', e.target.value)}
                            value={roundResults[match.id]?.team1Score || ''}
                          />
                        </div>
                      )}
                      {/* Show and edit saved results for completed matches */}
                      {match.result?.completed && !showResults && (
                        <div className="mt-2">
                          {editingScores === match.id ? (
                            <div>
                              <Label htmlFor={`edit-team1-${match.id}`} className="text-sm">Score:</Label>
                              <Input
                                id={`edit-team1-${match.id}`}
                                type="number"
                                min="0"
                                className="mt-1"
                                onChange={(e) => handleResultChange(match.id, 'team1Score', e.target.value)}
                                value={match.result.team1Score}
                              />
                            </div>
                          ) : (
                            <div className="text-lg font-bold text-blue-600">
                              Score: {match.result.team1Score}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="text-center text-xl font-bold text-gray-600">VS</div>

                    {/* Team 2 */}
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="font-semibold text-orange-700 mb-2">Team 2</div>
                      <div className="space-y-1">
                        <div className="font-medium">{match.players[2]?.name}</div>
                        <div className="font-medium">{match.players[3]?.name}</div>
                      </div>
                      {showResults && (
                        <div className="mt-3">
                          <Label htmlFor={`team2-${match.id}`} className="text-sm">Score:</Label>
                          <Input
                            id={`team2-${match.id}`}
                            type="number"
                            min="0"
                            className="mt-1"
                            onChange={(e) => handleResultChange(match.id, 'team2Score', e.target.value)}
                            value={roundResults[match.id]?.team2Score || ''}
                          />
                        </div>
                      )}
                      {/* Show and edit saved results for completed matches */}
                      {match.result?.completed && !showResults && (
                        <div className="mt-2">
                          {editingScores === match.id ? (
                            <div>
                              <Label htmlFor={`edit-team2-${match.id}`} className="text-sm">Score:</Label>
                              <Input
                                id={`edit-team2-${match.id}`}
                                type="number"
                                min="0"
                                className="mt-1"
                                onChange={(e) => handleResultChange(match.id, 'team2Score', e.target.value)}
                                value={match.result.team2Score}
                              />
                            </div>
                          ) : (
                            <div className="text-lg font-bold text-orange-600">
                              Score: {match.result.team2Score}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Save scores button when editing completed match scores */}
                    {editingScores === match.id && (
                      <div className="text-center">
                        <Button 
                          onClick={async () => {
                            // Save to database if scheduleId is available
                            if (tournamentData.scheduleId) {
                              try {
                                await updateSchedule(tournamentData.scheduleId, schedule);
                                toast({
                                  title: "Scores Updated",
                                  description: "Match scores have been saved to database.",
                                });
                              } catch (error) {
                                toast({
                                  title: "Save Error",
                                  description: "Failed to save scores to database, but local changes preserved.",
                                  variant: "destructive",
                                });
                              }
                            } else {
                              toast({
                                title: "Scores Updated",
                                description: "Match scores have been updated locally.",
                              });
                            }
                            setEditingScores(null);
                          }}
                          size="sm"
                          className="mt-2"
                        >
                          Save Scores
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </AnimatedSection>

        {/* Sitting Out */}
        {sittingOut.length > 0 && (
          <AnimatedSection animation="fade-in" delay={200}>
            <Card className="mb-8">
              <CardContent className="p-4">
                <div className="text-center">
                  <span className="font-semibold text-gray-700">Sitting Out This Round: </span>
                  <span className="text-gray-600">
                    {sittingOut.map(p => p.name).join(', ')}
                  </span>
                </div>
              </CardContent>
            </Card>
          </AnimatedSection>
        )}

        {/* Results Actions */}
        {showResults && (
          <AnimatedSection animation="scale-in" delay={250}>
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <h3 className="text-xl font-semibold">Enter Match Results</h3>
                  <div className="flex justify-center gap-4">
                    <Button 
                      onClick={handleSaveResults} 
                      disabled={!allResultsEntered}
                      size="lg"
                      className="flex items-center gap-2"
                    >
                      {currentRound < totalRounds ? (
                        <>
                          Save & Next Round
                          <ChevronRight className="h-5 w-5" />
                        </>
                      ) : (
                        <>
                          Complete Tournament
                          <Trophy className="h-5 w-5" />
                        </>
                      )}
                    </Button>
                  </div>
                  {!allResultsEntered && (
                    <p className="text-sm text-gray-600">
                      Please enter scores for all matches before proceeding.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </AnimatedSection>
        )}

        {/* Live League Table */}
        <AnimatedSection animation="fade-up" delay={300} className="mb-8">
          <Card>
            <CardContent className="space-y-6 p-6">
              <LeagueTable 
                schedule={schedule} 
                title="Current Tournament Standings" 
              />
              
              {/* Awards Section */}
              {(() => {
                const statsMap = new Map();
                
                // Initialize stats for all players
                schedule.playerStats.forEach(player => {
                  statsMap.set(player.playerId, {
                    playerId: player.playerId,
                    playerName: player.playerName,
                    pointsFor: 0,
                    pointsAgainst: 0,
                    pointsDifference: 0
                  });
                });

                // Calculate stats from completed matches
                schedule.matches.forEach(match => {
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

                const completedMatches = schedule.matches.filter(m => m.result?.completed).length;
                
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

                return (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      Awards
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl mb-2">🏆</div>
                          <h4 className="font-semibold text-yellow-700">Top Point Scorer</h4>
                          <p className="text-lg font-bold">{topScorer.playerName}</p>
                          <p className="text-sm text-muted-foreground">{topScorer.pointsFor} points</p>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl mb-2">🛡️</div>
                          <h4 className="font-semibold text-blue-700">Best Defensive Performance</h4>
                          <p className="text-lg font-bold">{bestDefensive.playerName}</p>
                          <p className="text-sm text-muted-foreground">{bestDefensive.pointsAgainst} points conceded</p>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl mb-2">📈</div>
                          <h4 className="font-semibold text-green-700">Consistent Player</h4>
                          <p className="text-lg font-bold">{mostConsistent.playerName}</p>
                          <p className="text-sm text-muted-foreground">+{mostConsistent.pointsDifference} difference</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </AnimatedSection>
      </div>
    </div>
  );
};

export default Tournament;