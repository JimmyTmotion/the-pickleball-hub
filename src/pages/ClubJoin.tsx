import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Users, MapPin } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Navigation from '@/components/ui/navigation';

interface Club {
  id: string;
  name: string;
  location_city: string;
  location_county: string;
  logo_url?: string;
  owner_id: string;
}

export default function ClubJoin() {
  const { token } = useParams<{ token: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [isAlreadyMember, setIsAlreadyMember] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }

    fetchClubByToken();
  }, [token]);

  useEffect(() => {
    if (user && club) {
      checkMembership();
    }
  }, [user, club]);

  const fetchClubByToken = async () => {
    try {
      const { data, error } = await supabase
        .from('clubs')
        .select('id, name, location_city, location_county, logo_url, owner_id')
        .eq('auto_join_token', token)
        .single();

      if (error) {
        console.error('Error fetching club:', error);
        toast({
          title: "Error",
          description: "Invalid or expired join link",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      setClub(data);
    } catch (error) {
      console.error('Error:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const checkMembership = async () => {
    if (!user || !club) return;

    try {
      const { data } = await supabase
        .from('club_members')
        .select('status')
        .eq('club_id', club.id)
        .eq('user_id', user.id)
        .single();

      if (data) {
        setIsAlreadyMember(true);
        if (data.status === 'approved') {
          // Already a member, redirect to club page
          navigate('/club?tab=results');
          return;
        }
      }
    } catch (error) {
      // User is not a member, which is fine
    }
  };

  const joinClub = async () => {
    if (!user || !club) return;

    setJoining(true);
    try {
      const { error } = await supabase
        .from('club_members')
        .insert({
          club_id: club.id,
          user_id: user.id,
          status: 'approved' // Auto-approve via join link
        });

      if (error) {
        console.error('Error joining club:', error);
        toast({
          title: "Error",
          description: "Failed to join club. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: `You've successfully joined ${club.name}!`,
      });

      // Redirect to club management page with results tab
      navigate('/club?tab=results');
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to join club. Please try again.",
        variant: "destructive",
      });
    } finally {
      setJoining(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container max-w-md mx-auto px-4 pt-20">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Join {club?.name}</CardTitle>
              <CardDescription>
                Sign in to join this pickleball club
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {club && (
                <div className="text-center space-y-2">
                  {club.logo_url && (
                    <img
                      src={club.logo_url}
                      alt={`${club.name} logo`}
                      className="w-16 h-16 mx-auto rounded-full object-cover"
                    />
                  )}
                  <div className="space-y-1">
                    <p className="font-medium">{club.name}</p>
                    <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{club.location_city}, {club.location_county}</span>
                    </div>
                  </div>
                </div>
              )}
              <Button 
                onClick={() => navigate(`/auth?redirectTo=${encodeURIComponent(`/club/join/${token}`)}`)} 
                className="w-full"
              >
                Sign In to Join Club
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container max-w-md mx-auto px-4 pt-20">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Club Not Found</CardTitle>
              <CardDescription>
                The join link appears to be invalid or expired.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/')} className="w-full">
                Go Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container max-w-md mx-auto px-4 pt-20">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Join {club.name}</CardTitle>
            <CardDescription>
              {isAlreadyMember 
                ? "You're already a member of this club" 
                : "You're about to join this pickleball club"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              {club.logo_url && (
                <img
                  src={club.logo_url}
                  alt={`${club.name} logo`}
                  className="w-16 h-16 mx-auto rounded-full object-cover"
                />
              )}
              <div className="space-y-1">
                <p className="font-medium">{club.name}</p>
                <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{club.location_city}, {club.location_county}</span>
                </div>
              </div>
            </div>

            {isAlreadyMember ? (
              <Button 
                onClick={() => navigate('/club?tab=results')} 
                className="w-full"
              >
                <Users className="h-4 w-4 mr-2" />
                Go to My Clubs
              </Button>
            ) : (
              <Button 
                onClick={joinClub} 
                disabled={joining}
                className="w-full"
              >
                {joining ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4 mr-2" />
                    Join Club
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}