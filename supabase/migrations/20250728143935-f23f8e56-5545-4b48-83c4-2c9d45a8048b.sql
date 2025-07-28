-- Insert default thumbnail setting if it doesn't exist
INSERT INTO public.admin_email_settings (setting_key, setting_value)
VALUES ('default_event_thumbnail', 'https://uonuqhtnvleeybejigsr.supabase.co/storage/v1/object/public/event-thumbnails/thumbnails/1753648552098-58l7oybrg18.jpg')
ON CONFLICT (setting_key) DO NOTHING;