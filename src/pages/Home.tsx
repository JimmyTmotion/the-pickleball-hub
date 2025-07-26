import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, BarChart3, Trophy, Clock, TrendingUp, Shield, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

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
      <div className="container mx-auto px-4 py-8">
        {/* Header with Auth */}
        <div className="flex justify-between items-center mb-8">
          <div></div>
          <div className="flex gap-2">
            {user ? (
              <>
                {isAdmin && (
                  <Button asChild variant="outline" size="sm">
                    <Link to="/admin">
                      <Shield className="h-4 w-4 mr-2" />
                      Admin
                    </Link>
                  </Button>
                )}
                <Button onClick={handleSignOut} variant="outline" size="sm">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Button asChild size="sm">
                <Link to="/auth">Sign In</Link>
              </Button>
            )}
          </div>
        </div>

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
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Your complete solution for organizing pickleball tournaments, tracking matches, 
            and managing leagues with intelligent scheduling and comprehensive analytics.
          </p>
        </div>

        {/* Main Tools */}
        <div className="grid gap-8 md:grid-cols-2 mb-12">
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
                <BarChart3 className="h-8 w-8 text-blue-600" />
                Match Results & Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">
                Track match results, generate league tables, and view comprehensive analytics 
                across all your tournament schedules and player performances.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Trophy className="h-4 w-4" />
                  League standings
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="h-4 w-4" />
                  Player statistics
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <BarChart3 className="h-4 w-4" />
                  Historical analysis
                </div>
              </div>
              <Link to="/history">
                <Button variant="outline" className="w-full">
                  View Results
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Everything You Need for Pickleball Organization
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            From intelligent scheduling to comprehensive match tracking, 
            we've got all the tools to make your pickleball events successful.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
            <div className="w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Smart Scheduling</h3>
            <p className="text-gray-600 text-sm">
              Advanced algorithms ensure fair rotation and balanced matchups for all players
            </p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
            <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Detailed Analytics</h3>
            <p className="text-gray-600 text-sm">
              Track partnerships, opponents, wins, losses, and player performance over time
            </p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
            <div className="w-12 h-12 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
              <Trophy className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">League Management</h3>
            <p className="text-gray-600 text-sm">
              Complete tournament management with league tables and historical records
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;