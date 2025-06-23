
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Users, Clock, TrendingUp } from 'lucide-react';
import { Schedule } from '@/types/schedule';

interface ScheduleDisplayProps {
  schedule: Schedule;
}

const ScheduleDisplay: React.FC<ScheduleDisplayProps> = ({ schedule }) => {
  const { matches, playerStats } = schedule;

  // Group matches by time slot
  const matchesByTime = matches.reduce((acc, match) => {
    const timeSlot = match.startTime;
    if (!acc[timeSlot]) {
      acc[timeSlot] = [];
    }
    acc[timeSlot].push(match);
    return acc;
  }, {} as Record<string, typeof matches>);

  return (
    <div className="space-y-6">
      {/* Schedule Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl font-bold text-blue-700">
            <Calendar className="h-6 w-6" />
            Match Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(matchesByTime).map(([timeSlot, timeMatches]) => (
              <div key={timeSlot} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-800">
                    {timeSlot} - {timeMatches[0]?.endTime}
                  </h3>
                </div>
                
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {timeMatches.map((match) => (
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
                
                {Object.keys(matchesByTime).length > 1 && (
                  <Separator className="my-4" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Player Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-green-700">
            <TrendingUp className="h-5 w-5" />
            Player Statistics
          </CardTitle>
        </CardHeader>
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
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rest time:</span>
                      <span className="text-gray-800">{stat.restTime} min</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScheduleDisplay;
