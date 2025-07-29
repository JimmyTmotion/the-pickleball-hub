-- Fix club notices view policy to allow club owners and members to view notices
DROP POLICY IF EXISTS "Club members can view notices" ON public.club_notices;

CREATE POLICY "Club members and owners can view notices" 
ON public.club_notices 
FOR SELECT 
USING (
  -- User is an approved member
  (EXISTS ( 
    SELECT 1
    FROM club_members cm
    WHERE cm.club_id = club_notices.club_id 
      AND cm.user_id = auth.uid() 
      AND cm.status = 'approved'
  )) OR
  -- User is the club owner
  (EXISTS (
    SELECT 1 
    FROM clubs c 
    WHERE c.id = club_notices.club_id 
      AND c.owner_id = auth.uid()
  ))
);