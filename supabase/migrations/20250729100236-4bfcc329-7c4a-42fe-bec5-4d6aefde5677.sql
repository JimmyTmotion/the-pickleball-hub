-- Fix function search path security issue
CREATE OR REPLACE FUNCTION public.handle_new_club_owner()
RETURNS TRIGGER AS $$
BEGIN
  -- Add the club owner as an approved member
  INSERT INTO public.club_members (club_id, user_id, status)
  VALUES (NEW.id, NEW.owner_id, 'approved');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';