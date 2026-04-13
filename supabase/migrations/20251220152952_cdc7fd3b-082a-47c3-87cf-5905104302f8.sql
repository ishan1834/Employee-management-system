    -- Create attendance table
CREATE TABLE public.attendance (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES public.admins(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'present',
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
-- Create payment_verifications table
CREATE TABLE public.payment_verifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_name TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    transaction_id TEXT NOT NULL,
    payment_received BOOLEAN NOT NULL DEFAULT false,
    verified_by UUID REFERENCES public.admins(id) ON DELETE SET NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
-- Create certificates table
CREATE TABLE public.certificates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_name TEXT NOT NULL,
    certificate_type TEXT NOT NULL,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    issued_by UUID REFERENCES public.admins(id) ON DELETE SET NULL,
    certificate_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
