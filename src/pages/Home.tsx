import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, BarChart3, Trophy, Clock, TrendingUp, Shield, LogOut, User, Wrench, GraduationCap, CalendarDays } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import EventList from '@/components/EventList';
import Navigation from '@/components/ui/navigation';

const Home = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-white">
      <Navigation />
      <div className="container mx-auto px-4 py-8">

        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-4 bg-gradient-to-r from-green-500 to-blue-500 rounded-full">
              <Trophy className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              The Pickleball Hub
            </h1>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-12">
          <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
            <div className="w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <Wrench className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Tools</h3>
            <p className="text-gray-600 text-sm">
              Essential pickleball tools for scheduling, timing, and tournament management
            </p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
            <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Coaching</h3>
            <p className="text-gray-600 text-sm">
              Professional coaching services and training programs for all skill levels
            </p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
            <div className="w-12 h-12 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
              <CalendarDays className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Events</h3>
            <p className="text-gray-600 text-sm">
              Discover and participate in local tournaments and pickleball events
            </p>
          </div>
        </div>

        {/* Pickleball Tools Section */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Pickleball Tools
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Essential tools for organizing and managing your pickleball activities
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto mb-8">
            <Card className="hover:shadow-lg transition-shadow">
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

            <Card className="hover:shadow-lg transition-shadow">
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
          </div>

          <div className="text-center">
            <Link to="/history">
              <Button variant="outline" className="flex items-center gap-2 mx-auto">
                <BarChart3 className="h-4 w-4" />
                View Match Results & Analytics
              </Button>
            </Link>
          </div>
        </div>

        {/* Upcoming Events Section */}
        <div className="mb-12">
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
        </div>

      </div>
    </div>
  );
};

export default Home;