import { SavedSchedule, ScheduleConfig, Schedule, MatchResult } from '@/types/schedule';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'paddle_schedules';

export const saveSchedule = async (config: ScheduleConfig, schedule: Schedule, name?: string): Promise<SavedSchedule> => {
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

  const savedSchedule: SavedSchedule = {
    id: crypto.randomUUID(),
    name: name || `Schedule ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
    config,
    schedule,
    createdAt: new Date(),
    createdBy: {
      id: user.id,
      name: profile?.full_name || user.email || 'Unknown User',
      email: profile?.email || user.email || '',
    },
  };

  const existingSchedules = await getSavedSchedules();
  const updatedSchedules = [savedSchedule, ...existingSchedules].slice(0, 50); // Keep only last 50
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSchedules));
  return savedSchedule;
};

export const getSavedSchedules = async (): Promise<SavedSchedule[]> => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const schedules = JSON.parse(stored);
    return schedules
      .filter((schedule: any) => schedule.createdBy?.id === user.id)
      .map((schedule: any) => ({
        ...schedule,
        createdAt: new Date(schedule.createdAt),
      }));
  } catch (error) {
    console.error('Error loading saved schedules:', error);
    return [];
  }
};

export const deleteSchedule = async (id: string): Promise<void> => {
  const existingSchedules = await getSavedSchedules();
  const updatedSchedules = existingSchedules.filter(schedule => schedule.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSchedules));
};

export const updateScheduleName = async (id: string, name: string): Promise<void> => {
  const existingSchedules = await getSavedSchedules();
  const updatedSchedules = existingSchedules.map(schedule => 
    schedule.id === id ? { ...schedule, name } : schedule
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSchedules));
};

export const updateMatchResult = async (scheduleId: string, matchId: number, result: MatchResult): Promise<void> => {
  const existingSchedules = await getSavedSchedules();
  const updatedSchedules = existingSchedules.map(savedSchedule => {
    if (savedSchedule.id === scheduleId) {
      const updatedMatches = savedSchedule.schedule.matches.map(match => 
        match.id === matchId ? { ...match, result } : match
      );
      return {
        ...savedSchedule,
        schedule: {
          ...savedSchedule.schedule,
          matches: updatedMatches
        }
      };
    }
    return savedSchedule;
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSchedules));
};

export const clearAllSchedules = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};