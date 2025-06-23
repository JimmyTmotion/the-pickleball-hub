
import React, { useState } from 'react';
import ScheduleForm from '@/components/ScheduleForm';
import ScheduleDisplay from '@/components/ScheduleDisplay';
import { generateSchedule } from '@/utils/scheduleGenerator';
import { Schedule, ScheduleConfig } from '@/types/schedule';
import { toast } from '@/hooks/use-toast';
import { Zap } from 'lucide-react';

const Index = () => {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateSchedule = async (config: ScheduleConfig) => {
    setIsLoading(true);
    
    try {
      // Add a small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newSchedule = generateSchedule(config);
      setSchedule(newSchedule);
      
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-white">
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
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Create fair and balanced pickleball schedules that ensure everyone gets equal playing time 
            and optimal court utilization.
          </p>
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
          <div className="xl:col-span-2">
            {schedule ? (
              <ScheduleDisplay schedule={schedule} />
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

        {/* Features */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
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
    </div>
  );
};

export default Index;
