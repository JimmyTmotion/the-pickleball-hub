import { supabase } from '@/integrations/supabase/client';
import { migrateExistingScheduleResults } from './matchResults';

export const runResultsMigration = async (): Promise<void> => {
  try {
    console.log('Starting results migration...');
    await migrateExistingScheduleResults();
    console.log('Results migration completed successfully');
  } catch (error) {
    console.error('Results migration failed:', error);
    throw error;
  }
};

// Function to check if migration is needed
export const checkMigrationStatus = async (): Promise<boolean> => {
  try {
    // Check if there are any match results in the new table
    const { count } = await supabase
      .from('match_results')
      .select('*', { count: 'exact', head: true });
    
    // Check if there are schedules with results in the old format
    const { data: schedules } = await supabase
      .from('schedules')
      .select('schedule')
      .limit(5);
    
    const hasOldResults = schedules?.some(schedule => {
      const scheduleData = schedule.schedule as any;
      return scheduleData?.matches?.some((match: any) => match.result);
    });
    
    // Migration is needed if there are old results but no new results
    return hasOldResults && (count === 0);
  } catch (error) {
    console.error('Error checking migration status:', error);
    return false;
  }
};