-- Add missing columns to attendance table
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS marked_by UUID REFERENCES public.admins(id) ON DELETE SET NULL;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS marked_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add missing columns to certificates table for compatibility
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS certificate_id TEXT;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS participant_name TEXT;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS participant_email TEXT;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS course_name TEXT;
