




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






  


    const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter the complete 6-digit OTP",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      await loginWithOTP(email, otp);
      toast({
        title: "Success",
        description: "Logged in successfully!"
      });
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid OTP",
        variant: "destructive"
      });
      setOtp('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    await handleSendOTP();
  };

  const handleBack = () => {
    if (step === 'otp') {
      setStep('email');
      setOtp('');
    }
  };














  

  // Location permission screen
  if (step === 'location' && !locationGranted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-4">
        <Card className="w-full max-w-md gradient-card border-white/10">
          <CardHeader className="space-y-1 text-center">
            <CardTitle
              className="text-2xl font-extrabold tracking-wide bg-gradient-to-r from-orange-500 via-pink-500 to-blue-500 text-transparent bg-clip-text"
              style={{ fontFamily: "'Nixmat', sans-serif" }}
            >
              ThryLos
            </CardTitle>
            <p className="text-muted-foreground">Admin Dashboard</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-orange-500/20 via-pink-500/20 to-blue-500/20 flex items-center justify-center">
                <MapPin className="w-10 h-10 text-orange-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Location Access Required</h3>
                <p className="text-sm text-muted-foreground">
                  For security purposes, location access is mandatory to login. This helps us monitor and secure admin access.
                </p>
              </div>
            </div>

            {locationError && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div className="text-sm text-destructive">{locationError}</div>
              </div>
            )}

            <Button 
              className="w-full gradient-primary" 
              onClick={requestLocationAccess}
              disabled={locationLoading}
            >
              {locationLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Requesting Access...
                </>
              ) : (
                <>
                  <MapPin className="mr-2 h-4 w-4" />
                  Allow Location Access
                </>
              )}
            </Button>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                By allowing location access, you agree to our security policy for admin access logging.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }











  
  // Email entry screen
  if (step === 'email') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-4">
        <Card className="w-full max-w-md gradient-card border-white/10">
          <CardHeader className="space-y-1 text-center">
            <CardTitle
              className="text-2xl font-extrabold tracking-wide bg-gradient-to-r from-orange-500 via-pink-500 to-blue-500 text-transparent bg-clip-text"
              style={{ fontFamily: "'Nixmat', sans-serif" }}
            >
              ThryLos
            </CardTitle>
            <p className="text-muted-foreground">Admin Dashboard</p>
            <div className="flex items-center justify-center gap-2 text-xs text-green-400">
              <MapPin className="w-3 h-3" />
              <span>Location access granted</span>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-orange-500/20 via-pink-500/20 to-blue-500/20 flex items-center justify-center mb-4">
                  <Mail className="w-8 h-8 text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Sign In with OTP</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter your admin email to receive a one-time password
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Admin Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your admin email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-black/50 border-white/10"
                  required
                />
              </div>

              <Button type="submit" className="w-full gradient-primary" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send OTP
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }










  

  // OTP verification screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <Card className="w-full max-w-md gradient-card border-white/10">
        <CardHeader className="space-y-1 text-center">
          <CardTitle
            className="text-2xl font-extrabold tracking-wide bg-gradient-to-r from-orange-500 via-pink-500 to-blue-500 text-transparent bg-clip-text"
            style={{ fontFamily: "'Nixmat', sans-serif" }}
          >
            ThryLos
          </CardTitle>
          <p className="text-muted-foreground">Admin Dashboard</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="text-muted-foreground hover:text-white -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>






          
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-orange-500/20 via-pink-500/20 to-blue-500/20 flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-orange-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Verify OTP</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Enter the 6-digit code sent to
            </p>
            <p className="text-sm text-orange-400 font-medium">{otpSentTo}</p>
          </div>

          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={(value) => setOtp(value)}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} className="bg-black/50 border-white/20" />
                <InputOTPSlot index={1} className="bg-black/50 border-white/20" />
                <InputOTPSlot index={2} className="bg-black/50 border-white/20" />
                <InputOTPSlot index={3} className="bg-black/50 border-white/20" />
                <InputOTPSlot index={4} className="bg-black/50 border-white/20" />
                <InputOTPSlot index={5} className="bg-black/50 border-white/20" />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button 
            className="w-full gradient-primary" 
            onClick={handleVerifyOTP}
            disabled={isLoading || otp.length !== 6}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Verify & Sign In
              </>
            )}
          </Button>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Didn't receive the code?{' '}
              {resendCooldown > 0 ? (
                <span className="text-orange-400">Resend in {resendCooldown}s</span>
              ) : (
                <button
                  onClick={handleResendOTP}
                  className="text-orange-400 hover:text-orange-300 underline"
                  disabled={isLoading}
                >
                  Resend OTP
                </button>
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
