-- Create events table for pickleball events
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  start_time TIME,
  end_time TIME,
  event_type TEXT NOT NULL CHECK (event_type IN ('Tournament', 'Social', 'League', 'Nationals', 'Other', 'Regular Recreational', 'Festival')),
  match_types TEXT[] NOT NULL DEFAULT '{}', -- Array to store multiple match types
  thumbnail TEXT,
  prize TEXT,
  rating_required TEXT,
  indoor_outdoor BOOLEAN, -- true for indoor, false for outdoor, null for not specified
  additional_info TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view events (public access)
CREATE POLICY "Anyone can view events" 
ON public.events 
FOR SELECT 
USING (true);

-- Only admins can create events
CREATE POLICY "Admins can create events" 
ON public.events 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update events
CREATE POLICY "Admins can update events" 
ON public.events 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete events
CREATE POLICY "Admins can delete events" 
ON public.events 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();