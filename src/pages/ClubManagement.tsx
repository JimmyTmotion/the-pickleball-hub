import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import ImageUpload from '@/components/ImageUpload';
import Navigation from '@/components/ui/navigation';
import SubgroupManagement from '@/components/SubgroupManagement';
import LeagueTable from '@/components/LeagueTable';
import { useToast } from '@/hooks/use-toast';
import { SavedSchedule } from '@/types/schedule';
import { Users, MapPin, Settings, Plus, UserPlus, MessageSquare, HelpCircle, Copy, Check, X, Trash2, Calendar, Trophy, BarChart3, ChevronDown } from 'lucide-react';

interface Club {
  id: string;
  name: string;
  location_city: string;
  location_county: string;
  logo_url?: string;
  owner_id: string;
  auto_join_token: string;
  created_at: string;
}

interface ClubMember {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  joined_at: string;
  profiles?: {
    full_name?: string;
    email?: string;
  };
}

interface Notice {
  id: string;
  title: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: {
    full_name?: string;
  };
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  order_index: number;
}

const ClubManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [availableClubs, setAvailableClubs] = useState<Club[]>([]);
  const [userApplications, setUserApplications] = useState<Set<string>>(new Set());
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [availableClubsLoading, setAvailableClubsLoading] = useState(true);
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [schedules, setSchedules] = useState<SavedSchedule[]>([]);
  const [newNotice, setNewNotice] = useState({ title: '', content: '' });
  const [newFAQ, setNewFAQ] = useState({ question: '', answer: '' });
  const [clubForm, setClubForm] = useState({
    name: '',
    location_city: '',
    location_county: '',
    logo_url: ''
  });
  const [copiedToken, setCopiedToken] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserClubs();
      fetchAvailableClubs();
    }
  }, [user]);

  useEffect(() => {
    if (selectedClub) {
      fetchClubData();
    }
  }, [selectedClub]);

  const fetchUserClubs = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get clubs owned by user
      const { data: ownedClubs, error: ownedError } = await supabase
        .from('clubs')
        .select('*')
        .eq('owner_id', user.id);

      if (ownedError) throw ownedError;

      // Get clubs user is a member of - simplified query to avoid recursion
      const { data: memberData, error: memberError } = await supabase
        .from('club_members')
        .select('club_id')
        .eq('user_id', user.id)
        .eq('status', 'approved');

      if (memberError) throw memberError;

      // Get club details for member clubs
      let memberClubs: Club[] = [];
      if (memberData && memberData.length > 0) {
        const clubIds = memberData.map(m => m.club_id);
        const { data: clubsData, error: clubsError } = await supabase
          .from('clubs')
          .select('*')
          .in('id', clubIds);

        if (clubsError) throw clubsError;
        memberClubs = clubsData || [];
      }

      const allClubs = [
        ...(ownedClubs || []),
        ...memberClubs
      ];

      // Remove duplicates
      const uniqueClubs = allClubs.filter((club, index, self) => 
        index === self.findIndex(c => c.id === club.id)
      );

      setClubs(uniqueClubs);
      if (uniqueClubs.length > 0 && !selectedClub) {
        setSelectedClub(uniqueClubs[0]);
      }
    } catch (error) {
      console.error('Error fetching clubs:', error);
      toast({
        title: "Error",
        description: "Failed to load clubs. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableClubs = async () => {
    if (!user) return;

    try {
      setAvailableClubsLoading(true);
      
      // Get all clubs
      const { data: allClubs, error: clubsError } = await supabase
        .from('clubs')
        .select('*')
        .order('created_at', { ascending: false });

      if (clubsError) throw clubsError;

      // Get clubs user is already a member of (approved), owns, or has pending applications for
      const { data: userMemberships, error: membershipError } = await supabase
        .from('club_members')
        .select('club_id, status')
        .eq('user_id', user.id);

      if (membershipError) throw membershipError;

      const approvedClubIds = userMemberships?.filter(m => m.status === 'approved').map(m => m.club_id) || [];
      const pendingApplicationIds = userMemberships?.filter(m => m.status === 'pending').map(m => m.club_id) || [];
      
      // Track pending applications
      setUserApplications(new Set(pendingApplicationIds));
      
      // Filter out clubs user owns or is already an approved member of, but keep pending ones visible
      const available = allClubs?.filter(club => 
        club.owner_id !== user.id && !approvedClubIds.includes(club.id)
      ) || [];

      setAvailableClubs(available);
    } catch (error) {
      console.error('Error fetching available clubs:', error);
      toast({
        title: "Error",
        description: "Failed to load available clubs. Please try again.",
        variant: "destructive"
      });
    } finally {
      setAvailableClubsLoading(false);
    }
  };

  const applyToJoinClub = async (clubId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('club_members')
        .insert({
          club_id: clubId,
          user_id: user.id,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your application has been sent! Please wait for approval."
      });

      // Refresh available clubs to remove the applied club
      fetchAvailableClubs();
    } catch (error) {
      console.error('Error applying to club:', error);
      toast({
        title: "Error",
        description: "Failed to apply to club",
        variant: "destructive"
      });
    }
  };

  const fetchClubData = async () => {
    if (!selectedClub) return;

    try {
      // Fetch members with profile information
      const { data: membersData, error: membersError } = await supabase
        .from('club_members')
        .select(`
          *,
          profiles (
            full_name,
            email
          )
        `)
        .eq('club_id', selectedClub.id);

      if (membersError) throw membersError;
      setMembers((membersData || []) as ClubMember[]);

      // Fetch notices with profile information
      const { data: noticesData, error: noticesError } = await supabase
        .from('club_notices')
        .select(`
          *,
          profiles (
            full_name
          )
        `)
        .eq('club_id', selectedClub.id)
        .order('created_at', { ascending: false });

      if (noticesError) throw noticesError;
      setNotices((noticesData || []) as Notice[]);

      // Fetch FAQs
      const { data: faqsData, error: faqsError } = await supabase
        .from('club_faqs')
        .select('*')
        .eq('club_id', selectedClub.id)
        .order('order_index');

      if (faqsError) throw faqsError;
      setFaqs(faqsData || []);

      // Fetch schedules associated with this club
      const { data: schedulesData, error: schedulesError } = await supabase
        .from('schedules')
        .select('*')
        .eq('club_id', selectedClub.id)
        .order('created_at', { ascending: false });

      if (schedulesError) throw schedulesError;
      
      // Get user profiles for schedule creators
      const userIds = [...new Set((schedulesData || []).map(s => s.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);
      
      const profilesMap = new Map(
        (profilesData || []).map(p => [p.user_id, p])
      );
      
      const mappedSchedules: SavedSchedule[] = (schedulesData || []).map((schedule) => {
        const profile = profilesMap.get(schedule.user_id);
        return {
          id: schedule.id,
          name: schedule.name,
          config: schedule.config as any,
          schedule: schedule.schedule as any,
          createdAt: new Date(schedule.created_at),
          createdBy: {
            id: schedule.user_id,
            name: profile?.full_name || 'Unknown User',
            email: profile?.email || '',
          },
          club_id: schedule.club_id,
          subgroup_id: schedule.subgroup_id,
        };
      });
      
      setSchedules(mappedSchedules);

    } catch (error) {
      console.error('Error fetching club data:', error);
    }
  };

  const createClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('clubs')
        .insert({
          name: clubForm.name,
          location_city: clubForm.location_city,
          location_county: clubForm.location_county,
          logo_url: clubForm.logo_url,
          owner_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Club created successfully!"
      });

      setClubs([...clubs, data]);
      setSelectedClub(data);
      setShowCreateForm(false);
      setClubForm({ name: '', location_city: '', location_county: '', logo_url: '' });
      fetchAvailableClubs(); // Refresh available clubs
    } catch (error) {
      console.error('Error creating club:', error);
      toast({
        title: "Error",
        description: "Failed to create club",
        variant: "destructive"
      });
    }
  };

  const approveMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('club_members')
        .update({ status: 'approved' })
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Member approved successfully!"
      });

      fetchClubData();
      fetchAvailableClubs(); // Refresh available clubs
    } catch (error) {
      console.error('Error approving member:', error);
      toast({
        title: "Error",
        description: "Failed to approve member",
        variant: "destructive"
      });
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('club_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Member removed successfully!"
      });

      fetchClubData();
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Error",
        description: "Failed to remove member",
        variant: "destructive"
      });
    }
  };

  const createNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedClub) return;

    try {
      const { error } = await supabase
        .from('club_notices')
        .insert({
          club_id: selectedClub.id,
          user_id: user.id,
          title: newNotice.title,
          content: newNotice.content
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Notice posted successfully!"
      });

      setNewNotice({ title: '', content: '' });
      fetchClubData();
    } catch (error) {
      console.error('Error creating notice:', error);
      toast({
        title: "Error",
        description: "Failed to post notice",
        variant: "destructive"
      });
    }
  };

  const createFAQ = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClub) return;

    try {
      const { error } = await supabase
        .from('club_faqs')
        .insert({
          club_id: selectedClub.id,
          question: newFAQ.question,
          answer: newFAQ.answer,
          order_index: faqs.length
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "FAQ added successfully!"
      });

      setNewFAQ({ question: '', answer: '' });
      fetchClubData();
    } catch (error) {
      console.error('Error creating FAQ:', error);
      toast({
        title: "Error",
        description: "Failed to add FAQ",
        variant: "destructive"
      });
    }
  };

  const deleteNotice = async (noticeId: string) => {
    if (!confirm('Are you sure you want to delete this notice?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('club_notices')
        .delete()
        .eq('id', noticeId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Notice deleted successfully!"
      });

      fetchClubData();
    } catch (error) {
      console.error('Error deleting notice:', error);
      toast({
        title: "Error",
        description: "Failed to delete notice",
        variant: "destructive"
      });
    }
  };

  const deleteFAQ = async (faqId: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('club_faqs')
        .delete()
        .eq('id', faqId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "FAQ deleted successfully!"
      });

      fetchClubData();
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      toast({
        title: "Error",
        description: "Failed to delete FAQ",
        variant: "destructive"
      });
    }
  };

  const copyJoinLink = async () => {
    if (!selectedClub) return;

    const joinLink = `${window.location.origin}/club/join/${selectedClub.auto_join_token}`;
    
    try {
      await navigator.clipboard.writeText(joinLink);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
      toast({
        title: "Success",
        description: "Join link copied to clipboard!"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive"
      });
    }
  };

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

  const isOwner = selectedClub && user && selectedClub.owner_id === user.id;

  if (loading || availableClubsLoading) {
    return (
      <>
        <Navigation />
        <div className="flex justify-center items-center h-64">Loading...</div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 text-center">My Clubs</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
          {/* Left Column - Your Clubs (3/4 width on large screens) */}
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <Settings className="h-5 w-5" />
                  Your Clubs
                </CardTitle>
              </CardHeader>
              <CardContent>
                {clubs.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">You don't own or belong to any clubs yet</p>
                    <Button onClick={() => setShowCreateForm(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create My Club
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">Select a club to manage</p>
                      <Button size="sm" onClick={() => setShowCreateForm(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Club
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {clubs.map((club) => (
                        <div
                          key={club.id}
                          className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                            selectedClub?.id === club.id 
                              ? 'bg-primary text-primary-foreground border-primary' 
                              : 'hover:bg-muted border-border'
                          }`}
                          onClick={() => setSelectedClub(club)}
                        >
                          <div className="font-medium">{club.name}</div>
                          <div className="text-sm opacity-70">
                            {club.location_city}, {club.location_county}
                          </div>
                          {club.owner_id === user?.id && (
                            <Badge variant="secondary" className="text-xs mt-1">Owner</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedClub && (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 h-auto">
                  <TabsTrigger value="overview" className="text-xs md:text-sm">Overview</TabsTrigger>
                  <TabsTrigger value="schedules" className="text-xs md:text-sm">Schedules</TabsTrigger>
                  <TabsTrigger value="members" className="text-xs md:text-sm">Members</TabsTrigger>
                  <TabsTrigger value="subgroups" className="text-xs md:text-sm">Subgroups</TabsTrigger>
                  <TabsTrigger value="notices" className="text-xs md:text-sm">Notices</TabsTrigger>
                  <TabsTrigger value="faqs" className="text-xs md:text-sm">FAQs</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        {selectedClub.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Location</p>
                          <p>{selectedClub.location_city}, {selectedClub.location_county}</p>
                        </div>
                        
                        {isOwner && (
                          <div className="space-y-4">
                            <Separator />
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">Auto-join link</p>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <Input 
                                  value={`${window.location.origin}/club/join/${selectedClub.auto_join_token}`}
                                  readOnly
                                  className="text-xs md:text-sm"
                                />
                                <Button onClick={copyJoinLink} variant="outline" size="sm">
                                  {copiedToken ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                              </div>
                            </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="schedules" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Club Schedules ({schedules.length})
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
                                        {/* League Table */}
                                        <div className="space-y-2">
                                          <h4 className="font-medium text-sm">League Table</h4>
                                          <LeagueTable schedule={schedule.schedule} />
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
                </TabsContent>

                <TabsContent value="members" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Club Members ({members.filter(m => m.status === 'approved').length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Show club owner first - get owner details from profiles */}
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {members.find(m => m.user_id === selectedClub.owner_id)?.profiles?.full_name || 'Club Owner (No Name Set)'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {members.find(m => m.user_id === selectedClub.owner_id)?.profiles?.email || 'Owner'}
                            </p>
                          </div>
                          <Badge variant="default">Owner</Badge>
                        </div>
                        
                        {/* Show other approved members */}
                        <div className="space-y-4">
                          {members.filter(m => m.status === 'approved' && m.user_id !== selectedClub.owner_id).map((member) => (
                            <div key={member.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex-1">
                                <p className="font-medium">
                                  {member.profiles?.full_name || 'Unknown User'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Joined: {new Date(member.joined_at).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">Member</Badge>
                                {isOwner && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => removeMember(member.id)}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {isOwner && members.filter(m => m.status === 'pending').length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Pending Applications ({members.filter(m => m.status === 'pending').length})</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {members.filter(m => m.status === 'pending').map((member) => (
                            <div key={member.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex-1">
                                <p className="font-medium">
                                  {member.profiles?.full_name || 'Unknown User'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {member.profiles?.email}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Applied: {new Date(member.joined_at).toLocaleDateString()}
                                </p>
                              </div>
                              <Button onClick={() => approveMember(member.id)} size="sm">
                                Approve
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="subgroups" className="space-y-6">
                  <SubgroupManagement 
                    clubId={selectedClub.id} 
                    isOwner={isOwner || false} 
                  />
                </TabsContent>

                <TabsContent value="notices" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Notice Board
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={createNotice} className="space-y-4 mb-6">
                        <Input
                          placeholder="Notice title"
                          value={newNotice.title}
                          onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                          required
                        />
                        <Textarea
                          placeholder="Notice content"
                          value={newNotice.content}
                          onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })}
                          required
                        />
                        <Button type="submit">Post Notice</Button>
                      </form>
                      <Separator className="my-6" />

                       <div className="space-y-4">
                         {notices.map((notice) => (
                           <div key={notice.id} className="border rounded-lg p-4">
                             <div className="flex justify-between items-start mb-2">
                               <h3 className="font-medium">{notice.title}</h3>
                               <div className="flex items-center gap-2">
                                 <p className="text-xs text-muted-foreground">
                                   {new Date(notice.created_at).toLocaleDateString()}
                                 </p>
                                 {/* Show delete button for notice author or club owner */}
                                 {(notice.user_id === user?.id || isOwner) && (
                                   <Button
                                     variant="ghost"
                                     size="sm"
                                     onClick={() => deleteNotice(notice.id)}
                                     className="text-destructive hover:text-destructive"
                                   >
                                     <Trash2 className="h-4 w-4" />
                                   </Button>
                                 )}
                               </div>
                             </div>
                             <p className="text-sm mb-2">{notice.content}</p>
                             <p className="text-xs text-muted-foreground">
                               Posted by: {notice.profiles?.full_name || 'Unknown User'}
                             </p>
                           </div>
                         ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="faqs" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <HelpCircle className="h-5 w-5" />
                        Frequently Asked Questions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isOwner && (
                        <>
                          <form onSubmit={createFAQ} className="space-y-4 mb-6">
                            <Input
                              placeholder="Question"
                              value={newFAQ.question}
                              onChange={(e) => setNewFAQ({ ...newFAQ, question: e.target.value })}
                              required
                            />
                            <Textarea
                              placeholder="Answer"
                              value={newFAQ.answer}
                              onChange={(e) => setNewFAQ({ ...newFAQ, answer: e.target.value })}
                              required
                            />
                            <Button type="submit">Add FAQ</Button>
                          </form>
                          <Separator className="my-6" />
                        </>
                      )}

                       <div className="space-y-4">
                         {faqs.map((faq) => (
                           <div key={faq.id} className="border rounded-lg p-4">
                             <div className="flex justify-between items-start mb-2">
                               <h3 className="font-medium">{faq.question}</h3>
                               {/* Show delete button for club owners only */}
                               {isOwner && (
                                 <Button
                                   variant="ghost"
                                   size="sm"
                                   onClick={() => deleteFAQ(faq.id)}
                                   className="text-destructive hover:text-destructive"
                                 >
                                   <Trash2 className="h-4 w-4" />
                                 </Button>
                               )}
                             </div>
                             <p className="text-sm text-muted-foreground">{faq.answer}</p>
                           </div>
                         ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>

          {/* Right Column - Join a Club (1/4 width on large screens) */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Join a Club
                </CardTitle>
              </CardHeader>
              <CardContent>
                {availableClubs.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No clubs available to join at the moment</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Apply to join a club below. Your application will need to be approved by the club owner.
                    </p>
                    
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {availableClubs.map((club) => (
                        <div key={club.id} className="border rounded-lg p-4">
                          <div className="space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                              {club.logo_url && (
                                <img 
                                  src={club.logo_url} 
                                  alt="Club logo" 
                                  className="w-10 h-10 object-cover rounded self-start sm:self-center"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium break-words">{club.name}</h3>
                                <p className="text-sm text-muted-foreground break-words">
                                  {club.location_city}, {club.location_county}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                              {userApplications.has(club.id) ? (
                                <Badge variant="secondary" className="text-center">Application Pending</Badge>
                              ) : (
                                <Button 
                                  onClick={() => applyToJoinClub(club.id)}
                                  size="sm"
                                  className="w-full sm:w-auto"
                                >
                                  Apply to Join
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Create Club Dialog */}
        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Club</DialogTitle>
            </DialogHeader>
            <form onSubmit={createClub} className="space-y-4">
              <div>
                <Label htmlFor="name">Club Name</Label>
                <Input
                  id="name"
                  value={clubForm.name}
                  onChange={(e) => setClubForm({ ...clubForm, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="city">City/Town</Label>
                <Input
                  id="city"
                  value={clubForm.location_city}
                  onChange={(e) => setClubForm({ ...clubForm, location_city: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="county">County</Label>
                <Input
                  id="county"
                  value={clubForm.location_county}
                  onChange={(e) => setClubForm({ ...clubForm, location_county: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Club Logo</Label>
                <ImageUpload
                  className="club-logo-upload"
                  onImageChange={(url) => setClubForm({ ...clubForm, logo_url: url })}
                  currentImageUrl={clubForm.logo_url}
                  title="Club Logo"
                />
              </div>
              <Button type="submit" className="w-full">Create Club</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default ClubManagement;
