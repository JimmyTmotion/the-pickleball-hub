import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Users, Plus, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Subgroup {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  member_count?: number;
}

interface Member {
  id: string;
  user_id: string;
  status: string;
  joined_at: string;
  profiles?: {
    full_name?: string;
    email?: string;
  };
}

interface SubgroupMember {
  id: string;
  user_id: string;
  joined_at: string;
  profiles?: {
    full_name?: string;
    email?: string;
  };
}

interface SubgroupManagementProps {
  clubId: string;
  isOwner: boolean;
}

const SubgroupManagement = ({ clubId, isOwner }: SubgroupManagementProps) => {
  const [subgroups, setSubgroups] = useState<Subgroup[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedSubgroup, setSelectedSubgroup] = useState<string>('');
  const [newSubgroup, setNewSubgroup] = useState({ name: '', description: '' });

  const fetchSubgroups = async () => {
    try {
      let query = supabase
        .from('club_subgroups')
        .select(`
          *,
          club_subgroup_members(count)
        `)
        .eq('club_id', clubId);

      // If not owner, only show subgroups the user is a member of
      if (!isOwner) {
        const { data: userSubgroups, error: userError } = await supabase
          .from('club_subgroup_members')
          .select('subgroup_id')
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

        if (userError) throw userError;
        
        const subgroupIds = userSubgroups?.map(s => s.subgroup_id) || [];
        if (subgroupIds.length === 0) {
          setSubgroups([]);
          return;
        }
        
        query = query.in('id', subgroupIds);
      }

      const { data, error } = await query.order('created_at', { ascending: true });

      if (error) throw error;

      const subgroupsWithCount = data?.map(subgroup => ({
        ...subgroup,
        member_count: subgroup.club_subgroup_members?.[0]?.count || 0
      })) || [];

      setSubgroups(subgroupsWithCount);
    } catch (error) {
      console.error('Error fetching subgroups:', error);
      toast({
        title: "Error",
        description: "Failed to load subgroups",
        variant: "destructive",
      });
    }
  };

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('club_members')
        .select(`
          *,
          profiles (
            full_name,
            email
          )
        `)
        .eq('club_id', clubId)
        .eq('status', 'approved');

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchSubgroupMembers = async (subgroupId: string) => {
    try {
      const { data, error } = await supabase
        .from('club_subgroup_members')
        .select(`
          *,
          profiles (
            full_name,
            email
          )
        `)
        .eq('subgroup_id', subgroupId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching subgroup members:', error);
      return [];
    }
  };

  useEffect(() => {
    if (clubId) {
      fetchSubgroups();
      fetchMembers();
    }
    setLoading(false);
  }, [clubId, isOwner]);

  const handleCreateSubgroup = async () => {
    if (!newSubgroup.name.trim()) {
      toast({
        title: "Error",
        description: "Subgroup name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('club_subgroups')
        .insert({
          club_id: clubId,
          name: newSubgroup.name,
          description: newSubgroup.description || null
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Subgroup created successfully",
      });

      setNewSubgroup({ name: '', description: '' });
      setCreateDialogOpen(false);
      fetchSubgroups();
    } catch (error) {
      console.error('Error creating subgroup:', error);
      toast({
        title: "Error",
        description: "Failed to create subgroup",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSubgroup = async (subgroupId: string) => {
    if (!confirm('Are you sure you want to delete this subgroup? This action cannot be undone.')) {
      return;
    }

    try {
      // First delete all members from the subgroup
      await supabase
        .from('club_subgroup_members')
        .delete()
        .eq('subgroup_id', subgroupId);

      // Then delete the subgroup
      const { error } = await supabase
        .from('club_subgroups')
        .delete()
        .eq('id', subgroupId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Subgroup deleted successfully",
      });

      fetchSubgroups();
    } catch (error) {
      console.error('Error deleting subgroup:', error);
      toast({
        title: "Error",
        description: "Failed to delete subgroup",
        variant: "destructive",
      });
    }
  };

  const handleAssignMember = async (memberId: string) => {
    if (!selectedSubgroup) {
      toast({
        title: "Error",
        description: "Please select a subgroup",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('club_subgroup_members')
        .insert({
          subgroup_id: selectedSubgroup,
          user_id: memberId
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Error",
            description: "Member is already in this subgroup",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      toast({
        title: "Success",
        description: "Member assigned to subgroup successfully",
      });

      setAssignDialogOpen(false);
      fetchSubgroups();
    } catch (error) {
      console.error('Error assigning member:', error);
      toast({
        title: "Error",
        description: "Failed to assign member to subgroup",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Loading subgroups...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Subgroups</h3>
        {isOwner && (
          <div className="flex gap-2">
            <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign Members
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Member to Subgroup</DialogTitle>
                  <DialogDescription>
                    Select a subgroup and member to assign
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="subgroup-select">Subgroup</Label>
                    <Select value={selectedSubgroup} onValueChange={setSelectedSubgroup}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a subgroup" />
                      </SelectTrigger>
                      <SelectContent>
                        {subgroups.map((subgroup) => (
                          <SelectItem key={subgroup.id} value={subgroup.id}>
                            {subgroup.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Members</Label>
                    <div className="space-y-2 mt-2">
                       {members.map((member) => (
                         <div key={member.id} className="flex items-center justify-between p-2 border rounded">
                           <span>
                             {member.profiles?.full_name || member.profiles?.email || 'Unknown User'}
                           </span>
                           <Button
                             size="sm"
                             onClick={() => handleAssignMember(member.user_id)}
                           >
                             Assign
                           </Button>
                         </div>
                       ))}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Subgroup
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Subgroup</DialogTitle>
                  <DialogDescription>
                    Create a subgroup to organize club members
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Subgroup Name</Label>
                    <Input
                      id="name"
                      value={newSubgroup.name}
                      onChange={(e) => setNewSubgroup(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter subgroup name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={newSubgroup.description}
                      onChange={(e) => setNewSubgroup(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter subgroup description"
                    />
                  </div>
                  <Button onClick={handleCreateSubgroup} className="w-full">
                    Create Subgroup
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {subgroups.length === 0 ? (
        <Card>
          <CardContent className="text-center py-6">
            <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">No subgroups created yet</p>
            {isOwner && (
              <p className="text-sm text-muted-foreground mt-1">
                Create your first subgroup to organize members
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {subgroups.map((subgroup) => (
            <SubgroupCard
              key={subgroup.id}
              subgroup={subgroup}
              isOwner={isOwner}
              onDelete={() => handleDeleteSubgroup(subgroup.id)}
              fetchSubgroupMembers={fetchSubgroupMembers}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface SubgroupCardProps {
  subgroup: Subgroup;
  isOwner: boolean;
  onDelete: () => void;
  fetchSubgroupMembers: (subgroupId: string) => Promise<SubgroupMember[]>;
}

const SubgroupCard = ({ subgroup, isOwner, onDelete, fetchSubgroupMembers }: SubgroupCardProps) => {
  const [members, setMembers] = useState<SubgroupMember[]>([]);
  const [showMembers, setShowMembers] = useState(false);

  useEffect(() => {
    if (showMembers) {
      fetchSubgroupMembers(subgroup.id).then(setMembers);
    }
  }, [showMembers, subgroup.id, fetchSubgroupMembers]);

  const handleRemoveMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('club_subgroup_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Member removed from subgroup",
      });

      // Refresh members list
      const updatedMembers = await fetchSubgroupMembers(subgroup.id);
      setMembers(updatedMembers);
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Error",
        description: "Failed to remove member",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{subgroup.name}</CardTitle>
            {subgroup.description && (
              <CardDescription>{subgroup.description}</CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              <Users className="h-3 w-3 mr-1" />
              {subgroup.member_count || 0} members
            </Badge>
            {isOwner && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowMembers(!showMembers)}
        >
          {showMembers ? 'Hide Members' : 'Show Members'}
        </Button>

        {showMembers && (
          <div className="mt-4 space-y-2">
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground">No members in this subgroup</p>
            ) : (
              members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-2 bg-muted rounded">
                   <span className="text-sm">
                     {member.profiles?.full_name || member.profiles?.email || 'Unknown User'}
                   </span>
                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SubgroupManagement;