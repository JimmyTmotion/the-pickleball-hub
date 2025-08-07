import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Trash2, Download, Calendar, Users, MapPin, Hash, ArrowLeft, Trophy, Edit, Check, X, Building2, UserPlus, Play } from 'lucide-react';
import { getSavedSchedules, deleteSchedule, updateMatchResult, updatePlayerNames, updateScheduleName } from '@/utils/scheduleStorage';
import { SavedSchedule, MatchResult } from '@/types/schedule';
import { exportScheduleToCSV } from '@/utils/scheduleGenerator';
import { checkMigrationStatus, runResultsMigration } from '@/utils/migrateResults';
import { Link, useNavigate } from 'react-router-dom';
import Navigation from '@/components/ui/navigation';
import ScheduleDisplay from '@/components/ScheduleDisplay';
import MatchResultInput from '@/components/MatchResultInput';
import LeagueTable from '@/components/LeagueTable';
import PlayerNameEditor from '@/components/PlayerNameEditor';
import AnimatedSection from '@/components/AnimatedSection';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

const ScheduleHistory: React.FC = () => {
  const [savedSchedules, setSavedSchedules] = React.useState<SavedSchedule[]>([]);
  const [selectedSchedule, setSelectedSchedule] = React.useState<SavedSchedule | null>(null);
  const [editingScheduleId, setEditingScheduleId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState<string>('');
  const [clubs, setClubs] = React.useState<any[]>([]);
  const [subgroups, setSubgroups] = React.useState<any[]>([]);
  const [assigningScheduleId, setAssigningScheduleId] = React.useState<string | null>(null);
  const [selectedClubId, setSelectedClubId] = React.useState<string>('');
  const [selectedSubgroupId, setSelectedSubgroupId] = React.useState<string>('');
  const [allClubs, setAllClubs] = React.useState<any[]>([]);
  const [allSubgroups, setAllSubgroups] = React.useState<any[]>([]);
  const [activeTab, setActiveTab] = React.useState('schedule');
  const { user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    const loadSchedules = async () => {
      const schedules = await getSavedSchedules();
      setSavedSchedules(schedules);
    };
    
    const checkAndRunMigration = async () => {
      try {
        const needsMigration = await checkMigrationStatus();
        if (needsMigration) {
          console.log('Running results migration...');
          await runResultsMigration();
          toast({
            title: "Migration Complete",
            description: "Successfully migrated existing match results to new format",
          });
          loadSchedules();
        }
      } catch (error) {
        console.error('Migration failed:', error);
        toast({
          title: "Migration Failed",
          description: "Failed to migrate existing results",
          variant: "destructive",
        });
      }
    };
    
    loadSchedules();
    checkAndRunMigration();
  }, []);

  React.useEffect(() => {
    const loadClubs = async () => {
      if (!user) return;
      
      const { data: clubsData } = await supabase
        .from('clubs')
        .select('*')
        .eq('owner_id', user.id);
      
      setClubs(clubsData || []);
      
      const { data: allClubsData } = await supabase
        .from('clubs')
        .select('*');
      
      const { data: allSubgroupsData } = await supabase
        .from('club_subgroups')
        .select('*');
      
      setAllClubs(allClubsData || []);
      setAllSubgroups(allSubgroupsData || []);
    };
    loadClubs();
  }, [user]);

  React.useEffect(() => {
    const fetchSubgroups = async () => {
      if (!selectedClubId || selectedClubId === "none") {
        setSubgroups([]);
        setSelectedSubgroupId('');
        return;
      }

      const { data: subgroupsData } = await supabase
        .from('club_subgroups')
        .select('*')
        .eq('club_id', selectedClubId);

      setSubgroups(subgroupsData || []);
    };

    fetchSubgroups();
  }, [selectedClubId]);

  React.useEffect(() => {
    if (selectedSchedule) {
      setActiveTab("schedule");
    }
  }, [selectedSchedule]);

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
      const updatedSchedules = await getSavedSchedules();
      setSavedSchedules(updatedSchedules);
      const updatedSelected = updatedSchedules.find(s => s.id === selectedSchedule.id);
      if (updatedSelected) {
        setSelectedSchedule(updatedSelected);
      }
    }
  };

  const handlePlayerSwap = async (updatedSchedule: any) => {
    if (selectedSchedule) {
      const updatedSelected = {
        ...selectedSchedule,
        schedule: updatedSchedule
      };
      setSelectedSchedule(updatedSelected);
      
      const updatedSchedules = savedSchedules.map(s => 
        s.id === selectedSchedule.id ? updatedSelected : s
      );
      setSavedSchedules(updatedSchedules);
    }
  };

  const handleEditScheduleName = (schedule: SavedSchedule) => {
    setEditingScheduleId(schedule.id);
    setEditingName(schedule.name);
  };

  const handleSaveScheduleName = async (scheduleId: string) => {
    try {
      await updateScheduleName(scheduleId, editingName);
      const updatedSchedules = await getSavedSchedules();
      setSavedSchedules(updatedSchedules);
      setEditingScheduleId(null);
      setEditingName('');
    } catch (error) {
      console.error('Failed to update schedule name:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingScheduleId(null);
    setEditingName('');
  };

  const handleAssignSchedule = async () => {
    if (!assigningScheduleId) return;

    try {
      const { error } = await supabase
        .from('schedules')
        .update({
          club_id: selectedClubId && selectedClubId !== "none" ? selectedClubId : null,
          subgroup_id: selectedSubgroupId && selectedSubgroupId !== "none" ? selectedSubgroupId : null
        })
        .eq('id', assigningScheduleId);

      if (error) throw error;

      const updatedSchedules = await getSavedSchedules();
      setSavedSchedules(updatedSchedules);
      
      setAssigningScheduleId(null);
      setSelectedClubId('');
      setSelectedSubgroupId('');
      
      toast({
        title: "Schedule assigned successfully",
        description: "The schedule has been assigned to the selected club and subgroup.",
      });
    } catch (error) {
      console.error('Error assigning schedule:', error);
      toast({
        title: "Error assigning schedule",
        description: "Failed to assign the schedule. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUnassignSchedule = async (scheduleId: string) => {
    try {
      const { error } = await supabase
        .from('schedules')
        .update({
          club_id: null,
          subgroup_id: null
        })
        .eq('id', scheduleId);

      if (error) throw error;

      const updatedSchedules = await getSavedSchedules();
      setSavedSchedules(updatedSchedules);
      
      toast({
        title: "Schedule unassigned successfully",
        description: "The schedule has been unassigned from the club and subgroup.",
      });
    } catch (error) {
      console.error('Error unassigning schedule:', error);
      toast({
        title: "Error unassigning schedule",
        description: "Failed to unassign the schedule. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getClubName = (clubId: string | null) => {
    if (!clubId) return null;
    const club = allClubs.find(c => c.id === clubId);
    return club?.name || 'Unknown Club';
  };

  const getSubgroupName = (subgroupId: string | null) => {
    if (!subgroupId) return null;
    const subgroup = allSubgroups.find(s => s.id === subgroupId);
    return subgroup?.name || 'Unknown Subgroup';
  };

  const handleDownloadScheduleCSV = (schedule: SavedSchedule) => {
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

  const areAllMatchesCompleted = (schedule: SavedSchedule) => {
    return schedule.schedule.matches.every(match => match.result?.completed);
  };

  const downloadMatchResultsCSV = (schedule: SavedSchedule) => {
    const csvHeader = "Match ID,Round,Court,Team 1 Player 1,Team 1 Player 2,Team 2 Player 1,Team 2 Player 2,Team 1 Score,Team 2 Score\n";
    
    const csvRows = schedule.schedule.matches
      .filter(match => match.result?.completed)
      .map(match => {
        const team1Player1 = match.players[0]?.name || '';
        const team1Player2 = match.players[1]?.name || '';
        const team2Player1 = match.players[2]?.name || '';
        const team2Player2 = match.players[3]?.name || '';
        const team1Score = match.result?.team1Score || 0;
        const team2Score = match.result?.team2Score || 0;
        
        return `${match.id},${match.round},${match.court},"${team1Player1}","${team1Player2}","${team2Player1}","${team2Player2}",${team1Score},${team2Score}`;
      });
    
    const csv = csvHeader + csvRows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `${schedule.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_results.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleBeginTournament = () => {
    if (selectedSchedule) {
      navigate('/tournament', {
        state: {
          schedule: selectedSchedule.schedule,
          name: selectedSchedule.name,
          scheduleId: selectedSchedule.id
        }
      });
    }
  };

  const renderTabContent = () => {
    if (!selectedSchedule) return null;

    switch (activeTab) {
      case 'schedule':
        return (
          <ScheduleDisplay 
            schedule={selectedSchedule.schedule} 
            scheduleId={selectedSchedule.id}
            onPlayerSwap={handlePlayerSwap}
          />
        );

      case 'results':
        return (
          <div className="space-y-4">
            <div className="flex justify-end mb-4">
              <Button 
                onClick={handleBeginTournament}
                className="flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                Begin Tournament
              </Button>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {selectedSchedule.schedule.matches.map((match) => (
                <MatchResultInput
                  key={match.id}
                  match={match}
                  onResultUpdate={handleResultUpdate}
                  scheduleId={selectedSchedule.id}
                />
              ))}
            </div>
          </div>
        );

      case 'league':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div></div>
              {areAllMatchesCompleted(selectedSchedule) && (
                <Button
                  onClick={() => downloadMatchResultsCSV(selectedSchedule)}
                  className="flex items-center gap-2"
                  variant="outline"
                >
                  <Download className="h-4 w-4" />
                  Download Results CSV
                </Button>
              )}
            </div>
            <LeagueTable schedule={selectedSchedule.schedule} title={`${selectedSchedule.name} - League Table`} />
            
            {/* Awards Section */}
            {(() => {
              const statsMap = new Map();
              
              selectedSchedule.schedule.playerStats.forEach(player => {
                statsMap.set(player.playerId, {
                  playerId: player.playerId,
                  playerName: player.playerName,
                  pointsFor: 0,
                  pointsAgainst: 0,
                  pointsDifference: 0
                });
              });

              selectedSchedule.schedule.matches.forEach(match => {
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

              const completedMatches = selectedSchedule.schedule.matches.filter(m => m.result?.completed).length;
              
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
          </div>
        );

      case 'edit':
        return (
          <PlayerNameEditor 
            schedule={selectedSchedule.schedule} 
            onPlayerNamesUpdate={handlePlayerNamesUpdate}
          />
        );

      default:
        return null;
    }
  };

  if (selectedSchedule) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection animation="fade-up" className="flex items-center gap-4 mb-6">
            <Button 
              onClick={() => setSelectedSchedule(null)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to History
            </Button>
            <h1 className="text-3xl font-bold text-gray-800">{selectedSchedule.name}</h1>
          </AnimatedSection>
          
          <AnimatedSection animation="fade-up" delay={100} className="space-y-6">
            <Card>
              <CardHeader>
                <div className="border-b border-gray-200 -mb-6">
                  <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                      onClick={() => setActiveTab('schedule')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                        activeTab === 'schedule'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Calendar className="h-4 w-4" />
                      Schedule
                    </button>
                    <button
                      onClick={() => setActiveTab('results')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                        activeTab === 'results'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Users className="h-4 w-4" />
                      Enter Results
                    </button>
                    <button
                      onClick={() => setActiveTab('league')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                        activeTab === 'league'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Trophy className="h-4 w-4" />
                      League Table
                    </button>
                    <button
                      onClick={() => setActiveTab('edit')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                        activeTab === 'edit'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Edit className="h-4 w-4" />
                      Edit Players
                    </button>
                  </nav>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {renderTabContent()}
              </CardContent>
            </Card>
          </AnimatedSection>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <Navigation />
      <div className="p-4">
        <div className="max-w-7xl mx-auto space-y-8">
          <AnimatedSection animation="fade-up" className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link to="/scheduler">
                <Button variant="outline" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Generator
                </Button>
              </Link>
              <h1 className="text-3xl font-bold text-gray-800">Schedule History & Results</h1>
            </div>
          </AnimatedSection>

          <AnimatedSection animation="fade-up" delay={100}>
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
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-800">Individual Schedules</h2>
                <div className="grid gap-4">
                  {savedSchedules.map((schedule) => {
                    const completedMatches = schedule.schedule.matches.filter(m => m.result?.completed).length;
                    return (
                      <Card key={schedule.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              {editingScheduleId === schedule.id ? (
                                <div className="flex items-center gap-2">
                                  <Input
                                    value={editingName}
                                    onChange={(e) => setEditingName(e.target.value)}
                                    className="text-lg font-semibold"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleSaveScheduleName(schedule.id);
                                      } else if (e.key === 'Escape') {
                                        handleCancelEdit();
                                      }
                                    }}
                                    autoFocus
                                  />
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleSaveScheduleName(schedule.id)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Check className="h-4 w-4 text-green-600" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleCancelEdit}
                                    className="h-8 w-8 p-0"
                                  >
                                    <X className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <CardTitle className="text-lg">{schedule.name}</CardTitle>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEditScheduleName(schedule)}
                                    className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
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
                              {schedule.club_id && (
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  Assigned to Club
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
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedSchedule(schedule)}
                              >
                                Manage & View Results
                              </Button>
                              
                              {/* Show assignment info or assign button */}
                              {schedule.club_id ? (
                                <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                                  <div className="flex flex-col text-xs">
                                    <div className="flex items-center gap-1">
                                      <Building2 className="h-3 w-3 text-blue-600" />
                                      <span className="font-medium">{getClubName(schedule.club_id)}</span>
                                    </div>
                                    {schedule.subgroup_id && (
                                      <div className="flex items-center gap-1 text-purple-600">
                                        <UserPlus className="h-3 w-3" />
                                        <span>{getSubgroupName(schedule.subgroup_id)}</span>
                                      </div>
                                    )}
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleUnassignSchedule(schedule.id)}
                                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                    title="Unassign from club"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                clubs.length > 0 && (
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setAssigningScheduleId(schedule.id);
                                          setSelectedClubId('');
                                          setSelectedSubgroupId('');
                                        }}
                                        className="flex items-center gap-1"
                                      >
                                        <Building2 className="h-3 w-3" />
                                        Assign to Club
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Assign Schedule to Club</DialogTitle>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                          <Building2 className="h-4 w-4 text-blue-600" />
                                          <div className="flex-1">
                                            <label className="text-sm font-medium">Club</label>
                                            <Select value={selectedClubId} onValueChange={setSelectedClubId}>
                                              <SelectTrigger>
                                                <SelectValue placeholder="Select a club" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="none">No Club Assignment</SelectItem>
                                                {clubs.map((club) => (
                                                  <SelectItem key={club.id} value={club.id}>
                                                    {club.name}
                                                  </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                          </div>
                                        </div>

                                        {selectedClubId && selectedClubId !== "none" && (
                                          <div className="flex items-center gap-2">
                                            <UserPlus className="h-4 w-4 text-purple-600" />
                                            <div className="flex-1">
                                              <label className="text-sm font-medium">Subgroup (Optional)</label>
                                              <Select 
                                                value={selectedSubgroupId} 
                                                onValueChange={setSelectedSubgroupId}
                                                disabled={subgroups.length === 0}
                                              >
                                                <SelectTrigger>
                                                  <SelectValue placeholder={subgroups.length > 0 ? "Select a subgroup" : "No subgroups available"} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="none">No Subgroup Assignment</SelectItem>
                                                  {subgroups.map((subgroup) => (
                                                    <SelectItem key={subgroup.id} value={subgroup.id}>
                                                      {subgroup.name}
                                                    </SelectItem>
                                                  ))}
                                                </SelectContent>
                                              </Select>
                                            </div>
                                          </div>
                                        )}

                                        <div className="flex justify-end gap-2">
                                          <Button variant="outline" onClick={() => setAssigningScheduleId(null)}>
                                            Cancel
                                          </Button>
                                          <Button onClick={handleAssignSchedule}>
                                            Assign Schedule
                                          </Button>
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                )
                              )}
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadScheduleCSV(schedule)}
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
            )}
          </AnimatedSection>
        </div>
      </div>
    </div>
  );
};

export default ScheduleHistory;