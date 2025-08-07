import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Settings, Plus } from 'lucide-react';
import ClubCreateForm from './ClubCreateForm';

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

interface UserClubsListProps {
  clubs: Club[];
  selectedClub: Club | null;
  userId?: string;
  loading: boolean;
  activeTab: string;
  showCreateForm: boolean;
  clubForm: {
    name: string;
    location_city: string;
    location_county: string;
    logo_url: string;
  };
  onSelectClub: (club: Club) => void;
  onTabChange: (tab: string) => void;
  onShowCreateForm: (show: boolean) => void;
  onClubFormChange: (field: string, value: string) => void;
  onCreateClub: (e: React.FormEvent) => void;
  children: React.ReactNode;
}

const UserClubsList: React.FC<UserClubsListProps> = ({
  clubs,
  selectedClub,
  userId,
  loading,
  activeTab,
  showCreateForm,
  clubForm,
  onSelectClub,
  onTabChange,
  onShowCreateForm,
  onClubFormChange,
  onCreateClub,
  children
}) => {
  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your Clubs</h2>
        <Dialog open={showCreateForm} onOpenChange={onShowCreateForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Club
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Club</DialogTitle>
            </DialogHeader>
            <ClubCreateForm
              clubForm={clubForm}
              onClubFormChange={onClubFormChange}
              onCreateClub={onCreateClub}
            />
          </DialogContent>
        </Dialog>
      </div>

      {clubs.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No clubs yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first club to get started with managing your pickleball community.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {clubs.map((club) => (
            <Card
              key={club.id}
              className={`cursor-pointer transition-colors ${
                selectedClub?.id === club.id ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
              }`}
              onClick={() => onSelectClub(club)}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{club.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {club.location_city}, {club.location_county}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {club.owner_id === userId ? (
                      <Badge variant="default">Owner</Badge>
                    ) : (
                      <Badge variant="secondary">Member</Badge>
                    )}
                    <Settings className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedClub && (
        <Card>
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={onTabChange}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="results">Results</TabsTrigger>
                <TabsTrigger value="members">Members</TabsTrigger>
                <TabsTrigger value="notices">Notices</TabsTrigger>
                <TabsTrigger value="faqs">FAQs</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                {children}
              </TabsContent>
              <TabsContent value="results" className="mt-6">
                {children}
              </TabsContent>
              <TabsContent value="members" className="mt-6">
                {children}
              </TabsContent>
              <TabsContent value="notices" className="mt-6">
                {children}
              </TabsContent>
              <TabsContent value="faqs" className="mt-6">
                {children}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserClubsList;