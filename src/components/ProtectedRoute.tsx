import React, { useEffect, useState, useRef } from 'react';
import { Navigate, useLocation as useRouteLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Loader2, MapPin, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { checkGeolocationAccess, getGeolocationGrantedFlag } from '@/utils/geolocation';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, session, logout } = useAuth();
  const routeLocation = useRouteLocation();
  
  const [status, setStatus] = useState<'idle' | 'checking' | 'allowed' | 'denied'>('idle');
  const checkInProgress = useRef(false);

  useEffect(() => {
    // Stage 1: Auth Check
    if (!user || !session) {
      setStatus('denied');
      return;
    }

    // Prevent duplicate triggers if the component re-renders
    if (checkInProgress.current || status === 'allowed') return;

    let isMounted = true;
    checkInProgress.current = true;

    const verifySecurityGate = async () => {
      setStatus('checking');

      // Fast Path: Check the local storage flag first
      if (!getGeolocationGrantedFlag()) {
        if (isMounted) {
          toast({
            title: 'Security Gate Locked',
            description: 'Location authorization is required for dashboard access.',
            variant: 'destructive',
          });
          await logout();
          setStatus('denied');
        }
        return;
      }

      // Deep Path: Actual hardware/browser permission check
      try {
        const result = await checkGeolocationAccess({ attemptPosition: true });

        if (!isMounted) return;

        if (!result.allowed) {
          toast({
            title: 'Location Verification Failed',
            description: result.message || 'Please enable GPS to proceed.',
            variant: 'destructive',
          });
          await logout();
          setStatus('denied');
        } else {
          setStatus('allowed');
        }
      } catch (error) {
        if (isMounted) {
          await logout();
          setStatus('denied');
        }
      } finally {
        checkInProgress.current = false;
      }
    };

    verifySecurityGate();

    return () => {
      isMounted = false;
      checkInProgress.current = false;
    };
  }, [user, session, logout, status]);

  // Handle Redirection for Unauthenticated Users
  if (!user || !session) {
    return <Navigate to="/login" state={{ from: routeLocation }} replace />;
  }

  // Security Loading Screen
  if (status === 'checking' || status === 'idle') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] text-white p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center space-y-8 max-w-xs text-center"
        >
          {/* Animated Shield/Radar UI */}
          <div className="relative">
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute inset-0 bg-orange-500/20 rounded-full blur-2xl"
            />
            <div className="relative bg-zinc-900 border border-white/5 p-6 rounded-3xl shadow-2xl">
              <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
            </div>
            <motion.div 
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
              className="absolute -top-2 -right-2"
            >
              <ShieldCheck className="w-6 h-6 text-blue-500 bg-zinc-950 rounded-full p-1" />
            </motion.div>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold tracking-tighter uppercase italic">
              Verification <span className="text-orange-500">In Progress</span>
            </h2>
            <p className="text-xs text-zinc-500 leading-relaxed font-medium uppercase tracking-widest">
              Confirming Secure Geo-Location Handshake...
            </p>
