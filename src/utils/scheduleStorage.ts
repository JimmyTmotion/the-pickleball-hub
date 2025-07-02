import { SavedSchedule, ScheduleConfig, Schedule } from '@/types/schedule';

const STORAGE_KEY = 'paddle_schedules';

export const saveSchedule = (config: ScheduleConfig, schedule: Schedule, name?: string): SavedSchedule => {
  const savedSchedule: SavedSchedule = {
    id: crypto.randomUUID(),
    name: name || `Schedule ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
    config,
    schedule,
    createdAt: new Date(),
  };

  const existingSchedules = getSavedSchedules();
  const updatedSchedules = [savedSchedule, ...existingSchedules].slice(0, 50); // Keep only last 50
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSchedules));
  return savedSchedule;
};

export const getSavedSchedules = (): SavedSchedule[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const schedules = JSON.parse(stored);
    return schedules.map((schedule: any) => ({
      ...schedule,
      createdAt: new Date(schedule.createdAt),
    }));
  } catch (error) {
    console.error('Error loading saved schedules:', error);
    return [];
  }
};

export const deleteSchedule = (id: string): void => {
  const existingSchedules = getSavedSchedules();
  const updatedSchedules = existingSchedules.filter(schedule => schedule.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSchedules));
};

export const clearAllSchedules = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};