import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Users, TrendingUp, UserX, Edit, BarChart3, Printer } from 'lucide-react';
import { Schedule, Player, SavedSchedule } from '@/types/schedule';
import PlayerAnalytics from './PlayerAnalytics';
import PlayerSwapper from './PlayerSwapper';
import BeginTournamentButton from '@/components/BeginTournamentButton';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface ScheduleDisplayProps {
  schedule: Schedule;
  scheduleName?: string;
  scheduleId?: string;
  savedSchedule?: SavedSchedule; // Add this prop for the Begin Tournament functionality
  onRegenerateSchedule?: () => void;
  onPlayerSwap?: (updatedSchedule: Schedule) => void;
}

type ViewType = 'matches' | 'statistics' | 'analytics';

const ScheduleDisplay: React.FC<ScheduleDisplayProps> = ({ 
  schedule, 
  scheduleName, 
  scheduleId, 
  savedSchedule,
  onRegenerateSchedule, 
  onPlayerSwap 
}) => {
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
    const updatedMatches = matches.reduce((acc, match) => {
      if (match.id === matchId) {
        const newPlayers = [...match.players];
        [newPlayers[fromIndex], newPlayers[toIndex]] = [newPlayers[toIndex], newPlayers[fromIndex]];
        return [...acc, { ...match, players: newPlayers }];
      }
      return [...acc, match];
    }, [] as typeof matches);

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

  const handlePrintSchedule = () => {
    const printContent = generatePrintableSchedule();
    const printWindow = window.open('', '_blank');
    
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${scheduleName || 'Tournament Schedule'}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 15px;
              color: #000;
              background: #fff;
              font-size: 12px;
              line-height: 1.3;
            }
            .header {
              text-align: center;
              margin-bottom: 8px;
              border-bottom: 2px solid #000;
              padding-bottom: 6px;
            }
            .title {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 3px;
            }
            .subtitle {
              font-size: 10px;
              color: #666;
              margin-bottom: 2px;
            }
            .date-info {
              font-size: 9px;
              color: #888;
            }
            .rounds-container {
              display: flex;
              flex-direction: column;
              gap: 12px;
              margin-top: 0px;
            }
            .round-section {
              margin-bottom: 12px;
            }
            .round-header {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 8px;
              padding: 4px 8px;
              background-color: #f0f0f0;
              border: 1px solid #ccc;
              text-align: center;
            }
            .matches-row {
              display: flex;
              flex-wrap: wrap;
              gap: 10px;
              justify-content: space-between;
            }
            .match-card {
              border: 1px solid #333;
              padding: 8px;
              flex: 1;
              min-width: 180px;
              max-width: 220px;
              background-color: #fff;
            }
            .match-header {
              font-weight: bold;
              text-align: center;
              margin-bottom: 6px;
              font-size: 11px;
              background-color: #f5f5f5;
              padding: 2px;
              border: 1px solid #ddd;
            }
            .teams-container {
              display: flex;
              justify-content: space-between;
              margin-bottom: 6px;
            }
            .team {
              flex: 1;
              margin: 0 2px;
            }
            .team-label {
              font-weight: bold;
              font-size: 10px;
              text-align: center;
              margin-bottom: 3px;
              background-color: #e9ecef;
              padding: 1px;
            }
            .players {
              font-size: 10px;
              text-align: center;
            }
            .player {
              margin: 1px 0;
              line-height: 1.2;
            }
            .vs {
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: 12px;
              width: 20px;
            }
            .score-section {
              margin-top: 6px;
              padding-top: 6px;
              border-top: 1px dashed #666;
              display: flex;
              justify-content: space-between;
            }
            .score-input {
              display: flex;
              flex-direction: column;
              align-items: center;
              font-size: 9px;
            }
            .score-label {
              margin-bottom: 2px;
              font-weight: bold;
            }
            .score-box {
              width: 25px;
              height: 20px;
              border: 1px solid #333;
              display: inline-block;
            }
            .sitting-out {
              background-color: #fff3cd;
              border: 1px solid #ffc107;
              padding: 6px;
              margin-top: 8px;
              font-size: 10px;
              text-align: center;
            }
            .sitting-out-label {
              font-weight: bold;
              margin-bottom: 3px;
            }
            .page-break {
              page-break-before: always;
            }
            @media print {
              body { 
                margin: 10px;
                font-size: 11px;
              }
              .match-card { 
                page-break-inside: avoid;
                max-width: none;
              }
              .round-section { 
                page-break-inside: avoid;
              }
              .matches-row {
                gap: 8px;
              }
            }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }

    toast({
      title: "Print Schedule",
      description: "Opening printable schedule in new window...",
    });
  };

  const generatePrintableSchedule = () => {
    const roundEntries = Object.entries(matchesByRound);
    const tournamentName = savedSchedule?.name || scheduleName || 'Tournament Schedule';
    const createdDate = savedSchedule?.createdAt ? new Date(savedSchedule.createdAt).toLocaleDateString() : new Date().toLocaleDateString();
    
    let html = `
      <div class="header">
        <div class="title">${tournamentName}</div>
        <div class="subtitle">Manual Score Sheet</div>
        <div class="date-info">Created: ${createdDate}</div>
      </div>
      <div class="rounds-container">
    `;

    roundEntries.forEach(([round, roundMatches]) => {
      // Sort matches by court number within each round
      const sortedMatches = [...roundMatches].sort((a, b) => a.court - b.court);
      
      html += `
        <div class="round-section">
          <div class="round-header">Round ${round}</div>
      `;

      // Add sitting out players for this round
      if (roundSittingOut[parseInt(round)] && roundSittingOut[parseInt(round)].length > 0) {
        html += `
          <div class="sitting-out">
            <div class="sitting-out-label">Sitting Out:</div>
            ${roundSittingOut[parseInt(round)].map(p => p.name).join(', ')}
          </div>
        `;
      }

      html += `<div class="matches-row">`;

      sortedMatches.forEach((match) => {
        html += `
          <div class="match-card">
            <div class="match-header">Court ${match.court} - #${match.id}</div>
            
            <div class="teams-container">
              <div class="team">
                <div class="team-label">Team 1</div>
                <div class="players">
                  <div class="player">${match.players[0]?.name || 'P1'}</div>
                  <div class="player">${match.players[1]?.name || 'P2'}</div>
                </div>
              </div>

              <div class="vs">VS</div>

              <div class="team">
                <div class="team-label">Team 2</div>
                <div class="players">
                  <div class="player">${match.players[2]?.name || 'P3'}</div>
                  <div class="player">${match.players[3]?.name || 'P4'}</div>
                </div>
              </div>
            </div>

            <div class="score-section">
              <div class="score-input">
                <div class="score-label">T1</div>
                <div class="score-box"></div>
              </div>
              <div class="score-input">
                <div class="score-label">T2</div>
                <div class="score-box"></div>
              </div>
            </div>
          </div>
        `;
      });

      html += `</div></div>`;
    });

    html += `</div>`;
    return html;
  };

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
                                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                                : 'bg-orange-50 text-orange-700 border border-orange-200'
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
      {/* Navigation Buttons with Begin Tournament */}
      <div className="flex justify-between items-center flex-wrap gap-2">
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
        
        {/* Begin Tournament Button - only show if savedSchedule is provided */}
        {savedSchedule && (
          <BeginTournamentButton 
            schedule={savedSchedule}
            variant="default"
            className="bg-green-600 hover:bg-green-700"
          />
        )}
      </div>

      {/* Main Content Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-gray-800">
              {activeView === 'matches' && 'Match Schedule'}
              {activeView === 'statistics' && 'Player Statistics'}
              {activeView === 'analytics' && 'Partnership & Opponent Analytics'}
            </CardTitle>
            
            {/* Print button - only show in matches view */}
            {activeView === 'matches' && (
              <Button
                variant="outline"
                onClick={handlePrintSchedule}
                className="flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Print Schedule
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {renderActiveView()}
        </CardContent>
      </Card>
    </div>
  );
};

export default ScheduleDisplay;