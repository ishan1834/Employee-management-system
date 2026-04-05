import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Loader2, Shield, Heart, MapPin, Mail, ArrowLeft } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { supabase } from '@/integrations/supabase/client';
import {
  checkGeolocationAccess,
  getGeolocationErrorMessage,
  requestGeolocation,
  setGeolocationGrantedFlag,
} from '@/utils/geolocation';






type LoginStep = 'location' | 'email' | 'otp';






const RoleBasedLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<LoginStep>('location');
  const [isLoading, setIsLoading] = useState(false);
  const { user, session, loginWithOTP } = useAuth();
  const { toast } = useToast();





  

  const [locationGranted, setLocationGranted] = useState(false);
  const [locationChecking, setLocationChecking] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);





  

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLocationChecking(true);
      setLocationError(null);

      const result = await checkGeolocationAccess({ attemptPosition: false });

      if (cancelled) return;

      if (result.allowed) {
        setLocationGranted(true);
        setGeolocationGrantedFlag(true);
        setStep('email');
      } else {
        setLocationGranted(false);
        if (result.state === 'denied') {
          setLocationError(result.message || 'Location is blocked in your browser settings.');
        }
      }








      
      setLocationChecking(false);
    };

    run();

    return () => {
      cancelled = true;
    };
  }, []);







  

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }

    
  }, [resendCooldown]);






  

  // If user is already logged in, redirect to dashboard
  if (user && session) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleRequestLocation = async () => {
    setLocationChecking(true);
    setLocationError(null);

    try {
      await requestGeolocation({ enableHighAccuracy: true, timeout: 12000, maximumAge: 0 });
      setLocationGranted(true);
      setGeolocationGrantedFlag(true);
      setStep('email');

      toast({
        title: 'Location enabled',
        description: 'You can now sign in.',
      });
    } catch (err: any) {
      setLocationGranted(false);
      setGeolocationGrantedFlag(false);

      const msg = getGeolocationErrorMessage(err);
      setLocationError(msg);

      toast({
        title: 'Location required',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setLocationChecking(false);
    }
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

      setStep('otp');
      setResendCooldown(60);
      
      toast({
        title: "OTP Sent",
        description: "Verification code sent to your registered email"
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




  

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">




      
      {/* Character Background Image with Blinking Effect - Centered and Larger */}





      
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className="w-full h-full max-w-6xl max-h-6xl background-image-blink"
          style={{
            backgroundImage: `url(/thrylosindia.png)`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.25,
          }}
        ></div>
      </div>

      {/* Enhanced Animated Background Elements */}





      
      <div className="absolute inset-0 overflow-hidden">



        
        {/* Rotating gradient orbs with blue-purple theme */}




        
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-[spin_20s_linear_infinite]"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-600/15 to-indigo-600/15 rounded-full blur-3xl animate-[spin_25s_linear_infinite_reverse]"></div>
        <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-gradient-to-r from-indigo-500/25 to-cyan-500/25 rounded-full blur-3xl animate-[spin_15s_linear_infinite]"></div>


        
        {/* Enhanced floating animation orbs */}




        
        <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-2xl animate-[bounce_3s_ease-in-out_infinite] energy-glow"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-2xl animate-[bounce_4s_ease-in-out_infinite] energy-glow" style={{ animationDelay: '1s' }}></div>




        
        {/* Enhanced pulsating rings */}




        
        <div className="absolute top-1/3 right-1/3 w-80 h-80 border border-blue-400/20 rounded-full animate-ping"></div>
        <div className="absolute bottom-1/3 left-1/3 w-60 h-60 border border-purple-400/20 rounded-full animate-ping" style={{ animationDelay: '2s' }}></div>





        
        {/* Enhanced moving gradient lines */}



        
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent animate-[slide-in-right_4s_ease-in-out_infinite]"></div>
          <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400/30 to-transparent animate-[slide-in-right_5s_ease-in-out_infinite]" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent animate-[slide-in-right_6s_ease-in-out_infinite]" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent animate-[slide-in-right_7s_ease-in-out_infinite]" style={{ animationDelay: '3s' }}></div>
        </div>
        
        {/* Enhanced diagonal moving lines */}
        <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-transparent via-blue-400/25 to-transparent animate-[slide-down_8s_ease-in-out_infinite]"></div>
        <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-purple-400/25 to-transparent animate-[slide-down_9s_ease-in-out_infinite]" style={{ animationDelay: '2s' }}></div>
        
        {/* Enhanced floating particles with increased quantity and faster movement */}
        {Array.from({ length: 120 }, (_, i) => (
          <div
            key={i}
            className={`absolute rounded-full ${
              i % 5 === 0 ? 'w-2 h-2 bg-blue-400/50 floating-particles-fast' : 
              i % 5 === 1 ? 'w-1 h-1 bg-purple-400/50 floating-particles' : 
              i % 5 === 2 ? 'w-3 h-3 bg-cyan-400/40 floating-particles-medium' : 
              i % 5 === 3 ? 'w-1.5 h-1.5 bg-indigo-400/45 floating-particles-fast' :
              'w-2.5 h-2.5 bg-pink-400/35 floating-particles'
            }`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          ></div>
        ))}
        
        {/* Enhanced morphing shapes with movement */}
        <div className="absolute top-20 right-20 w-20 h-20 bg-gradient-to-r from-blue-500/15 to-purple-500/15 rounded-full animate-morph energy-glow"></div>
        <div className="absolute bottom-20 left-20 w-16 h-16 bg-gradient-to-r from-purple-500/15 to-cyan-500/15 rounded-lg animate-morph energy-glow" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-1/2 right-1/4 w-12 h-12 bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 rounded-full animate-morph energy-glow" style={{ animationDelay: '3s' }}></div>
        <div className="absolute bottom-1/3 left-1/3 w-18 h-18 bg-gradient-to-r from-indigo-500/15 to-pink-500/15 rounded-lg animate-morph energy-glow" style={{ animationDelay: '4.5s' }}></div>
        
        {/* Additional energy effects */}
        <div className="absolute top-1/2 left-10 w-4 h-4 bg-blue-400/60 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute top-1/3 right-10 w-3 h-3 bg-purple-400/60 rounded-full animate-ping" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute bottom-1/4 left-1/2 w-5 h-5 bg-cyan-400/60 rounded-full animate-ping" style={{ animationDelay: '2.5s' }}></div>
      </div>
      
      <div className="w-full max-w-md mx-auto space-y-6 relative z-10 pt-20">
        {/* Logo/Header with enhanced faster animation */}
        <div className="text-center">
          <div
            className="text-4xl font-extrabold tracking-wide text-transparent bg-clip-text"
            style={{ 
              fontFamily: "'Nixmat', sans-serif",
              backgroundImage: 'linear-gradient(90deg, #f97316 0%, #ec4899 50%, #3b82f6 100%)',
              backgroundSize: '100%',
            }}
          >
            ThryLos
          </div>
          <p className="text-muted-foreground mt-2 text-lg typewriter">Admin Dashboard Access</p>
        </div>




        

        {/* Location Gate (required) */}
        {step === 'location' && !locationGranted ? (
          <Card className="bg-black/70 border-white/20 backdrop-blur-sm animate-scale-in glow-effect hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-500 energy-glow">
            <CardContent className="pt-6 space-y-5">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-blue-300" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">Location access required</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Location permission is mandatory for security. Without it, you can't login.
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
                type="button"
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/40 h-12 text-lg font-semibold energy-glow"
                onClick={handleRequestLocation}
                disabled={locationChecking}
              >
                {locationChecking ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Requesting…
                  </>
                ) : (
                  'Allow Location'
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                If location is blocked, enable it in your browser settings then refresh.
              </p>
            </CardContent>
          </Card>
        ) : step === 'email' ? (




      
          /* Email Entry Step */
          <Card className="bg-black/70 border-white/20 backdrop-blur-sm animate-scale-in glow-effect hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-500 energy-glow">
            <CardContent className="pt-6">
              <form onSubmit={handleSendOTP} className="space-y-6">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-4">
                    <Mail className="w-8 h-8 text-blue-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Sign In with OTP</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Enter your admin email to receive a one-time password
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs text-green-400 justify-center">
                  <MapPin className="w-3 h-3" />
                  <span>Location access granted</span>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="email" className="text-gray-200 text-sm font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your admin email"
                    className="bg-black/60 border-white/30 text-white placeholder:text-gray-400 focus:border-purple-500 focus:shadow-lg focus:shadow-purple-500/30 transition-all duration-300 h-12"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/40 h-12 text-lg font-semibold energy-glow"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-5 w-5" />
                      Send OTP
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (





      
          /* OTP Verification Step */
          <Card className="bg-black/70 border-white/20 backdrop-blur-sm animate-scale-in glow-effect hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-500 energy-glow">
            <CardContent className="pt-6">
              <div className="space-y-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="text-muted-foreground hover:text-white hover:bg-white/10 -ml-2"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>

                <div className="text-center mb-4">
                  <div className="w-16 h-16 mx-auto rounded-full overflow-hidden mb-4">
                    <img src="/thrylosindia.png" alt="User image" className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Verify OTP</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Enter the 6-digit code sent to your email
                  </p>
                </div>

                <div className="flex justify-center py-4">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={(value) => setOtp(value)}
                    className="gap-2.5"
                  >
                    <InputOTPGroup className="gap-2.5">
                      <InputOTPSlot 
                        index={0} 
                        className="w-12 h-14 text-2xl font-bold bg-black/50 border-2 border-purple-500/40 rounded-lg text-white focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 transition-all" 
                      />
                      <InputOTPSlot 
                        index={1} 
                        className="w-12 h-14 text-2xl font-bold bg-black/50 border-2 border-purple-500/40 rounded-lg text-white focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 transition-all" 
                      />
                      <InputOTPSlot 
                        index={2} 
                        className="w-12 h-14 text-2xl font-bold bg-black/50 border-2 border-purple-500/40 rounded-lg text-white focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 transition-all" 
                      />
                    </InputOTPGroup>
                    <div className="flex items-center justify-center w-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400/70"></div>
                    </div>
                    <InputOTPGroup className="gap-2.5">
                      <InputOTPSlot 
                        index={3} 
                        className="w-12 h-14 text-2xl font-bold bg-black/50 border-2 border-purple-500/40 rounded-lg text-white focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 transition-all" 
                      />
                      <InputOTPSlot 
                        index={4} 
                        className="w-12 h-14 text-2xl font-bold bg-black/50 border-2 border-purple-500/40 rounded-lg text-white focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 transition-all" 
                      />
                      <InputOTPSlot 
                        index={5} 
                        className="w-12 h-14 text-2xl font-bold bg-black/50 border-2 border-purple-500/40 rounded-lg text-white focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 transition-all" 
                      />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button
                  type="button"
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/40 h-12 text-lg font-semibold energy-glow"
                  onClick={handleVerifyOTP}
                  disabled={isLoading || otp.length !== 6}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify & Sign In
                    </>
                  )}
                </Button>

                <div className="text-center space-y-3 pt-2">
                  <p className="text-sm text-muted-foreground">
                    Didn't receive the code?
                  </p>
                  {resendCooldown > 0 ? (
                    <div className="w-full flex flex-col items-center gap-2">
                      <Button
                        disabled
                        className="w-full max-w-xs mx-auto rounded-full flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-r from-purple-800/20 to-blue-700/15 border border-white/5 text-white cursor-not-allowed shadow-inner"
                      >
                        <span className="text-sm">
                          Resend OTP in <span className="font-semibold">{resendCooldown}s</span>
                        </span>
                      </Button>

                      <div className="w-full max-w-xs h-2 rounded-full bg-white/10 mt-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-blue-400 transition-all"
                          style={{
                            width: `${(resendCooldown / 60) * 100}%`,
                            transition: 'width 1s linear',
                          }}
                          aria-hidden
                        />
                      </div>

                      <span className="sr-only" aria-live="polite">
                        {resendCooldown} seconds remaining until you can resend the OTP.
                      </span>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      onClick={handleResendOTP}
                      className="w-full max-w-xs mx-auto rounded-full bg-gradient-to-r from-purple-600 to-blue-500 text-white px-6 py-2 shadow-lg hover:scale-105 hover:shadow-2xl transition-transform duration-200"
                    >
                      Resend OTP
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}





        

        {/* Footer with animation */}

        <div className="text-center text-muted-foreground text-sm animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <span className="flex justify-center items-center gap-2">
            <span>Secure admin access for</span>
            <span className="text-lg font-extrabold tracking-wide bg-gradient-to-r from-orange-500 via-pink-500 to-blue-500 text-transparent bg-clip-text" style={{ fontFamily: "'Nixmat', sans-serif" }}>ThryLos</span>
            <span>Admins</span>
          </span>
        </div>

        <div className="text-center text-muted-foreground text-sm animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <div className="flex items-center justify-center gap-3 mt-6">
            <span className="text-lg text-foreground font-normal" style={{ fontFamily: 'taberna' }}>
              A
            </span>
            <span
              className="text-lg font-extrabold tracking-wide bg-gradient-to-r from-orange-500 via-pink-500 to-blue-500 text-transparent bg-clip-text"
              style={{ fontFamily: "'Merlin', cursive" }}
            >
              misterutsav
            </span>
            <span className="text-lg text-foreground font-normal" style={{ fontFamily: 'taberna' }}>
              PRODUCT
            </span>
            <Heart className="h-4 w-4 text-destructive fill-destructive animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleBasedLogin;
