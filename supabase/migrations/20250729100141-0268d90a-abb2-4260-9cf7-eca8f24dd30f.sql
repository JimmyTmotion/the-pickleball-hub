-- Fix club notices RLS policy to allow club owners to create notices
DROP POLICY IF EXISTS "Club members can create notices" ON public.club_notices;

CREATE POLICY "Club members and owners can create notices" 
ON public.club_notices 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) AND 
  (
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
  )
);

-- Create function to automatically add club owner as approved member
CREATE OR REPLACE FUNCTION public.handle_new_club_owner()
RETURNS TRIGGER AS $$
BEGIN
  -- Add the club owner as an approved member
  INSERT INTO public.club_members (club_id, user_id, status)
  VALUES (NEW.id, NEW.owner_id, 'approved');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-add club owner as member when club is created
CREATE TRIGGER on_club_created
  AFTER INSERT ON public.clubs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_club_owner();

-- Add policies for subgroup management
CREATE POLICY "Club owners can manage subgroup members" 
ON public.club_subgroup_members 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM club_subgroups cs
    JOIN clubs c ON cs.club_id = c.id
    WHERE cs.id = club_subgroup_members.subgroup_id 
      AND c.owner_id = auth.uid()
  )
);

CREATE POLICY "Club owners can delete subgroup members" 
ON public.club_subgroup_members 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 
    FROM club_subgroups cs
    JOIN clubs c ON cs.club_id = c.id
    WHERE cs.id = club_subgroup_members.subgroup_id 
      AND c.owner_id = auth.uid()
  )
);

-- Allow users to leave subgroups
CREATE POLICY "Users can leave subgroups" 
ON public.club_subgroup_members 
FOR DELETE 
USING (auth.uid() = user_id);