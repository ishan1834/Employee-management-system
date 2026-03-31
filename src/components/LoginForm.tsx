// ENHANCED THRYLOS LOGIN FORM v2.0
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, MapPin, AlertTriangle, Mail, Shield, 
  ArrowLeft, Eye, EyeOff, Lock, CheckCircle2 
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
  const [locationGranted, setLocationGranted] = useState<boolean | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  // Constants
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
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const checkLocationPermission = async () => {
    try {
      if (!navigator.geolocation) {
        setLocationError('Geolocation not supported by browser');
        return;
      }
      const permission = await navigator.permissions?.query({ name: 'geolocation' as any });
      if (permission?.state === 'granted') {
        setLocationGranted(true);
        setStep('email');
      }
    } catch (err) {
      console.error('Permission check failed', err);
    } finally {
      setLocationLoading(false);
    }
  };

  const requestLocation = () => {
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      () => {
        setLocationGranted(true);
        setStep('email');
        toast({ title: 'Access Granted', description: 'Location verified successfully.' });
      },
      (error) => {
        setLocationError(error.message || 'Location access denied');
        setLocationGranted(false);
        setLocationLoading(false);
      }
    );
  };

  const handleSendOTP = async () => {
    if (!email || !email.includes('@')) {
      toast({ title: 'Invalid Email', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-otp', { body: { email } });
      if (error) throw error;
      
      setOtpSentTo(data?.otpSentTo || email);
      setStep('otp');
      setResendCooldown(60);
      toast({ title: 'Secure Code Sent', description: 'Check your inbox for the 6-digit OTP.' });
    } catch (err) {
      toast({ title: 'Dispatch Failed', description: 'Could not send OTP. Try again later.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) return;
    setIsLoading(true);
    try {
      await loginWithOTP(email, otp);
      toast({ title: 'Authentication Successful', description: 'Redirecting to dashboard...' });
    } catch (err) {
      toast({ title: 'Invalid Token', description: 'The OTP entered is incorrect or expired.', variant: 'destructive' });
      setOtp('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'otp') setStep('email');
    if (step === 'email') setStep('location');
  };

  // Sub-components for cleaner render
  const MotionWrapper = ({ children }: { children: React.ReactNode }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {children}
    </motion.div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black p-6">
      <Card className="w-full max-w-md border-zinc-800 bg-zinc-950/50 backdrop-blur-xl text-zinc-100 shadow-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between mb-4">
            {step !== 'location' && (
              <Button variant="ghost" size="icon" onClick={handleBack} className="text-zinc-400 hover:text-white">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <Badge variant="outline" className="ml-auto border-orange-500/50 text-orange-400 uppercase tracking-widest text-[10px]">
              System {step}
            </Badge>
          </div>
          <CardTitle className="text-4xl font-black tracking-tighter bg-gradient-to-br from-white via-zinc-400 to-orange-500 bg-clip-text text-transparent">
            THRYLOS
          </CardTitle>
          <CardDescription className="text-zinc-500">
            {STEP_CONFIG[step].title}
          </CardDescription>
          <Progress value={STEP_CONFIG[step].progress} className="h-1 bg-zinc-800 mt-4" />
        </CardHeader>

        <CardContent className="pt-2">
          <AnimatePresence mode="wait">
            {step === 'location' && (
              <MotionWrapper key="loc">
                <div className="flex flex-col items-center py-6 space-y-4">
                  <div className="p-4 rounded-full bg-orange-500/10 border border-orange-500/20">
                    <MapPin className="w-10 h-10 text-orange-500" />
                  </div>
                  <p className="text-center text-sm text-zinc-400 leading-relaxed">
                    This terminal requires a secure geo-fence handshake to proceed.
                  </p>
                </div>
                {locationError && (
                  <div className="flex items-center gap-2 text-xs text-red-400 bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{locationError}</span>
                  </div>
                )}
                <Button className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold h-12" onClick={requestLocation} disabled={locationLoading}>
                  {locationLoading ? <Loader2 className="animate-spin mr-2" /> : 'Authorize Location'}
                </Button>
              </MotionWrapper>
            )}

            {step === 'email' && (
              <MotionWrapper key="mail">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs uppercase tracking-widest text-zinc-500">Admin Email</Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@thrylos.com"
                        className="bg-zinc-900/50 border-zinc-800 h-12 pl-10 focus:ring-orange-500"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      <Mail className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                      <button
                        type="button"
                        className="absolute right-3 top-3.5 text-zinc-500 hover:text-zinc-3
