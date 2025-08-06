-- Create match_results table
CREATE TABLE public.match_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id UUID NOT NULL,
  match_id INTEGER NOT NULL,
  team1_score INTEGER NOT NULL,
  team2_score INTEGER NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(schedule_id, match_id)
);

-- Enable RLS
ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;

-- Create policies for match results
CREATE POLICY "Users can view their own match results" 
ON public.match_results 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.schedules s 
    WHERE s.id = match_results.schedule_id 
    AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create match results for their schedules" 
ON public.match_results 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.schedules s 
    WHERE s.id = match_results.schedule_id 
    AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own match results" 
ON public.match_results 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.schedules s 
    WHERE s.id = match_results.schedule_id 
    AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own match results" 
ON public.match_results 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.schedules s 
    WHERE s.id = match_results.schedule_id 
    AND s.user_id = auth.uid()
  )
);

-- Club members can view club schedule results
CREATE POLICY "Club members can view club match results" 
ON public.match_results 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.schedules s
    JOIN public.club_members cm ON s.club_id = cm.club_id
    WHERE s.id = match_results.schedule_id 
    AND cm.user_id = auth.uid() 
    AND cm.status = 'approved'
    AND s.club_id IS NOT NULL
  )
);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_match_results_updated_at
BEFORE UPDATE ON public.match_results
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for better performance
CREATE INDEX idx_match_results_schedule_id ON public.match_results(schedule_id);
CREATE INDEX idx_match_results_match_id ON public.match_results(schedule_id, match_id);