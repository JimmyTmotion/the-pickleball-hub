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
import ImageUpload from '@/components/ImageUpload';
import { useToast } from '@/hooks/use-toast';
import { Users, MapPin, Settings, Plus, UserPlus, MessageSquare, HelpCircle, Copy, Check } from 'lucide-react';

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
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
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
      // Get clubs owned by user
      const { data: ownedClubs, error: ownedError } = await supabase
        .from('clubs')
        .select('*')
        .eq('owner_id', user.id);

      if (ownedError) throw ownedError;

      // Get clubs user is a member of
      const { data: memberClubs, error: memberError } = await supabase
        .from('club_members')
        .select(`
          clubs (
            id, name, location_city, location_county, logo_url, owner_id, auto_join_token, created_at
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'approved');

      if (memberError) throw memberError;

      const allClubs = [
        ...(ownedClubs || []),
        ...(memberClubs?.map(m => m.clubs).filter(Boolean) || [])
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
        description: "Failed to load clubs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClubData = async () => {
    if (!selectedClub) return;

    try {
      // Fetch members
      const { data: membersData, error: membersError } = await supabase
        .from('club_members')
        .select('*')
        .eq('club_id', selectedClub.id);

      if (membersError) throw membersError;
      setMembers((membersData || []) as ClubMember[]);

      // Fetch notices
      const { data: noticesData, error: noticesError } = await supabase
        .from('club_notices')
        .select('*')
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
    } catch (error) {
      console.error('Error approving member:', error);
      toast({
        title: "Error",
        description: "Failed to approve member",
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

  const isOwner = selectedClub && user && selectedClub.owner_id === user.id;

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (clubs.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Manage Your Club</h1>
          <p className="text-muted-foreground mb-8">Create or join a club to get started</p>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create My Club
          </Button>
        </div>

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
                />
              </div>
              <Button type="submit" className="w-full">Create Club</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Club Management</h1>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Club
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Club Selector */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>My Clubs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {clubs.map((club) => (
                <div
                  key={club.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedClub?.id === club.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted'
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
            </CardContent>
          </Card>
        </div>

        {/* Club Details */}
        <div className="lg:col-span-3">
          {selectedClub && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="members">Members</TabsTrigger>
                <TabsTrigger value="notices">Notice Board</TabsTrigger>
                <TabsTrigger value="faqs">FAQs</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      {selectedClub.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      {selectedClub.logo_url && (
                        <img 
                          src={selectedClub.logo_url} 
                          alt="Club logo" 
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p>{selectedClub.location_city}, {selectedClub.location_county}</p>
                      </div>
                    </div>
                    
                    {isOwner && (
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Auto-join Link</p>
                            <p className="text-sm text-muted-foreground">
                              Share this link for users to join automatically
                            </p>
                          </div>
                          <Button onClick={copyJoinLink} variant="outline">
                            {copiedToken ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
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
                      {members.filter(m => m.status === 'approved').map((member) => (
                        <div key={member.id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {member.profiles?.full_name || 'Unknown User'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {member.profiles?.email}
                            </p>
                          </div>
                          <Badge variant="secondary">Member</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {isOwner && members.filter(m => m.status === 'pending').length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Pending Applications</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {members.filter(m => m.status === 'pending').map((member) => (
                          <div key={member.id} className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">
                                {member.profiles?.full_name || 'Unknown User'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {member.profiles?.email}
                              </p>
                            </div>
                            <Button onClick={() => approveMember(member.id)}>
                              Approve
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
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
                            <span className="text-sm text-muted-foreground">
                              {new Date(notice.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm mb-2">{notice.content}</p>
                          <p className="text-xs text-muted-foreground">
                            By {notice.profiles?.full_name || 'Unknown User'}
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
                          <h3 className="font-medium mb-2">{faq.question}</h3>
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
      </div>

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
              />
            </div>
            <Button type="submit" className="w-full">Create Club</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClubManagement;