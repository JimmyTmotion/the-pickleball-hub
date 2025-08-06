import { supabase } from '@/integrations/supabase/client';
import { MatchResult } from '@/types/schedule';

export const saveMatchResult = async (
  scheduleId: string, 
  matchId: number, 
  result: MatchResult
): Promise<void> => {
  const { error } = await supabase
    .from('match_results')
    .upsert({
      schedule_id: scheduleId,
      match_id: matchId,
      team1_score: result.team1Score,
      team2_score: result.team2Score,
      completed: result.completed
    });

  if (error) {
    throw new Error(`Failed to save match result: ${error.message}`);
  }
};

export const getMatchResults = async (scheduleId: string): Promise<Record<number, MatchResult>> => {
  const { data, error } = await supabase
    .from('match_results')
    .select('*')
    .eq('schedule_id', scheduleId);

  if (error) {
    throw new Error(`Failed to get match results: ${error.message}`);
  }

  const results: Record<number, MatchResult> = {};
  data?.forEach(result => {
    results[result.match_id] = {
      team1Score: result.team1_score,
      team2Score: result.team2_score,
      completed: result.completed
    };
  });

  return results;
};

export const deleteMatchResults = async (scheduleId: string): Promise<void> => {
  const { error } = await supabase
    .from('match_results')
    .delete()
    .eq('schedule_id', scheduleId);

  if (error) {
    throw new Error(`Failed to delete match results: ${error.message}`);
  }
};

export const migrateExistingScheduleResults = async (): Promise<void> => {
  // Get all schedules with results in the schedule data
  const { data: schedules, error } = await supabase
    .from('schedules')
    .select('id, schedule');

  if (error) {
    console.error('Error fetching schedules for migration:', error);
    return;
  }

  for (const schedule of schedules || []) {
    const scheduleData = schedule.schedule as any;
    const matches = scheduleData?.matches || [];
    
    // Extract results from matches and save to match_results table
    for (const match of matches) {
      if (match.result) {
        try {
          await saveMatchResult(schedule.id, match.id, match.result);
        } catch (error) {
          console.error(`Failed to migrate result for match ${match.id}:`, error);
        }
      }
    }
  }
};