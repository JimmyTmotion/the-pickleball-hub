-- Create storage bucket for club logos
INSERT INTO storage.buckets (id, name, public) VALUES ('club-logos', 'club-logos', true);

-- Create policies for club logo uploads
CREATE POLICY "Club logos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'club-logos');

CREATE POLICY "Authenticated users can upload club logos" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'club-logos');

CREATE POLICY "Club owners can update their logos" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (bucket_id = 'club-logos');

CREATE POLICY "Club owners can delete their logos" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (bucket_id = 'club-logos');