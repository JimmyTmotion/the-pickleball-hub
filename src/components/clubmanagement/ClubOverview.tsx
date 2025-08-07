import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MapPin, Copy, Check } from 'lucide-react';

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

interface ClubOverviewProps {
  club: Club;
  isOwner: boolean;
  copiedToken: boolean;
  onCopyJoinLink: () => void;
}

const ClubOverview: React.FC<ClubOverviewProps> = ({
  club,
  isOwner,
  copiedToken,
  onCopyJoinLink
}) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {club.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Location</p>
              <p>{club.location_city}, {club.location_county}</p>
            </div>
            
            {isOwner && (
              <div className="space-y-4">
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Auto-join link</p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Input 
                        value={`https://thepickleballhub.co.uk/club/join/${club.auto_join_token}`}
                        readOnly
                        className="text-xs md:text-sm"
                      />
                      <Button onClick={onCopyJoinLink} variant="outline" size="sm">
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
    </div>
  );
};

export default ClubOverview;