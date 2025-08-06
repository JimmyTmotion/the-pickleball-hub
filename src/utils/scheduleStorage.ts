import { SavedSchedule, ScheduleConfig, Schedule, MatchResult } from '@/types/schedule';
import { supabase } from '@/integrations/supabase/client';

export const saveSchedule = async (config: ScheduleConfig, schedule: Schedule, name?: string, clubId?: string, subgroupId?: string): Promise<SavedSchedule> => {
  // Get current user info
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User must be logged in to save schedules');
  }

  // Get user profile for name
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('user_id', user.id)
    .single();

  const scheduleName = name || `Schedule ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;

  // Insert into database with club and subgroup assignment
  const { data, error } = await supabase
    .from('schedules')
    .insert({
      name: scheduleName,
      config: config as any,
      schedule: schedule as any,
      user_id: user.id,
      club_id: clubId || null,
      subgroup_id: subgroupId || null
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save schedule: ${error.message}`);
  }

  // Return the saved schedule in the expected format
  const savedSchedule: SavedSchedule = {
    id: data.id,
    name: data.name,
    config: data.config as unknown as ScheduleConfig,
    schedule: data.schedule as unknown as Schedule,
    createdAt: new Date(data.created_at),
    createdBy: {
      id: user.id,
      name: profile?.full_name || user.email || 'Unknown User',
      email: profile?.email || user.email || '',
    },
  };

  return savedSchedule;
};

export const getSavedSchedules = async (): Promise<SavedSchedule[]> => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Get user profile for name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('user_id', user.id)
      .single();

    // Fetch schedules from database
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading saved schedules:', error);
      return [];
    }

    // Fetch match results separately for each schedule
    const schedulesWithResults = await Promise.all(
      data.map(async (schedule) => {
        const { data: results } = await supabase
          .from('match_results')
          .select('match_id, team1_score, team2_score, completed')
          .eq('schedule_id', schedule.id);
        
        return { ...schedule, match_results: results || [] };
      })
    );

    return schedulesWithResults.map((schedule) => {
      const scheduleData = schedule.schedule as unknown as Schedule;
      
      // Apply match results to schedule matches
      const matchesWithResults = scheduleData.matches.map(match => {
        const result = schedule.match_results?.find((r: any) => r.match_id === match.id);
        return {
          ...match,
          result: result ? {
            team1Score: result.team1_score,
            team2Score: result.team2_score,
            completed: result.completed
          } : undefined
        };
      });

      return {
        id: schedule.id,
        name: schedule.name,
        config: schedule.config as unknown as ScheduleConfig,
        schedule: {
          ...scheduleData,
          matches: matchesWithResults
        },
        createdAt: new Date(schedule.created_at),
        createdBy: {
          id: user.id,
          name: profile?.full_name || user.email || 'Unknown User',
          email: profile?.email || user.email || '',
        },
        club_id: schedule.club_id,
        subgroup_id: schedule.subgroup_id,
      };
    });
  } catch (error) {
    console.error('Error loading saved schedules:', error);
    return [];
  }
};

export const deleteSchedule = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('schedules')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete schedule: ${error.message}`);
  }
};

export const updateScheduleName = async (id: string, name: string): Promise<void> => {
  const { error } = await supabase
    .from('schedules')
    .update({ name })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to update schedule name: ${error.message}`);
  }
};

export const updateMatchResult = async (scheduleId: string, matchId: number, result: MatchResult): Promise<void> => {
  // Save to match_results table
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
    throw new Error(`Failed to update match result: ${error.message}`);
  }
};

export const updatePlayerNames = async (scheduleId: string, playerNames: Record<number, string>): Promise<void> => {
  // First, get the current schedule
  const { data: currentData, error: fetchError } = await supabase
    .from('schedules')
    .select('schedule, config')
    .eq('id', scheduleId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch schedule: ${fetchError.message}`);
  }

  const schedule = currentData.schedule as unknown as Schedule;
  const config = currentData.config as unknown as ScheduleConfig;
  
  // Update player names in matches
  const updatedMatches = schedule.matches.map(match => ({
    ...match,
    players: match.players.map(player => ({
      ...player,
      name: playerNames[player.id] || player.name
    }))
  }));

  // Update player names in statistics
  const updatedPlayerStats = schedule.playerStats.map(stat => ({
    ...stat,
    playerName: playerNames[stat.playerId] || stat.playerName
  }));

  // Update player names in sitting out records
  const updatedRoundSittingOut: Record<number, any[]> = {};
  Object.entries(schedule.roundSittingOut).forEach(([round, players]) => {
    updatedRoundSittingOut[parseInt(round)] = players.map(player => ({
      ...player,
      name: playerNames[player.id] || player.name
    }));
  });

  // Update config player names if they exist
  const updatedConfig = {
    ...config,
    playerNames: config.playerNames?.map((name, index) => {
      const playerId = index + 1; // Player IDs are 1-indexed
      return playerNames[playerId] || name;
    })
  };

  const updatedSchedule = {
    ...schedule,
    matches: updatedMatches,
    playerStats: updatedPlayerStats,
    roundSittingOut: updatedRoundSittingOut
  };

  // Save the updated schedule and config back to the database
  const { error: updateError } = await supabase
    .from('schedules')
    .update({ 
      schedule: updatedSchedule as any,
      config: updatedConfig as any
    })
    .eq('id', scheduleId);

  if (updateError) {
    throw new Error(`Failed to update player names: ${updateError.message}`);
  }
};

export const updateSchedule = async (scheduleId: string, schedule: Schedule): Promise<void> => {
  // Save the updated schedule to the database
  const { error: updateError } = await supabase
    .from('schedules')
    .update({ schedule: schedule as any })
    .eq('id', scheduleId);

  if (updateError) {
    throw new Error(`Failed to update schedule: ${updateError.message}`);
  }
};

export const clearAllSchedules = async (): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User must be logged in to clear schedules');
  }

  const { error } = await supabase
    .from('schedules')
    .delete()
    .eq('user_id', user.id);

  if (error) {
    throw new Error(`Failed to clear schedules: ${error.message}`);
  }
};