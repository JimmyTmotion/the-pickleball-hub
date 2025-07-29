-- Allow club members to view schedules associated with their clubs
CREATE POLICY "Club members can view club schedules" 
ON public.schedules 
FOR SELECT 
USING (
  -- User can view schedules they created (existing policy logic)
  auth.uid() = user_id 
  OR 
  -- User can view schedules associated with clubs they're approved members of
  (
    club_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 
      FROM club_members cm 
      WHERE cm.club_id = schedules.club_id 
        AND cm.user_id = auth.uid() 
        AND cm.status = 'approved'
    )
  )
);

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view their own schedules" ON public.schedules;