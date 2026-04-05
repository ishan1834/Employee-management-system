




import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, MapPin, AlertTriangle, Mail, Shield, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

type LoginStep = 'location' | 'email' | 'otp';

const LoginForm: React.FC = () => {
  const { loginWithOTP } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSentTo, setOtpSentTo] = useState('');
  const [step, setStep] = useState<LoginStep>('location');
  const [locationGranted, setLocationGranted] = useState<boolean | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Check location permission on mount
  useEffect(() => {
    checkLocationPermission();
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const checkLocationPermission = async () => {
    setLocationLoading(true);
    setLocationError(null);

    try {
      if (!navigator.geolocation) {
        setLocationError('Geolocation is not supported by your browser');
        setLocationGranted(false);
        setLocationLoading(false);
        return;
      }

      if (navigator.permissions) {
        try {
          const permission = await navigator.permissions.query({ name: 'geolocation' });
          if (permission.state === 'granted') {
            setLocationGranted(true);
            setStep('email');
            setLocationLoading(false);
            return;
          } else if (permission.state === 'denied') {
            setLocationError('Location access is blocked. Please enable it in your browser settings.');
            setLocationGranted(false);
            setLocationLoading(false);
            return;
          }
        } catch (e) {
          // Permission API not supported, continue to request
        }
      }

      setLocationGranted(null);
      setLocationLoading(false);
    } catch (error) {
      console.error('Error checking location permission:', error);
      setLocationGranted(false);
      setLocationLoading(false);
    }
  };

  const requestLocationAccess = () => {
    setLocationLoading(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('Location granted:', position.coords);
        setLocationGranted(true);
        setStep('email');
        setLocationLoading(false);
        toast({
          title: 'Location Access Granted',
          description: 'You can now proceed to login.',
        });
      },
      (error) => {
        console.error('Location error:', error);
        setLocationLoading(false);
        setLocationGranted(false);
        
        let errorMessage = 'Unable to get location. Please try again.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location in browser settings and refresh.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable. Please try again.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.';
            break;
        }
        setLocationError(errorMessage);
        toast({
          title: 'Location Access Required',
          description: errorMessage,
          variant: 'destructive'
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleSendOTP = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { email }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setOtpSentTo(data.otpSentTo || 'your registered email');
      setStep('otp');
      setResendCooldown(60);
      
      toast({
        title: "OTP Sent",
        description: `Verification code sent to ${data.otpSentTo}`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };



export default LoginForm;
