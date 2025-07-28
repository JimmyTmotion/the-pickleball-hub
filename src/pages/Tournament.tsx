import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Schedule, Match, MatchResult } from '@/types/schedule';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Play, Pause, RotateCcw, ChevronRight, Trophy, Edit } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import LeagueTable from '@/components/LeagueTable';
import AnimatedSection from '@/components/AnimatedSection';
import PlayerSwapper from '@/components/PlayerSwapper';

interface TournamentState {
  schedule: Schedule;
  name: string;
}

const Tournament = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const tournamentData = location.state as TournamentState;

  const [currentRound, setCurrentRound] = useState(1);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [schedule, setSchedule] = useState<Schedule>(tournamentData?.schedule);
  const [showResults, setShowResults] = useState(false);
  const [roundResults, setRoundResults] = useState<Record<number, MatchResult>>({});
  const [tournamentComplete, setTournamentComplete] = useState(false);
  const [editingMatch, setEditingMatch] = useState<number | null>(null);

  useEffect(() => {
    if (!tournamentData) {
      navigate('/scheduler');
      return;
    }
  }, [tournamentData, navigate]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(seconds => seconds + 1);
      }, 1000);
    } else if (!isTimerRunning && timerSeconds !== 0) {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSeconds]);

  if (!tournamentData) {
    return null;
  }

  const totalRounds = Math.max(...schedule.matches.map(m => m.round));
  const currentRoundMatches = schedule.matches.filter(m => m.round === currentRound);
  const sittingOut = schedule.roundSittingOut[currentRound] || [];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartTimer = () => {
    setIsTimerRunning(true);
    toast({
      title: "Round Started!",
      description: `Round ${currentRound} timer has begun.`,
    });
  };

  const handleStopTimer = () => {
    setIsTimerRunning(false);
    setShowResults(true);
    toast({
      title: "Round Complete!",
      description: "Enter the results for all matches in this round.",
    });
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(0);
  };

  const handleResultChange = (matchId: number, field: 'team1Score' | 'team2Score', value: string) => {
    const score = parseInt(value) || 0;
    setRoundResults(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [field]: score,
        completed: false
      }
    }));
  };

  const handleSaveResults = () => {
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
    setTimerSeconds(0);

    if (currentRound < totalRounds) {
      toast({
        title: "Results Saved!",
        description: `Round ${currentRound} results have been recorded. Ready for round ${currentRound + 1}.`,
      });
    } else {
      setTournamentComplete(true);
      toast({
        title: "Tournament Complete!",
        description: "All rounds completed! Check the final standings.",
      });
    }
  };

  const handlePlayerSwap = (matchId: number, fromIndex: number, toIndex: number) => {
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
    toast({
      title: "Players Swapped",
      description: "Match lineup has been updated successfully.",
    });
  };

  const handleNextRound = () => {
    if (currentRound < totalRounds) {
      setCurrentRound(currentRound + 1);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-white">
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
          
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-lg px-4 py-2">
              {formatTime(timerSeconds)}
            </Badge>
          </div>
        </AnimatedSection>

        {/* Timer Controls */}
        {!showResults && (
          <AnimatedSection animation="scale-in" delay={100}>
            <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-center">Round {currentRound} Timer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div className="text-6xl font-bold text-primary">
                  {formatTime(timerSeconds)}
                </div>
                <div className="flex justify-center gap-4">
                  {!isTimerRunning ? (
                    <Button onClick={handleStartTimer} size="lg" className="flex items-center gap-2">
                      <Play className="h-5 w-5" />
                      Start Round
                    </Button>
                  ) : (
                    <Button onClick={handleStopTimer} size="lg" variant="destructive" className="flex items-center gap-2">
                      <Pause className="h-5 w-5" />
                      Complete Round
                    </Button>
                  )}
                  <Button onClick={handleResetTimer} size="lg" variant="outline" className="flex items-center gap-2">
                    <RotateCcw className="h-5 w-5" />
                    Reset
                  </Button>
                </div>
              </div>
            </CardContent>
            </Card>
          </AnimatedSection>
        )}

        {/* Match Display */}
        <AnimatedSection animation="fade-up" delay={150} className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {currentRoundMatches.map((match) => (
            <Card key={match.id} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <Badge variant="outline" className="mb-2">Court {match.court}</Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingMatch(editingMatch === match.id ? null : match.id)}
                    className="h-8 w-8 p-0"
                    disabled={showResults}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {editingMatch === match.id && !showResults ? (
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
                    </div>
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
            <Card>
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
      </div>
    </div>
  );
};

export default Tournament;