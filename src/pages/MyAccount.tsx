import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  Calendar, 
  Trophy, 
  BarChart3, 
  ArrowLeft, 
  Download,
  Trash2,
  Edit,
  Save,
  X,
  Hash,
  Users,
  MapPin
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getSavedSchedules, deleteSchedule, updateMatchResult } from '@/utils/scheduleStorage';
import { SavedSchedule, MatchResult } from '@/types/schedule';
import { exportScheduleToCSV } from '@/utils/scheduleGenerator';
import ScheduleDisplay from '@/components/ScheduleDisplay';
import MatchResultInput from '@/components/MatchResultInput';
import LeagueTable from '@/components/LeagueTable';
import OverallLeaderboard from '@/components/OverallLeaderboard';

const MyAccount: React.FC = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
  });
  const [savedSchedules, setSavedSchedules] = useState<SavedSchedule[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<SavedSchedule | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
      loadSchedules();
    }
  }, [user]);

  const loadSchedules = async () => {
    const schedules = await getSavedSchedules();
    setSavedSchedules(schedules);
  };

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setProfile(data);
        setFormData({
          full_name: data.full_name || '',
          email: data.email || user?.email || '',
        });
      } else {
        // Create profile if it doesn't exist
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            user_id: user?.id,
            email: user?.email,
            full_name: user?.user_metadata?.full_name || ''
          })
          .select()
          .single();

        if (createError) throw createError;
        setProfile(newProfile);
        setFormData({
          full_name: newProfile.full_name || '',
          email: newProfile.email || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile information.",
        variant: "destructive",
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          email: formData.email,
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      setProfile({ ...profile, ...formData });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Profile updated successfully.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile.",
        variant: "destructive",
      });
    }
  };

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

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6">
          <CardContent className="text-center">
            <p className="mb-4">Please sign in to view your account.</p>
            <Button asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (selectedSchedule) {
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
              Back to My Account
            </Button>
            <h1 className="text-3xl font-bold text-gray-800">{selectedSchedule.name}</h1>
          </div>
          
          <Tabs defaultValue="schedule" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="results">Enter Results</TabsTrigger>
              <TabsTrigger value="league" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                League Table
              </TabsTrigger>
              <TabsTrigger value="overall" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Overall Stats
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="schedule">
              <ScheduleDisplay schedule={selectedSchedule.schedule} />
            </TabsContent>
            
            <TabsContent value="results" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {selectedSchedule.schedule.matches.map((match) => (
                  <MatchResultInput
                    key={match.id}
                    match={match}
                    onResultUpdate={handleResultUpdate}
                  />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="league">
              <LeagueTable schedule={selectedSchedule.schedule} title={`${selectedSchedule.name} - League Table`} />
            </TabsContent>
            
            <TabsContent value="overall">
              <OverallLeaderboard savedSchedules={[selectedSchedule]} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">My Account</h1>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="schedules" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              My Schedules
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                  {!isEditing ? (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button 
                        size="sm"
                        onClick={handleSaveProfile}
                        className="flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        Save
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({
                            full_name: profile?.full_name || '',
                            email: profile?.email || '',
                          });
                        }}
                        className="flex items-center gap-2"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className="text-lg">
                      {profile?.full_name?.split(' ').map((n: string) => n[0]).join('') || 
                       user?.email?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {profile?.full_name || 'Anonymous User'}
                    </h3>
                    <p className="text-gray-600">{profile?.email}</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    {isEditing ? (
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="Enter your full name"
                      />
                    ) : (
                      <p className="p-2 bg-gray-50 rounded-md min-h-[40px] flex items-center">
                        {profile?.full_name || 'Not set'}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    {isEditing ? (
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="Enter your email"
                      />
                    ) : (
                      <p className="p-2 bg-gray-50 rounded-md min-h-[40px] flex items-center">
                        {profile?.email || 'Not set'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Account Statistics</h4>
                  <div className="grid gap-2 md:grid-cols-3">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{savedSchedules.length}</div>
                      <div className="text-sm text-gray-600">Total Schedules</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {savedSchedules.reduce((acc, s) => acc + s.schedule.matches.length, 0)}
                      </div>
                      <div className="text-sm text-gray-600">Total Matches</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {savedSchedules.reduce((acc, s) => acc + s.schedule.matches.filter(m => m.result?.completed).length, 0)}
                      </div>
                      <div className="text-sm text-gray-600">Completed Matches</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedules">
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
                <OverallLeaderboard savedSchedules={savedSchedules} />
                
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-gray-800">My Schedules</h2>
                  <div className="grid gap-4">
                    {savedSchedules.map((schedule) => {
                      const completedMatches = schedule.schedule.matches.filter(m => m.result?.completed).length;
                      return (
                        <Card key={schedule.id} className="hover:shadow-lg transition-shadow">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">{schedule.name}</CardTitle>
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
                                  <Badge variant="secondary" className="mt-1">Unique Partnerships Prioritised</Badge>
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
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDelete(schedule.id)}
                                  className="flex items-center gap-1"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  Delete
                                </Button>
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MyAccount;