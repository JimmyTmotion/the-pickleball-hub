import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/ui/navigation';
import SubgroupManagement from '@/components/SubgroupManagement';
import { useToast } from '@/hooks/use-toast';
import { SavedSchedule } from '@/types/schedule';
import UserClubsList from '@/components/clubmanagement/UserClubsList';
import AvailableClubsList from '@/components/clubmanagement/AvailableClubsList';
import ClubOverview from '@/components/clubmanagement/ClubOverview';
import ClubResults from '@/components/clubmanagement/ClubResults';
import ClubMembers from '@/components/clubmanagement/ClubMembers';
import ClubNotices from '@/components/clubmanagement/ClubNotices';
import ClubFAQs from '@/components/clubmanagement/ClubFAQs';

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
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [activeTab, setActiveTab] = useState('overview');
  const [clubForm, setClubForm] = useState({
    name: '',
    location_city: '',
    location_county: '',
    logo_url: ''
  });
  const [copiedToken, setCopiedToken] = useState(false);
  
  // Add new state for main section tabs
  const [mainSection, setMainSection] = useState('your-clubs'); // 'your-clubs' or 'join-club'

  useEffect(() => {
    if (user) {
      fetchUserClubs();
      fetchAvailableClubs();
    }
  }, [user]);

  useEffect(() => {
    // Handle URL parameters for both main section and club tabs
    const section = searchParams.get('section');
    const tab = searchParams.get('tab');
    
    if (section && ['your-clubs', 'join-club'].includes(section)) {
      setMainSection(section);
    }
    
    if (tab && ['overview', 'results', 'members', 'notices', 'faqs', 'subgroups', 'settings'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (selectedClub) {
      fetchClubData();
    }
  }, [selectedClub]);

  // Helper function to update URL params
  const updateSearchParams = (section: string, tab?: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('section', section);
    if (tab) {
      newParams.set('tab', tab);
    } else {
      newParams.delete('tab');
    }
    setSearchParams(newParams);
  };

  const handleMainSectionChange = (section: string) => {
    setMainSection(section);
    updateSearchParams(section);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    updateSearchParams(mainSection, tab);
  };

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

    const joinLink = `https://thepickleballhub.co.uk/club/join/${selectedClub.auto_join_token}`;
    
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

  const isOwner = selectedClub && user && selectedClub.owner_id === user.id;

  if (loading || availableClubsLoading) {
    return (
      <>
        <Navigation />
        <div className="flex justify-center items-center h-64">Loading...</div>
      </>
    );
  }

  const renderTabContent = () => {
    if (!selectedClub) return null;

    switch (activeTab) {
      case 'overview':
        return (
          <ClubOverview
            club={selectedClub}
            isOwner={isOwner}
            copiedToken={copiedToken}
            onCopyJoinLink={copyJoinLink}
          />
        );

      case 'results':
        return <ClubResults schedules={schedules} />;

      case 'members':
        return (
          <ClubMembers
            club={selectedClub}
            members={members}
            isOwner={isOwner}
            userId={user?.id}
            onApproveMember={approveMember}
            onRemoveMember={removeMember}
          />
        );

      case 'subgroups':
        return <SubgroupManagement clubId={selectedClub.id} isOwner={isOwner || false} />;

      case 'notices':
        return (
          <ClubNotices
            notices={notices}
            newNotice={newNotice}
            isOwner={isOwner}
            userId={user?.id}
            onNewNoticeChange={(field, value) => 
              setNewNotice(prev => ({ ...prev, [field]: value }))
            }
            onCreateNotice={createNotice}
            onDeleteNotice={deleteNotice}
          />
        );

      case 'faqs':
        return (
          <ClubFAQs
            faqs={faqs}
            newFAQ={newFAQ}
            isOwner={isOwner}
            onNewFAQChange={(field, value) => 
              setNewFAQ(prev => ({ ...prev, [field]: value }))
            }
            onCreateFAQ={createFAQ}
            onDeleteFAQ={deleteFAQ}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-8">
          {/* Main Section Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => handleMainSectionChange('your-clubs')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  mainSection === 'your-clubs'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Your Clubs
              </button>
              <button
                onClick={() => handleMainSectionChange('join-club')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  mainSection === 'join-club'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Join a Club
              </button>
            </nav>
          </div>

          {/* Full Width Content Area */}
          <div className="w-full">
            {mainSection === 'your-clubs' ? (
              <UserClubsList
                clubs={clubs}
                selectedClub={selectedClub}
                userId={user?.id}
                loading={loading}
                activeTab={activeTab}
                showCreateForm={showCreateForm}
                clubForm={clubForm}
                onSelectClub={setSelectedClub}
                onTabChange={handleTabChange}
                onShowCreateForm={setShowCreateForm}
                onClubFormChange={(field, value) => 
                  setClubForm(prev => ({ ...prev, [field]: value }))
                }
                onCreateClub={createClub}
              >
                {renderTabContent()}
              </UserClubsList>
            ) : (
              <AvailableClubsList
                clubs={availableClubs}
                userApplications={userApplications}
                loading={availableClubsLoading}
                onApplyToJoinClub={applyToJoinClub}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ClubManagement;