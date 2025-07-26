import React, { useState } from 'react';
import ScheduleForm from '@/components/ScheduleForm';
import ScheduleDisplay from '@/components/ScheduleDisplay';
import { generateSchedule } from '@/utils/scheduleGenerator';
import { saveSchedule, clearAllSchedules } from '@/utils/scheduleStorage';
import { Schedule, ScheduleConfig } from '@/types/schedule';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Zap, Users, Clock, TrendingUp, History, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navigation from '@/components/ui/navigation';

const Index = () => {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [currentConfig, setCurrentConfig] = useState<ScheduleConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Clear all schedules on component mount
  React.useEffect(() => {
    clearAllSchedules();
  }, []);

  const handleGenerateSchedule = async (config: ScheduleConfig, name?: string) => {
    setIsLoading(true);
    
    try {
      // Add a small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const newSchedule = generateSchedule(config);
      setSchedule(newSchedule);
      setCurrentConfig(config);
      
      // Auto-save to history
      await saveSchedule(config, newSchedule, name);
      
      toast({
        title: "Schedule Generated! 🎾",
        description: `Created ${newSchedule.matches.length} matches for ${config.numPlayers} players across ${config.numCourts} courts.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate schedule. Please check your inputs and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateSchedule = async () => {
    if (currentConfig) {
      handleGenerateSchedule(currentConfig);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-white">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-full">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Pickleball Scheduler
            </h1>
            <Link to="/history">
              <Button variant="outline" className="ml-4 flex items-center gap-2">
                <History className="h-4 w-4" />
                Schedule History
              </Button>
            </Link>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Create fair and balanced pickleball schedules that ensure everyone gets equal playing time 
            and optimal court utilization.
          </p>

          {/* Features */}
          <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
            <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
              <div className="w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Fair Rotation</h3>
              <p className="text-gray-600 text-sm">
                Ensures all players get equal playing time and rest periods
              </p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
              <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Time Management</h3>
              <p className="text-gray-600 text-sm">
                Optimizes court usage within your available time slots
              </p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
              <div className="w-12 h-12 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Smart Analytics</h3>
              <p className="text-gray-600 text-sm">
                Provides insights on player statistics and schedule balance
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-8 lg:grid-cols-1 xl:grid-cols-3">
          {/* Form Section */}
          <div className="xl:col-span-1">
            <ScheduleForm 
              onGenerateSchedule={handleGenerateSchedule}
              isLoading={isLoading}
            />
          </div>

          {/* Schedule Display */}
          <div className="xl:col-span-2 space-y-6">
            {schedule ? (
              <>
                {/* Regenerate Button */}
                <div className="flex justify-end">
                  <Button 
                    variant="outline" 
                    onClick={handleRegenerateSchedule}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Regenerate Schedule
                  </Button>
                </div>

                {/* Schedule Display */}
                <ScheduleDisplay schedule={schedule} scheduleName={currentConfig?.playerNames?.join(', ') || 'Generated Schedule'} />
              </>
            ) : (
              <div className="flex items-center justify-center h-64 bg-white rounded-lg border-2 border-dashed border-gray-200">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-green-100 to-blue-100 rounded-full flex items-center justify-center">
                    <Zap className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Ready to Generate Your Schedule
                  </h3>
                  <p className="text-gray-500">
                    Fill out the form and click "Generate Schedule" to create your pickleball matches.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
