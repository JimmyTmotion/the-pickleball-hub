-- Add foreign key relationship between club_notices and profiles
ALTER TABLE public.club_notices 
ADD CONSTRAINT club_notices_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);

-- Add foreign key relationship between club_faqs and clubs (if not exists)
-- This ensures the RLS policies work correctly
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'club_faqs_club_id_fkey'
    ) THEN
        ALTER TABLE public.club_faqs 
        ADD CONSTRAINT club_faqs_club_id_fkey 
        FOREIGN KEY (club_id) REFERENCES public.clubs(id);
    END IF;
END $$;