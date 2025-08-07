import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Check, X } from 'lucide-react';

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

interface ClubMembersProps {
  club: Club;
  members: ClubMember[];
  isOwner: boolean;
  userId?: string;
  onApproveMember: (memberId: string) => void;
  onRemoveMember: (memberId: string) => void;
}

const ClubMembers: React.FC<ClubMembersProps> = ({
  club,
  members,
  isOwner,
  userId,
  onApproveMember,
  onRemoveMember
}) => {
  const pendingMembers = members.filter(m => m.status === 'pending');
  const approvedMembers = members.filter(m => m.status === 'approved');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Club Members ({approvedMembers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Show club owner first */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Club Owner</p>
                <p className="text-sm text-muted-foreground">
                  {isOwner ? 'You' : 'Owner'}
                </p>
              </div>
              <Badge>Owner</Badge>
            </div>

            {/* Approved members */}
            {approvedMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {member.profiles?.full_name || 'Unknown User'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {member.profiles?.email}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Member</Badge>
                  {isOwner && member.user_id !== userId && (
                    <Button
                      onClick={() => onRemoveMember(member.id)}
                      variant="outline"
                      size="sm"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {/* Pending members (only shown to owner) */}
            {isOwner && pendingMembers.length > 0 && (
              <>
                <hr className="my-6" />
                <h4 className="font-medium">Pending Applications ({pendingMembers.length})</h4>
                {pendingMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {member.profiles?.full_name || 'Unknown User'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {member.profiles?.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Pending</Badge>
                      <Button
                        onClick={() => onApproveMember(member.id)}
                        variant="outline"
                        size="sm"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => onRemoveMember(member.id)}
                        variant="outline"
                        size="sm"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {approvedMembers.length === 0 && !isOwner && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No members to display.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClubMembers;