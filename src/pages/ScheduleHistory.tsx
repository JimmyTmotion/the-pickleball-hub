import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Users, TrendingUp, UserX, Play, Edit, RotateCcw, BarChart3 } from 'lucide-react';
import { Schedule, Player } from '@/types/schedule';
import { exportScheduleToCSV } from '@/utils/scheduleGenerator';
import ScheduleDisplayOptions from './ScheduleDisplayOptions';
import PlayerAnalytics from './PlayerAnalytics';
import PlayerSwapper from './PlayerSwapper';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface ScheduleDisplayProps {
  schedule: Schedule;
  scheduleName?: string;
  scheduleId?: string;
  onRegenerateSchedule?: () => void;
  onPlayerSwap?: (updatedSchedule: Schedule) => void;
}

type ViewType = 'matches' | 'statistics' | 'analytics';

const ScheduleDisplay: React.FC<ScheduleDisplayProps> = ({ schedule, scheduleName, scheduleId, onRegenerateSchedule, onPlayerSwap }) => {
  const [editingMatch, setEditingMatch] = useState<number | null>(null);
  const [currentSchedule, setCurrentSchedule] = useState(schedule);
  const [activeView, setActiveView] = useState<ViewType>('matches');
  const { matches, playerStats, roundSittingOut } = currentSchedule;

  // Group matches by round
  const matchesByRound = matches.reduce((acc, match) => {
    const round = match.round;
    if (!acc[round]) {
      acc[round] = [];
    }
    acc[round].push(match);
    return acc;
  }, {} as Record<number, typeof matches>);



  const handlePlayerSwap = (matchId: number, fromIndex: number, toIndex: number) => {
    const updatedMatches = matches.map(match => {
      if (match.id === matchId) {
        const newPlayers = [...match.players];
        [newPlayers[fromIndex], newPlayers[toIndex]] = [newPlayers[toIndex], newPlayers[fromIndex]];
        return { ...match, players: newPlayers };
      }
      return match;
    });

    const updatedSchedule = {
      ...currentSchedule,
      matches: updatedMatches
    };

    setCurrentSchedule(updatedSchedule);
    
    // Notify parent component about the change
    if (onPlayerSwap) {
      onPlayerSwap(updatedSchedule);
    }
    
    toast({
      title: "Players Swapped",
      description: "Match lineup has been updated successfully.",
    });
  };

  if (viewMode === 'printable') {
    return (
      <div className="space-y-6">
        <ScheduleDisplayOptions
          onViewChange={setViewMode}
          onDownloadCSV={handleDownloadCSV}
          currentView={viewMode}
        />
        
        <div className="print:block">
          <div className="text-center mb-6 print:mb-4">
            <h1 className="text-2xl font-bold text-gray-900 print:text-black">
              Pickleball Schedule
            </h1>
            {scheduleName && (
              <p className="text-lg text-gray-700 print:text-black mt-1">{scheduleName}</p>
            )}
          </div>

          <div className="space-y-6 print:space-y-4">
            {Object.entries(matchesByRound).map(([round, roundMatches]) => (
              <div key={round} className="break-inside-avoid">
                <div className="mb-3 print:mb-2">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-bold text-gray-900 print:text-black">
                      Round {round}
                    </h2>
                    {roundSittingOut[parseInt(round)] && roundSittingOut[parseInt(round)].length > 0 && (
                      <div className="text-sm print:text-xs">
                        <span className="font-semibold text-gray-700 print:text-black">Sitting Out: </span>
                        <span className="text-gray-600 print:text-black">
                          {roundSittingOut[parseInt(round)].map(p => p.name).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="overflow-hidden border border-gray-300 rounded print:border-black">
                  <table className="w-full text-sm print:text-xs">
                    <thead>
                      <tr className="border-b border-gray-300 print:border-black bg-gray-50 print:bg-white">
                        <th className="p-2 text-left font-semibold">Court</th>
                        <th className="p-2 text-left font-semibold">Team 1</th>
                        <th className="p-2 text-center font-semibold">Score</th>
                        <th className="p-2 text-left font-semibold">Team 2</th>
                        <th className="p-2 text-center font-semibold">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roundMatches.map((match, index) => (
                        <tr 
                          key={match.id}
                          className={`border-b border-gray-200 print:border-gray-400 ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-25 print:bg-white'
                          }`}
                        >
                          <td className="p-2 font-medium text-center">
                            {match.court}
                          </td>
                          <td className="p-2">
                            <div className="space-y-1">
                              <div className="font-medium">{match.players[0]?.name}</div>
                              <div className="font-medium">{match.players[1]?.name}</div>
                            </div>
                          </td>
                          <td className="p-2 text-center">
                            <div className="inline-block border-2 border-gray-400 print:border-black w-12 h-8 print:w-10 print:h-6">
                              {/* Score box for Team 1 */}
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="space-y-1">
                              <div className="font-medium">{match.players[2]?.name}</div>
                              <div className="font-medium">{match.players[3]?.name}</div>
                            </div>
                          </td>
                          <td className="p-2 text-center">
                            <div className="inline-block border-2 border-gray-400 print:border-black w-12 h-8 print:w-10 print:h-6">
                              {/* Score box for Team 2 */}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const renderMatchesView = () => (
    <div className="space-y-6">
      {Object.entries(matchesByRound).map(([round, roundMatches]) => (
        <div key={round} className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-800">
              Round {round}
            </h3>
            {roundSittingOut[parseInt(round)] && roundSittingOut[parseInt(round)].length > 0 && (
              <div className="flex items-center gap-2">
                <UserX className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  Sitting out: {roundSittingOut[parseInt(round)].map(p => p.name).join(', ')}
                </span>
              </div>
            )}
          </div>
          
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {roundMatches.map((match) => (
              <Card key={match.id} className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Court {match.court}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingMatch(editingMatch === match.id ? null : match.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <div className="text-sm text-gray-500">
                        Match #{match.id}
                      </div>
                    </div>
                  </div>
                  
                  {editingMatch === match.id ? (
                    <PlayerSwapper
                      players={match.players}
                      onSwap={(fromIndex, toIndex) => handlePlayerSwap(match.id, fromIndex, toIndex)}
                      className="mt-2"
                    />
                  ) : (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        {match.players.map((player, index) => (
                          <div 
                            key={player.id}
                            className={`text-sm p-2 rounded ${
                              index < 2 
                                ? 'bg-blue-50 text-blue-700' 
                                : 'bg-orange-50 text-orange-700'
                            }`}
                          >
                            {player.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          
          {Object.keys(matchesByRound).length > 1 && (
            <Separator className="my-4" />
          )}
        </div>
      ))}
    </div>
  );

  const renderStatisticsView = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {playerStats.map((stat) => (
        <Card key={stat.playerId} className="border border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="font-medium">{stat.playerName}</span>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Matches:</span>
                <Badge variant="secondary">{stat.matchCount}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderAnalyticsView = () => (
    <PlayerAnalytics schedule={currentSchedule} />
  );

  const renderActiveView = () => {
    switch (activeView) {
      case 'matches':
        return renderMatchesView();
      case 'statistics':
        return renderStatisticsView();
      case 'analytics':
        return renderAnalyticsView();
      default:
        return renderMatchesView();
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={activeView === 'matches' ? 'default' : 'outline'}
          onClick={() => setActiveView('matches')}
          className="flex items-center gap-2"
        >
          <Calendar className="h-4 w-4" />
          Match Schedule
        </Button>
        <Button
          variant={activeView === 'statistics' ? 'default' : 'outline'}
          onClick={() => setActiveView('statistics')}
          className="flex items-center gap-2"
        >
          <TrendingUp className="h-4 w-4" />
          Player Statistics
        </Button>
        <Button
          variant={activeView === 'analytics' ? 'default' : 'outline'}
          onClick={() => setActiveView('analytics')}
          className="flex items-center gap-2"
        >
          <BarChart3 className="h-4 w-4" />
          Partnership & Opponent Analytics
        </Button>
      </div>

      {/* Main Content Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-800">
            {activeView === 'matches' && 'Match Schedule'}
            {activeView === 'statistics' && 'Player Statistics'}
            {activeView === 'analytics' && 'Partnership & Opponent Analytics'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderActiveView()}
        </CardContent>
      </Card>
    </div>
  );
};

export default ScheduleDisplay;