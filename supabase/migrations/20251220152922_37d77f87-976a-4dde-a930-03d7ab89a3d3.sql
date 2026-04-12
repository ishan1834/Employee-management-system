-- Create admin role enum
CREATE TYPE public.admin_role AS ENUM ('super_admin', 'betting_admin', 'trading_admin', 'social_admin', 'esports_admin');

-- Create admins table
CREATE TABLE public.admins (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role admin_role NOT NULL DEFAULT 'betting_admin',
    avatar TEXT DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create betting_events table
CREATE TABLE public.betting_events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    event_name TEXT NOT NULL,
    user_name TEXT NOT NULL,
    email TEXT NOT NULL,
    payment_received BOOLEAN NOT NULL DEFAULT false,
    bet_amount NUMERIC NOT NULL DEFAULT 0,
    fees_paid NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create esports_players table
CREATE TABLE public.esports_players (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    player_name TEXT NOT NULL,
    game_uid TEXT NOT NULL,
    email TEXT NOT NULL,
    tournament_name TEXT NOT NULL,
    payment_received BOOLEAN NOT NULL DEFAULT false,
    entry_fees NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create social_media_orders table
CREATE TABLE public.social_media_orders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    post_account_link TEXT NOT NULL,
    service_type TEXT NOT NULL,
    order_type TEXT NOT NULL,
    payment_received BOOLEAN NOT NULL DEFAULT false,
    quantity INTEGER NOT NULL DEFAULT 0,
    payment_amount NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trading_users table
CREATE TABLE public.trading_users (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_name TEXT NOT NULL,
    email TEXT NOT NULL,
    wallet_balance NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audit_logs table
CREATE TABLE public.audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES public.admins(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE public.chat_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES public.admins(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.betting_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.esports_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admins
    WHERE user_id = _user_id
      AND is_active = true
  )
$$;

-- Create function to check specific admin role
CREATE OR REPLACE FUNCTION public.has_admin_role(_user_id UUID, _role admin_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admins
    WHERE user_id = _user_id
      AND role = _role
      AND is_active = true
  )
$$;

-- Create function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admins
    WHERE user_id = _user_id
      AND role = 'super_admin'
      AND is_active = true
  )
$$;

-- RLS Policies for admins table
CREATE POLICY "Admins can view all admins"
ON public.admins FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Super admins can insert admins"
ON public.admins FOR INSERT
TO authenticated
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update admins"
ON public.admins FOR UPDATE
TO authenticated
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete admins"
ON public.admins FOR DELETE
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- RLS Policies for betting_events
CREATE POLICY "Admins can view betting events"
ON public.betting_events FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Betting admins can manage betting events"
ON public.betting_events FOR ALL
TO authenticated
USING (public.has_admin_role(auth.uid(), 'betting_admin') OR public.is_super_admin(auth.uid()));

-- RLS Policies for esports_players
CREATE POLICY "Admins can view esports players"
ON public.esports_players FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Esports admins can manage esports players"
ON public.esports_players FOR ALL
TO authenticated
USING (public.has_admin_role(auth.uid(), 'esports_admin') OR public.is_super_admin(auth.uid()));

-- RLS Policies for social_media_orders
CREATE POLICY "Admins can view social media orders"
ON public.social_media_orders FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Social admins can manage social media orders"
ON public.social_media_orders FOR ALL
TO authenticated
USING (public.has_admin_role(auth.uid(), 'social_admin') OR public.is_super_admin(auth.uid()));

-- RLS Policies for trading_users
CREATE POLICY "Admins can view trading users"
ON public.trading_users FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Trading admins can manage trading users"
ON public.trading_users FOR ALL
TO authenticated
USING (public.has_admin_role(auth.uid(), 'trading_admin') OR public.is_super_admin(auth.uid()));

-- RLS Policies for audit_logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert audit logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- RLS Policies for chat_messages
CREATE POLICY "Admins can view chat messages"
ON public.chat_messages FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert chat messages"
ON public.chat_messages FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_admins_updated_at
    BEFORE UPDATE ON public.admins
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_betting_events_updated_at
    BEFORE UPDATE ON public.betting_events
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_esports_players_updated_at
    BEFORE UPDATE ON public.esports_players
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_social_media_orders_updated_at
    BEFORE UPDATE ON public.social_media_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trading_users_updated_at
    BEFORE UPDATE ON public.trading_users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
