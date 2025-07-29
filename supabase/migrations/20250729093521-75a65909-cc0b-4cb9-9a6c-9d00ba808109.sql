-- Create clubs table
CREATE TABLE public.clubs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location_city TEXT NOT NULL,
  location_county TEXT NOT NULL,
  logo_url TEXT,
  owner_id UUID NOT NULL,
  auto_join_token UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(auto_join_token)
);

-- Create club_members table
CREATE TABLE public.club_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(club_id, user_id)
);

-- Create club_subgroups table
CREATE TABLE public.club_subgroups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create club_subgroup_members table
CREATE TABLE public.club_subgroup_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subgroup_id UUID NOT NULL REFERENCES public.club_subgroups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(subgroup_id, user_id)
);

-- Create club_notices table
CREATE TABLE public.club_notices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create club_faqs table
CREATE TABLE public.club_faqs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_subgroups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_subgroup_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_faqs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clubs
CREATE POLICY "Anyone can view clubs" ON public.clubs FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create clubs" ON public.clubs FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Club owners can update their clubs" ON public.clubs FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Club owners can delete their clubs" ON public.clubs FOR DELETE USING (auth.uid() = owner_id);

-- RLS Policies for club_members
CREATE POLICY "Club members can view memberships" ON public.club_members FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.club_members cm 
    WHERE cm.club_id = club_members.club_id 
    AND cm.user_id = auth.uid() 
    AND cm.status = 'approved'
  ) OR 
  EXISTS (
    SELECT 1 FROM public.clubs c 
    WHERE c.id = club_members.club_id 
    AND c.owner_id = auth.uid()
  )
);
CREATE POLICY "Users can apply to join clubs" ON public.club_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Club owners can manage memberships" ON public.club_members FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.clubs c 
    WHERE c.id = club_members.club_id 
    AND c.owner_id = auth.uid()
  )
);
CREATE POLICY "Club owners can remove members" ON public.club_members FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.clubs c 
    WHERE c.id = club_members.club_id 
    AND c.owner_id = auth.uid()
  )
);

-- RLS Policies for club_subgroups
CREATE POLICY "Club members can view subgroups" ON public.club_subgroups FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.club_members cm 
    WHERE cm.club_id = club_subgroups.club_id 
    AND cm.user_id = auth.uid() 
    AND cm.status = 'approved'
  )
);
CREATE POLICY "Club owners can manage subgroups" ON public.club_subgroups FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.clubs c 
    WHERE c.id = club_subgroups.club_id 
    AND c.owner_id = auth.uid()
  )
);

-- RLS Policies for club_subgroup_members
CREATE POLICY "Club members can view subgroup memberships" ON public.club_subgroup_members FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.club_subgroups cs
    JOIN public.club_members cm ON cs.club_id = cm.club_id
    WHERE cs.id = club_subgroup_members.subgroup_id 
    AND cm.user_id = auth.uid() 
    AND cm.status = 'approved'
  )
);
CREATE POLICY "Club members can join subgroups" ON public.club_subgroup_members FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.club_subgroups cs
    JOIN public.club_members cm ON cs.club_id = cm.club_id
    WHERE cs.id = club_subgroup_members.subgroup_id 
    AND cm.user_id = auth.uid() 
    AND cm.status = 'approved'
  )
);

-- RLS Policies for club_notices
CREATE POLICY "Club members can view notices" ON public.club_notices FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.club_members cm 
    WHERE cm.club_id = club_notices.club_id 
    AND cm.user_id = auth.uid() 
    AND cm.status = 'approved'
  )
);
CREATE POLICY "Club members can create notices" ON public.club_notices FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.club_members cm 
    WHERE cm.club_id = club_notices.club_id 
    AND cm.user_id = auth.uid() 
    AND cm.status = 'approved'
  )
);
CREATE POLICY "Notice authors can update their notices" ON public.club_notices FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Notice authors and club owners can delete notices" ON public.club_notices FOR DELETE USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.clubs c 
    WHERE c.id = club_notices.club_id 
    AND c.owner_id = auth.uid()
  )
);

-- RLS Policies for club_faqs
CREATE POLICY "Club members can view FAQs" ON public.club_faqs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.club_members cm 
    WHERE cm.club_id = club_faqs.club_id 
    AND cm.user_id = auth.uid() 
    AND cm.status = 'approved'
  ) OR
  EXISTS (
    SELECT 1 FROM public.clubs c 
    WHERE c.id = club_faqs.club_id
  )
);
CREATE POLICY "Club owners can manage FAQs" ON public.club_faqs FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.clubs c 
    WHERE c.id = club_faqs.club_id 
    AND c.owner_id = auth.uid()
  )
);

-- Create triggers for updated_at
CREATE TRIGGER update_clubs_updated_at
  BEFORE UPDATE ON public.clubs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_club_notices_updated_at
  BEFORE UPDATE ON public.club_notices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();