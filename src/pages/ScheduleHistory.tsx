import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, Download, Calendar, Users, MapPin, Hash, ArrowLeft, Trophy, BarChart3, ChevronDown, Edit } from 'lucide-react';
import { getSavedSchedules, deleteSchedule, updateMatchResult, updatePlayerNames } from '@/utils/scheduleStorage';
import { SavedSchedule, MatchResult } from '@/types/schedule';
import { exportScheduleToCSV } from '@/utils/scheduleGenerator';
import { Link } from 'react-router-dom';
import Navigation from '@/components/ui/navigation';
import ScheduleDisplay from '@/components/ScheduleDisplay';
import MatchResultInput from '@/components/MatchResultInput';
import LeagueTable from '@/components/LeagueTable';
import OverallLeaderboard from '@/components/OverallLeaderboard';
import PlayerNameEditor from '@/components/PlayerNameEditor';

const ScheduleHistory: React.FC = () => {
  const [savedSchedules, setSavedSchedules] = React.useState<SavedSchedule[]>([]);
  const [selectedSchedule, setSelectedSchedule] = React.useState<SavedSchedule | null>(null);

  React.useEffect(() => {
    const loadSchedules = async () => {
      const schedules = await getSavedSchedules();
      setSavedSchedules(schedules);
    };
    loadSchedules();
  }, []);

  const handleDelete = async (id: string) => {
    await deleteSchedule(id);
    const schedules = await getSavedSchedules();
    setSavedSchedules(schedules);
    if (selectedSchedule?.id === id) {
      setSelectedSchedule(null);
    }
  };

  const handleResultUpdate = async (matchId: number, result: MatchResult) => {
    if (selectedSchedule) {
      await updateMatchResult(selectedSchedule.id, matchId, result);
      // Refresh the schedule data
      const updatedSchedules = await getSavedSchedules();
      setSavedSchedules(updatedSchedules);
      const updatedSelected = updatedSchedules.find(s => s.id === selectedSchedule.id);
      if (updatedSelected) {
        setSelectedSchedule(updatedSelected);
      }
    }
  };

  const handlePlayerNamesUpdate = async (playerNames: Record<number, string>) => {
    if (selectedSchedule) {
      await updatePlayerNames(selectedSchedule.id, playerNames);
      // Refresh the schedule data
      const updatedSchedules = await getSavedSchedules();
      setSavedSchedules(updatedSchedules);
      const updatedSelected = updatedSchedules.find(s => s.id === selectedSchedule.id);
      if (updatedSelected) {
        setSelectedSchedule(updatedSelected);
      }
    }
  };

  const handleDownload = (schedule: SavedSchedule) => {
    const csv = exportScheduleToCSV(schedule.schedule);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `${schedule.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (selectedSchedule) {
    // Determine default tab based on match results
    const hasCompletedMatches = selectedSchedule.schedule.matches.some(m => m.result?.completed);
    const defaultTab = hasCompletedMatches ? "league" : "results";
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              onClick={() => setSelectedSchedule(null)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to History
            </Button>
            <h1 className="text-3xl font-bold text-gray-800">{selectedSchedule.name}</h1>
          </div>
          
          <div className="space-y-6">
            {/* Schedule Section */}
            <Collapsible>
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="hover:bg-muted/50 transition-colors">
                    <CardTitle className="flex items-center justify-between text-xl font-bold text-blue-700">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Schedule
                      </div>
                      <ChevronDown className="h-5 w-5 transition-transform duration-200 data-[state=open]:rotate-180" />
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <ScheduleDisplay schedule={selectedSchedule.schedule} />
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Enter Results Section */}
            <Collapsible defaultOpen={!hasCompletedMatches}>
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="hover:bg-muted/50 transition-colors">
                    <CardTitle className="flex items-center justify-between text-xl font-bold text-green-700">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Enter Results
                      </div>
                      <ChevronDown className="h-5 w-5 transition-transform duration-200 data-[state=open]:rotate-180" />
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {selectedSchedule.schedule.matches.map((match) => (
                        <MatchResultInput
                          key={match.id}
                          match={match}
                          onResultUpdate={handleResultUpdate}
                        />
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* League Table Section */}
            <Collapsible defaultOpen={hasCompletedMatches}>
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="hover:bg-muted/50 transition-colors">
                    <CardTitle className="flex items-center justify-between text-xl font-bold text-yellow-700">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-5 w-5" />
                        League Table
                      </div>
                      <ChevronDown className="h-5 w-5 transition-transform duration-200 data-[state=open]:rotate-180" />
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <LeagueTable schedule={selectedSchedule.schedule} title={`${selectedSchedule.name} - League Table`} />
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Overall Stats Section */}
            <Collapsible>
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="hover:bg-muted/50 transition-colors">
                    <CardTitle className="flex items-center justify-between text-xl font-bold text-purple-700">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Overall Stats
                      </div>
                      <ChevronDown className="h-5 w-5 transition-transform duration-200 data-[state=open]:rotate-180" />
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <OverallLeaderboard savedSchedules={[selectedSchedule]} showTitle={false} />
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Edit Player Names Section */}
            <Collapsible>
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="hover:bg-muted/50 transition-colors">
                    <CardTitle className="flex items-center justify-between text-xl font-bold text-indigo-700">
                      <div className="flex items-center gap-2">
                        <Edit className="h-5 w-5" />
                        Edit Player Names
                      </div>
                      <ChevronDown className="h-5 w-5 transition-transform duration-200 data-[state=open]:rotate-180" />
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <PlayerNameEditor 
                      schedule={selectedSchedule.schedule} 
                      onPlayerNamesUpdate={handlePlayerNamesUpdate}
                    />
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <Navigation />
      <div className="p-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/scheduler">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Generator
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-800">Schedule History & Results</h1>
          </div>
        </div>

        {savedSchedules.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No Saved Schedules</h3>
              <p className="text-gray-500 mb-4">Generate your first schedule to see it here!</p>
              <Link to="/scheduler">
                <Button>Generate Schedule</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Overall Leaderboard */}
            <Collapsible defaultOpen={false}>
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="hover:bg-muted/50 transition-colors">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Overall Leaderboard
                      </div>
                      <ChevronDown className="h-5 w-5 transition-transform duration-200 data-[state=open]:rotate-180" />
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <OverallLeaderboard savedSchedules={savedSchedules} showTitle={false} />
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
            
            {/* Schedule List */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800">Individual Schedules</h2>
              <div className="grid gap-4">
                {savedSchedules.map((schedule) => {
                  const completedMatches = schedule.schedule.matches.filter(m => m.result?.completed).length;
                  return (
                    <Card key={schedule.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{schedule.name}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              Created by {schedule.createdBy?.name || 'Unknown User'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {schedule.createdAt.toLocaleDateString()}
                            </Badge>
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Hash className="h-3 w-3" />
                              {schedule.config.numRounds} rounds
                            </Badge>
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {schedule.config.numPlayers} players
                            </Badge>
                            <Badge variant="outline" className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {schedule.config.numCourts} courts
                            </Badge>
                            {completedMatches > 0 && (
                              <Badge className="flex items-center gap-1">
                                <Trophy className="h-3 w-3" />
                                {completedMatches}/{schedule.schedule.matches.length} complete
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600">
                            <p>Total matches: {schedule.schedule.matches.length}</p>
                            <p>Completed matches: {completedMatches}</p>
                            <p>Created: {schedule.createdAt.toLocaleString()}</p>
                            {schedule.config.prioritizeUniquePartnerships && (
                              <Badge variant="secondary" className="mt-1">Unique Partnerships Prioritized</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedSchedule(schedule)}
                            >
                              Manage & View Results
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownload(schedule)}
                              className="flex items-center gap-1"
                            >
                              <Download className="h-3 w-3" />
                              CSV
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="flex items-center gap-1"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the schedule "{schedule.name}" and all its match results.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(schedule.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete Schedule
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  );
};

export default ScheduleHistory;