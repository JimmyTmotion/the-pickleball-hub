-- Add event_link field to events table
ALTER TABLE public.events 
ADD COLUMN event_link TEXT;