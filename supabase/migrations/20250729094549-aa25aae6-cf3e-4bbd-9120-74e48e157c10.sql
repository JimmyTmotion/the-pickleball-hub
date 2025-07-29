-- Fix infinite recursion in club_members RLS policies
-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Club members can view memberships" ON public.club_members;

-- Create new policy that doesn't cause recursion
CREATE POLICY "Users can view memberships they're involved in" ON public.club_members FOR SELECT USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.clubs c 
    WHERE c.id = club_members.club_id 
    AND c.owner_id = auth.uid()
  )
);