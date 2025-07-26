import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Calendar, Users, TrendingUp, UserX, ChevronDown } from 'lucide-react';
import { Schedule } from '@/types/schedule';
import { exportScheduleToCSV } from '@/utils/scheduleGenerator';
import ScheduleDisplayOptions from './ScheduleDisplayOptions';
import PlayerAnalytics from './PlayerAnalytics';

interface ScheduleDisplayProps {
  schedule: Schedule;
}

const ScheduleDisplay: React.FC<ScheduleDisplayProps> = ({ schedule }) => {
  const [viewMode, setViewMode] = useState<'standard' | 'printable'>('standard');
  const { matches, playerStats, roundSittingOut } = schedule;

  // Group matches by round
  const matchesByRound = matches.reduce((acc, match) => {
    const round = match.round;
    if (!acc[round]) {
      acc[round] = [];
    }
    acc[round].push(match);
    return acc;
  }, {} as Record<number, typeof matches>);

  const handleDownloadCSV = () => {
    const csvContent = exportScheduleToCSV(schedule);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'pickleball-schedule.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          <div className="text-center mb-8 print:mb-4">
            <h1 className="text-4xl font-bold text-gray-900 print:text-black">
              Pickleball Schedule
            </h1>
          </div>

          <div className="space-y-8 print:space-y-6">
            {Object.entries(matchesByRound).map(([round, roundMatches]) => (
              <div key={round} className="break-inside-avoid">
                <div className="flex items-center justify-between mb-4 print:mb-3">
                  <h2 className="text-3xl font-bold text-gray-900 print:text-black border-b-2 border-gray-300 pb-2">
                    Round {round}
                  </h2>
                  {roundSittingOut[parseInt(round)] && roundSittingOut[parseInt(round)].length > 0 && (
                    <div className="text-lg print:text-base">
                      <span className="font-semibold text-gray-700 print:text-black">Sitting Out: </span>
                      <span className="text-gray-600 print:text-black">
                        {roundSittingOut[parseInt(round)].map(p => p.name).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="grid gap-4 print:gap-3 md:grid-cols-2 lg:grid-cols-3 print:grid-cols-2">
                  {roundMatches.map((match) => (
                    <div 
                      key={match.id} 
                      className="border-2 border-gray-300 rounded-lg p-4 print:p-3 bg-white print:break-inside-avoid"
                    >
                      <div className="text-center mb-3 print:mb-2">
                        <div className="text-2xl font-bold text-gray-900 print:text-black mb-1">
                          Court {match.court}
                        </div>
                      </div>
                      
                      <div className="space-y-3 print:space-y-2">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-blue-700 print:text-black mb-2 print:mb-1">
                            Team 1
                          </div>
                          <div className="space-y-1">
                            <div className="text-xl font-medium print:text-lg">{match.players[0]?.name}</div>
                            <div className="text-xl font-medium print:text-lg">{match.players[1]?.name}</div>
                          </div>
                        </div>
                        
                        <div className="text-center text-2xl font-bold text-gray-600 print:text-black">
                          VS
                        </div>
                        
                        <div className="text-center">
                          <div className="text-lg font-semibold text-orange-700 print:text-black mb-2 print:mb-1">
                            Team 2
                          </div>
                          <div className="space-y-1">
                            <div className="text-xl font-medium print:text-lg">{match.players[2]?.name}</div>
                            <div className="text-xl font-medium print:text-lg">{match.players[3]?.name}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ScheduleDisplayOptions
        onViewChange={setViewMode}
        onDownloadCSV={handleDownloadCSV}
        currentView={viewMode}
      />

      {/* Schedule Overview */}
      <Collapsible defaultOpen>
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between text-2xl font-bold text-blue-700">
                <div className="flex items-center gap-2">
                  <Calendar className="h-6 w-6" />
                  Match Schedule
                </div>
                <ChevronDown className="h-5 w-5 transition-transform duration-200 data-[state=open]:rotate-180" />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
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
                              <div className="text-sm text-gray-500">
                                Match #{match.id}
                              </div>
                            </div>
                            
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
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Player Statistics */}
      <Collapsible>
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between text-xl font-bold text-green-700">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Player Statistics
                </div>
                <ChevronDown className="h-5 w-5 transition-transform duration-200 data-[state=open]:rotate-180" />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
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
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Player Analytics */}
      <Collapsible>
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between text-xl font-bold text-purple-700">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Partnership & Opponent Analytics
                </div>
                <ChevronDown className="h-5 w-5 transition-transform duration-200 data-[state=open]:rotate-180" />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <PlayerAnalytics schedule={schedule} />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
};

export default ScheduleDisplay;