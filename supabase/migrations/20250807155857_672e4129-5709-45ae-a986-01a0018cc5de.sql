CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'betting_admin', 'trading_admin', 'social_admin', 'esports_admin')),
  avatar TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.admins(id) ON DELETE CASCADE NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  reason TEXT,
  marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  marked_by UUID REFERENCES public.admins(id)
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES public.admins(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  file_url TEXT,
  file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.analytics_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  date DATE DEFAULT CURRENT_DATE,
  admin_id UUID REFERENCES public.admins(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payment_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  transaction_id TEXT NOT NULL UNIQUE,
  amount NUMERIC DEFAULT 0,
  payment_received BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES public.admins(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id TEXT NOT NULL UNIQUE,
  participant_name TEXT NOT NULL,
  participant_email TEXT NOT NULL,
  course_name TEXT NOT NULL,
  issue_date DATE DEFAULT CURRENT_DATE,
  issued_by UUID REFERENCES public.admins(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.internships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intern_name TEXT NOT NULL,
  intern_email TEXT NOT NULL,
  intern_id TEXT NOT NULL UNIQUE,
  join_date DATE NOT NULL,
  end_date DATE,
  department TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'terminated')),
  assigned_to UUID REFERENCES public.admins(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.esports_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name TEXT NOT NULL,
  game_uid TEXT NOT NULL,
  email TEXT NOT NULL,
  tournament_name TEXT NOT NULL,
  entry_fees NUMERIC NOT NULL DEFAULT 0,
  payment_received BOOLEAN DEFAULT false,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.social_media_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_account_link TEXT NOT NULL,
  service_type TEXT NOT NULL CHECK (service_type IN ('instagram', 'youtube', 'facebook', 'telegram', 'twitter')),
  order_type TEXT NOT NULL CHECK (order_type IN ('likes', 'followers', 'comments', 'views')),
  quantity INTEGER NOT NULL DEFAULT 0,
  payment_amount NUMERIC NOT NULL DEFAULT 0,
  payment_received BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.trading_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  wallet_balance NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.player_stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trading_user_id UUID REFERENCES public.trading_users(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  shares_owned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.team_stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trading_user_id UUID REFERENCES public.trading_users(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  shares_owned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
