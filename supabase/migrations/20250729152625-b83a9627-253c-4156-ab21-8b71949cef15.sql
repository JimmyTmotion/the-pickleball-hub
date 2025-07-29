-- Add club_id and subgroup_id columns to schedules table
ALTER TABLE public.schedules 
ADD COLUMN club_id UUID REFERENCES public.clubs(id),
ADD COLUMN subgroup_id UUID REFERENCES public.club_subgroups(id);

-- Add index for better performance
CREATE INDEX idx_schedules_club_id ON public.schedules(club_id);
CREATE INDEX idx_schedules_subgroup_id ON public.schedules(subgroup_id);