
-- First, let's drop any existing tables to start fresh
DROP TABLE IF EXISTS public.internships CASCADE;
DROP TABLE IF EXISTS public.certificates CASCADE;
DROP TABLE IF EXISTS public.payment_verifications CASCADE;
DROP TABLE IF EXISTS public.analytics_data CASCADE;
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.admins CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS public.attendance_status CASCADE;
DROP TYPE IF EXISTS public.user_role CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Create enum types
CREATE TYPE public.user_role AS ENUM (
  'super_admin',
  'betting_admin', 
  'trading_admin',
  'social_admin',
  'esports_admin'
);

CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'late');

-- Create admins table with proper constraints
CREATE TABLE public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'social_admin',
  avatar TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create attendance table
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status attendance_status NOT NULL,
  reason TEXT,
  marked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  marked_by UUID REFERENCES public.admins(id),
  UNIQUE(admin_id, date)
);

-- Create chat messages table
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  file_url TEXT,
  file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create analytics data table
CREATE TABLE public.analytics_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  value DECIMAL(12,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  admin_id UUID REFERENCES public.admins(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payment verifications table
CREATE TABLE public.payment_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  transaction_id TEXT UNIQUE NOT NULL,
  amount DECIMAL(10,2),
  payment_received BOOLEAN NOT NULL DEFAULT false,
  verified_by UUID REFERENCES public.admins(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create certificates table
CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id TEXT UNIQUE NOT NULL,
  participant_name TEXT NOT NULL,
  participant_email TEXT NOT NULL,
  course_name TEXT NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  issued_by UUID NOT NULL REFERENCES public.admins(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create internships table
CREATE TABLE public.internships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intern_name TEXT NOT NULL,
  intern_email TEXT UNIQUE NOT NULL,
  intern_id TEXT UNIQUE NOT NULL,
  join_date DATE NOT NULL,
  end_date DATE,
  department TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  assigned_to UUID REFERENCES public.admins(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get current admin
CREATE OR REPLACE FUNCTION public.get_current_admin()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM public.admins WHERE user_id = auth.uid();
$$;

-- Create security definer function to check admin role
CREATE OR REPLACE FUNCTION public.check_admin_role(required_role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() AND role = required_role
  );
$$;

-- Create security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins WHERE user_id = auth.uid()
  );
$$;

-- RLS Policies for admins table
CREATE POLICY "Authenticated admins can view all admins"
  ON public.admins FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Super admins can insert admins"
  ON public.admins FOR INSERT
  TO authenticated
  WITH CHECK (public.check_admin_role('super_admin'));

CREATE POLICY "Super admins can update admins"
  ON public.admins FOR UPDATE
  TO authenticated
  USING (public.check_admin_role('super_admin'));

CREATE POLICY "Admins can update their own profile"
  ON public.admins FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for attendance table
CREATE POLICY "Admins can view all attendance"
  ON public.attendance FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can mark attendance"
  ON public.attendance FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update attendance"
  ON public.attendance FOR UPDATE
  TO authenticated
  USING (public.is_admin());

-- RLS Policies for chat messages
CREATE POLICY "Admins can view chat messages"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can send messages"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = public.get_current_admin());

-- RLS Policies for analytics data
CREATE POLICY "Admins can view analytics"
  ON public.analytics_data FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can insert analytics"
  ON public.analytics_data FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- RLS Policies for payment verifications
CREATE POLICY "Admins can view payments"
  ON public.payment_verifications FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can insert payments"
  ON public.payment_verifications FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update payments"
  ON public.payment_verifications FOR UPDATE
  TO authenticated
  USING (public.is_admin());

-- RLS Policies for certificates
CREATE POLICY "Admins can view certificates"
  ON public.certificates FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can issue certificates"
  ON public.certificates FOR INSERT
  TO authenticated
  WITH CHECK (issued_by = public.get_current_admin());

-- RLS Policies for internships
CREATE POLICY "Admins can view internships"
  ON public.internships FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can manage internships"
  ON public.internships FOR ALL
  TO authenticated
  USING (public.is_admin());

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admins (user_id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'social_admin'
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger for updated_at on admins table
CREATE TRIGGER update_admins_updated_at
  BEFORE UPDATE ON public.admins
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for all tables
ALTER TABLE public.admins REPLICA IDENTITY FULL;
ALTER TABLE public.attendance REPLICA IDENTITY FULL;
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.analytics_data REPLICA IDENTITY FULL;
ALTER TABLE public.payment_verifications REPLICA IDENTITY FULL;
ALTER TABLE public.certificates REPLICA IDENTITY FULL;
ALTER TABLE public.internships REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.admins;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.analytics_data;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_verifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.certificates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.internships;
