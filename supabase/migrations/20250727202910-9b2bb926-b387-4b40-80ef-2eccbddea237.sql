-- Create storage bucket for event thumbnails
INSERT INTO storage.buckets (id, name, public) 
VALUES ('event-thumbnails', 'event-thumbnails', true);

-- Create policies for event thumbnail uploads
CREATE POLICY "Event thumbnails are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'event-thumbnails');

CREATE POLICY "Admins can upload event thumbnails" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'event-thumbnails' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update event thumbnails" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'event-thumbnails' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete event thumbnails" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'event-thumbnails' AND has_role(auth.uid(), 'admin'::app_role));