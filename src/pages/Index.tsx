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
import AnimatedSection from '@/components/AnimatedSection';

const Index = () => {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [currentConfig, setCurrentConfig] = useState<ScheduleConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);


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
        <AnimatedSection className="text-center mb-8" animation="fade-up">
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

    
        </AnimatedSection>

        {/* Main Content */}
        <AnimatedSection animation="fade-up" delay={100}>
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
                <ScheduleDisplay 
                  schedule={schedule} 
                  scheduleName={currentConfig?.playerNames?.join(', ') || 'Generated Schedule'}
                  onRegenerateSchedule={handleRegenerateSchedule}
                />
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
        </AnimatedSection>
      </div>
    </div>
  );
};

export default Index;
