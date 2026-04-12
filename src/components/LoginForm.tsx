import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, MapPin, AlertTriangle, Mail, Shield, 
  ArrowLeft, Eye, EyeOff, CheckCircle2 
} from 'lucide-react';

// Shadcn UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

type LoginStep = 'location' | 'email' | 'otp';

const LoginForm: React.FC = () => {
  const { loginWithOTP } = useAuth();
  const { toast } = useToast();

  // Core State
  const [step, setStep] = useState<LoginStep>('location');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSentTo, setOtpSentTo] = useState('');

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showEmail, setShowEmail] = useState(false);

  const STEP_CONFIG = {
    location: { progress: 33, title: 'Identity Verification' },
    email: { progress: 66, title: 'Credentials' },
    otp: { progress: 100, title: 'Final Security' }
  };

  useEffect(() => {
    checkLocationPermission();
  }, []);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setInterval(() => setResendCooldown(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [resendCooldown]);

  const checkLocationPermission = async () => {
    try {
      const permission = await navigator.permissions?.query({ name: 'geolocation' as any });
      if (permission?.state === 'granted') {
        setStep('email');
      }
    } catch (err) {
      console.error('Permission check failed', err);
    } finally {
      setLocationLoading(false);
    }
  };

  const requestLocation = () =>
