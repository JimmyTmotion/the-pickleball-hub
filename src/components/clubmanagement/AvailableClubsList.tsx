import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, MapPin, UserPlus } from 'lucide-react';

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

interface AvailableClubsListProps {
  clubs: Club[];
  userApplications: Set<string>;
  loading: boolean;
  onApplyToJoinClub: (clubId: string) => void;
}

const AvailableClubsList: React.FC<AvailableClubsListProps> = ({
  clubs,
  userApplications,
  loading,
  onApplyToJoinClub
}) => {
  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Join a Club</h2>

      {clubs.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No clubs available to join at the moment.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {clubs.map((club) => (
            <Card key={club.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{club.name}</CardTitle>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {club.location_city}, {club.location_county}
                    </p>
                  </div>
                  {userApplications.has(club.id) ? (
                    <Badge variant="outline">Application Sent</Badge>
                  ) : (
                    <Button
                      onClick={() => onApplyToJoinClub(club.id)}
                      size="sm"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Join
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Created {new Date(club.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailableClubsList;