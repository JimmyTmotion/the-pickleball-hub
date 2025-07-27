import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, BarChart3, Trophy, Clock, TrendingUp, Shield, LogOut, User, Wrench, GraduationCap, CalendarDays } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import EventList from '@/components/EventList';
import Navigation from '@/components/ui/navigation';
import AnimatedSection from '@/components/AnimatedSection';
import { HeroSkeleton, FeatureCardsSkeleton, ToolCardsSkeleton, EventsSkeleton } from '@/components/LoadingSkeleton';


const Home = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [pageLoading, setPageLoading] = useState(true);
  const [heroImageLoaded, setHeroImageLoaded] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  // Simulate initial page load with a nice loading sequence
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  if (loading || pageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-white">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <HeroSkeleton />
          <FeatureCardsSkeleton />
          <ToolCardsSkeleton />
          <EventsSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-white">
      <Navigation />
      <div className="container mx-auto px-4 py-8">

        {/* Hero Section */}
        <AnimatedSection animation="fade-in" className="mb-12">
          <div className="relative w-full h-64 md:h-80 lg:h-96 rounded-2xl overflow-hidden shadow-2xl">
            <img 
              src="/lovable-uploads/15d683bb-35ab-4c1d-8578-248581ef17fa.png" 
              alt="Pickleball paddle and ball on court" 
              className={`w-full h-full object-cover object-center transition-opacity duration-1000 ${
                heroImageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setHeroImageLoaded(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
          </div>
        </AnimatedSection>

        <AnimatedSection animation="fade-up" delay={200} className="grid gap-6 md:grid-cols-3 mb-12">
          <div className="text-center p-6 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-300">
            <div className="w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <Wrench className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Tools</h3>
            <p className="text-gray-600 text-sm">
              Essential pickleball tools for scheduling, timing, and tournament management
            </p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-300">
            <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Coaching</h3>
            <p className="text-gray-600 text-sm">
              Professional coaching services and training programs for all skill levels
            </p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-300">
            <div className="w-12 h-12 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
              <CalendarDays className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Events</h3>
            <p className="text-gray-600 text-sm">
              Discover and participate in local tournaments and pickleball events
            </p>
          </div>
        </AnimatedSection>

        {/* Pickleball Tools Section */}
        <AnimatedSection animation="fade-up" delay={400} className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Pickleball Tools
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Essential tools for organizing and managing your pickleball activities
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto mb-8">
            <AnimatedSection animation="scale-in" delay={600}>
              <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <Calendar className="h-8 w-8 text-green-600" />
                    Pickleball Scheduler
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-6">
                    Create fair and balanced pickleball schedules that ensure everyone gets equal 
                    playing time and optimal court utilization with smart analytics.
                  </p>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      Fair rotation system
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      Optimized time management
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <TrendingUp className="h-4 w-4" />
                      Partnership & opponent analytics
                    </div>
                  </div>
                  <Link to="/scheduler">
                    <Button className="w-full">
                      Create Schedule
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </AnimatedSection>

            <AnimatedSection animation="scale-in" delay={800}>
              <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <Clock className="h-8 w-8 text-purple-600" />
                    Match Timer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-6">
                    Keep track of match time with a large, easy-to-read timer. Perfect for 
                    timed matches with customisable duration and audio alerts.
                  </p>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      Customisable duration
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Trophy className="h-4 w-4" />
                      Fullscreen mode
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <BarChart3 className="h-4 w-4" />
                      Audio & visual alerts
                    </div>
                  </div>
                  <Link to="/timer">
                    <Button variant="secondary" className="w-full">
                      Start Timer
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </AnimatedSection>

            <AnimatedSection animation="scale-in" delay={1000}>
              <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <BarChart3 className="h-8 w-8 text-blue-600" />
                    Match Results & Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-6">
                    View detailed analytics from your previous matches including player statistics, 
                    partnership data, and performance trends over time.
                  </p>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <TrendingUp className="h-4 w-4" />
                      Performance analytics
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      Partnership insights
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Trophy className="h-4 w-4" />
                      Match history tracking
                    </div>
                  </div>
                  <Link to="/history">
                    <Button variant="outline" className="w-full">
                      View Analytics
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </AnimatedSection>
          </div>
        </AnimatedSection>

        {/* Upcoming Events Section */}
        <AnimatedSection animation="fade-up" delay={1200} className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Upcoming Events
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Stay up to date with the latest pickleball tournaments and events
            </p>
          </div>
          
          <div className="mb-6">
            <EventList />
          </div>
        </AnimatedSection>

      </div>
    </div>
  );
};

export default Home;