import { Event, EventType, MatchType } from '@/types/event';

const EVENTS_STORAGE_KEY = 'pickleball_events';

export const saveEvent = async (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> => {
  const events = getEvents();
  const newEvent: Event = {
    ...eventData,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  events.push(newEvent);
  localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
  return newEvent;
};

export const getEvents = (): Event[] => {
  const stored = localStorage.getItem(EVENTS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const getEventById = (id: string): Event | null => {
  const events = getEvents();
  return events.find(event => event.id === id) || null;
};

export const updateEvent = async (id: string, updates: Partial<Event>): Promise<Event | null> => {
  const events = getEvents();
  const index = events.findIndex(event => event.id === id);
  
  if (index === -1) return null;
  
  events[index] = {
    ...events[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
  return events[index];
};

export const deleteEvent = async (id: string): Promise<boolean> => {
  const events = getEvents();
  const filteredEvents = events.filter(event => event.id !== id);
  
  if (filteredEvents.length === events.length) return false;
  
  localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(filteredEvents));
  return true;
};

export const getUpcomingEvents = (): Event[] => {
  const events = getEvents();
  const now = new Date();
  
  return events
    .filter(event => new Date(event.startDate) >= now)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
};

export const clearAllEvents = (): void => {
  localStorage.removeItem(EVENTS_STORAGE_KEY);
};