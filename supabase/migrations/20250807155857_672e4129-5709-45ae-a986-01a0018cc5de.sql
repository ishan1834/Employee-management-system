
-- Create all necessary tables for the admin dashboard

-- Admins table (already exists based on your code)
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

-- Attendance table
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.admins(id) ON DELETE CASCADE NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  reason TEXT,
  marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  marked_by UUID REFERENCES public.admins(id)
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES public.admins(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  file_url TEXT,
  file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics data table
CREATE TABLE IF NOT EXISTS public.analytics_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  date DATE DEFAULT CURRENT_DATE,
  admin_id UUID REFERENCES public.admins(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment verifications table
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

-- Certificates table
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

-- Internships table
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

-- Esports players table
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

-- Social media orders table
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

-- Trading users table
CREATE TABLE IF NOT EXISTS public.trading_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  wallet_balance NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Player stocks table
CREATE TABLE IF NOT EXISTS public.player_stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trading_user_id UUID REFERENCES public.trading_users(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  shares_owned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team stocks table
CREATE TABLE IF NOT EXISTS public.team_stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trading_user_id UUID REFERENCES public.trading_users(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  shares_owned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Betting events table
CREATE TABLE IF NOT EXISTS public.betting_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  user_name TEXT NOT NULL,
  email TEXT NOT NULL,
  bet_amount NUMERIC NOT NULL DEFAULT 0,
  fees_paid NUMERIC NOT NULL DEFAULT 0,
  payment_received BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.esports_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.betting_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing authenticated users to access all data for admin dashboard)
-- Admins policies
CREATE POLICY "Authenticated users can view admins" ON public.admins FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert admins" ON public.admins FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update admins" ON public.admins FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete admins" ON public.admins FOR DELETE TO authenticated USING (true);

-- Attendance policies
CREATE POLICY "Authenticated users can view attendance" ON public.attendance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert attendance" ON public.attendance FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update attendance" ON public.attendance FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete attendance" ON public.attendance FOR DELETE TO authenticated USING (true);

-- Chat messages policies
CREATE POLICY "Authenticated users can view messages" ON public.chat_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert messages" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update messages" ON public.chat_messages FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete messages" ON public.chat_messages FOR DELETE TO authenticated USING (true);

-- Analytics data policies
CREATE POLICY "Authenticated users can view analytics" ON public.analytics_data FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert analytics" ON public.analytics_data FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update analytics" ON public.analytics_data FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete analytics" ON public.analytics_data FOR DELETE TO authenticated USING (true);

-- Payment verifications policies
CREATE POLICY "Authenticated users can view payments" ON public.payment_verifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert payments" ON public.payment_verifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update payments" ON public.payment_verifications FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete payments" ON public.payment_verifications FOR DELETE TO authenticated USING (true);

-- Certificates policies
CREATE POLICY "Authenticated users can view certificates" ON public.certificates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert certificates" ON public.certificates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update certificates" ON public.certificates FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete certificates" ON public.certificates FOR DELETE TO authenticated USING (true);

-- Internships policies
CREATE POLICY "Authenticated users can view internships" ON public.internships FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert internships" ON public.internships FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update internships" ON public.internships FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete internships" ON public.internships FOR DELETE TO authenticated USING (true);

-- Esports players policies
CREATE POLICY "Authenticated users can view esports players" ON public.esports_players FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert esports players" ON public.esports_players FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update esports players" ON public.esports_players FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete esports players" ON public.esports_players FOR DELETE TO authenticated USING (true);

-- Social media orders policies
CREATE POLICY "Authenticated users can view social orders" ON public.social_media_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert social orders" ON public.social_media_orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update social orders" ON public.social_media_orders FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete social orders" ON public.social_media_orders FOR DELETE TO authenticated USING (true);

-- Trading users policies
CREATE POLICY "Authenticated users can view trading users" ON public.trading_users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert trading users" ON public.trading_users FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update trading users" ON public.trading_users FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete trading users" ON public.trading_users FOR DELETE TO authenticated USING (true);

-- Player stocks policies
CREATE POLICY "Authenticated users can view player stocks" ON public.player_stocks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert player stocks" ON public.player_stocks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update player stocks" ON public.player_stocks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete player stocks" ON public.player_stocks FOR DELETE TO authenticated USING (true);

-- Team stocks policies
CREATE POLICY "Authenticated users can view team stocks" ON public.team_stocks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert team stocks" ON public.team_stocks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update team stocks" ON public.team_stocks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete team stocks" ON public.team_stocks FOR DELETE TO authenticated USING (true);

-- Betting events policies
CREATE POLICY "Authenticated users can view betting events" ON public.betting_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert betting events" ON public.betting_events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update betting events" ON public.betting_events FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete betting events" ON public.betting_events FOR DELETE TO authenticated USING (true);

-- Enable real-time updates for all tables
ALTER TABLE public.admins REPLICA IDENTITY FULL;
ALTER TABLE public.attendance REPLICA IDENTITY FULL;
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.analytics_data REPLICA IDENTITY FULL;
ALTER TABLE public.payment_verifications REPLICA IDENTITY FULL;
ALTER TABLE public.certificates REPLICA IDENTITY FULL;
ALTER TABLE public.internships REPLICA IDENTITY FULL;
ALTER TABLE public.esports_players REPLICA IDENTITY FULL;
ALTER TABLE public.social_media_orders REPLICA IDENTITY FULL;
ALTER TABLE public.trading_users REPLICA IDENTITY FULL;
ALTER TABLE public.player_stocks REPLICA IDENTITY FULL;
ALTER TABLE public.team_stocks REPLICA IDENTITY FULL;
ALTER TABLE public.betting_events REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.admins;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.analytics_data;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_verifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.certificates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.internships;
ALTER PUBLICATION supabase_realtime ADD TABLE public.esports_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.social_media_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trading_users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.player_stocks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_stocks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.betting_events;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admins_user_id ON public.admins(user_id);
CREATE INDEX IF NOT EXISTS idx_admins_email ON public.admins(email);
CREATE INDEX IF NOT EXISTS idx_attendance_admin_id ON public.attendance(admin_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_verifications_email ON public.payment_verifications(user_email);
CREATE INDEX IF NOT EXISTS idx_payment_verifications_transaction_id ON public.payment_verifications(transaction_id);
CREATE INDEX IF NOT EXISTS idx_certificates_certificate_id ON public.certificates(certificate_id);
CREATE INDEX IF NOT EXISTS idx_internships_intern_id ON public.internships(intern_id);
CREATE INDEX IF NOT EXISTS idx_esports_players_email ON public.esports_players(email);
CREATE INDEX IF NOT EXISTS idx_trading_users_email ON public.trading_users(email);
CREATE INDEX IF NOT EXISTS idx_player_stocks_trading_user_id ON public.player_stocks(trading_user_id);
CREATE INDEX IF NOT EXISTS idx_team_stocks_trading_user_id ON public.team_stocks(trading_user_id);
CREATE INDEX IF NOT EXISTS idx_betting_events_email ON public.betting_events(email);

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating timestamps
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON public.admins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_esports_players_updated_at BEFORE UPDATE ON public.esports_players FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_social_media_orders_updated_at BEFORE UPDATE ON public.social_media_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trading_users_updated_at BEFORE UPDATE ON public.trading_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_player_stocks_updated_at BEFORE UPDATE ON public.player_stocks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_stocks_updated_at BEFORE UPDATE ON public.team_stocks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_betting_events_updated_at BEFORE UPDATE ON public.betting_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
