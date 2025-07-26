-- Create contact_queries table
CREATE TABLE public.contact_queries (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new',
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin_email_settings table
CREATE TABLE public.admin_email_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key TEXT NOT NULL,
    setting_value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.contact_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_email_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for contact_queries
CREATE POLICY "Anyone can create contact queries" 
ON public.contact_queries 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all contact queries" 
ON public.contact_queries 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update contact queries" 
ON public.contact_queries 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create RLS policies for admin_email_settings
CREATE POLICY "Admins can manage email settings" 
ON public.admin_email_settings 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for contact_queries updated_at
CREATE TRIGGER update_contact_queries_updated_at
    BEFORE UPDATE ON public.contact_queries
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for admin_email_settings updated_at
CREATE TRIGGER update_admin_email_settings_updated_at
    BEFORE UPDATE ON public.admin_email_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();