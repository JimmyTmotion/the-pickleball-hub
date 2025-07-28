import { supabase } from '@/integrations/supabase/client';

const FALLBACK_THUMBNAIL = 'https://uonuqhtnvleeybejigsr.supabase.co/storage/v1/object/public/event-thumbnails/thumbnails/1753648552098-58l7oybrg18.jpg';

let cachedDefaultThumbnail: string | null = null;

export const getDefaultThumbnail = async (): Promise<string> => {
  // Return cached value if available
  if (cachedDefaultThumbnail) {
    return cachedDefaultThumbnail;
  }

  try {
    const { data, error } = await supabase
      .from('admin_email_settings')
      .select('setting_value')
      .eq('setting_key', 'default_event_thumbnail')
      .maybeSingle();

    if (error) throw error;
    
    const defaultThumbnail = data?.setting_value || FALLBACK_THUMBNAIL;
    cachedDefaultThumbnail = defaultThumbnail;
    return defaultThumbnail;
  } catch (error) {
    console.error('Error fetching default thumbnail:', error);
    return FALLBACK_THUMBNAIL;
  }
};

export const clearDefaultThumbnailCache = () => {
  cachedDefaultThumbnail = null;
};