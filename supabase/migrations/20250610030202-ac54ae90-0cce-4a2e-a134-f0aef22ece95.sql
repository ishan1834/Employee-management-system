-- Drop existing tables
DROP TABLE IF EXISTS public.internships CASCADE;
DROP TABLE IF EXISTS public.certificates CASCADE;
DROP TABLE IF EXISTS public.payment_verifications CASCADE;
DROP TABLE IF EXISTS public.analytics_data CASCADE;
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.admins CASCADE;

-- Drop types
DROP TYPE IF EXISTS public.attendance_status CASCADE;
DROP TYPE IF EXISTS public.user_role CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Create enums
CREATE TYPE public.user_role AS ENUM (
  'super_admin',
  'betting_admin', 
  'trading_admin',
  'social_admin',
  'esports_admin'
);

CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'late');
