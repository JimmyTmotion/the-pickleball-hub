-- Add foreign key relationship between club_subgroup_members and profiles
ALTER TABLE public.club_subgroup_members 
ADD CONSTRAINT club_subgroup_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);