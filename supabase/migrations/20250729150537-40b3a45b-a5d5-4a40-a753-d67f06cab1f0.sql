-- Add foreign key relationship between club_members and profiles
ALTER TABLE public.club_members 
ADD CONSTRAINT club_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);

-- Insert the existing club owner as an approved member (for the current club)
INSERT INTO public.club_members (club_id, user_id, status)
SELECT id, owner_id, 'approved'
FROM public.clubs 
WHERE owner_id = '68cfa73d-230e-417b-b0b4-cff27ec60c3d'
AND id NOT IN (SELECT club_id FROM public.club_members WHERE user_id = '68cfa73d-230e-417b-b0b4-cff27ec60c3d');