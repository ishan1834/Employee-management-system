import React, { useEffect, useState, useRef } from 'react';
import { Navigate, useLocation as useRouteLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Loader2, Lock, MapPin, AlertCircle, Fingerprint } from 'lucide-react';
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
    // 1. Initial Auth Barrier
    if (!user || !session) {
      setStatus('denied');
      return;
    }

    // 2. Prevent Re-verification if already cleared or currently processing
    if (checkInProgress.current || status === 'allowed') return;

    let isMounted = true;
    checkInProgress.current = true;

    const verifySecurityGate = async () => {
      setStatus('checking');

      // Step A: Fast-Path Cache Check
      if (!getGeolocationGrantedFlag()) {
        if (isMounted) {
          handleSecurityFailure('Security Gate Locked', 'Location authorization is required for access.');
        }
        return;
      }

      // Step B: Hardware/Signal Verification
      try {
        const result = await checkGeolocationAccess({ attemptPosition: true });

        if (!isMounted) return;

        if (!result.allowed) {
          handleSecurityFailure('Verification Failed', result.message || 'GPS signal required.');
        } else {
          // Success: Grant Access
          setStatus('allowed');
        }
      } catch (error) {
        if (isMounted) handleSecurityFailure('System Error', 'Verification service unavailable.');
      } finally {
        checkInProgress.current = false;
      }
    };

    const handleSecurityFailure = async (title: string, description: string) => {
      toast({
        title,
        description,
        variant: 'destructive',
      });
      await logout();
      setStatus('denied');
    };

    verifySecurityGate();

    return () => {
      isMounted = false;
      checkInProgress.current = false;
    };
  }, [user, session, logout, status]);

  // --- Render Logic ---

  // 1. Unauthenticated Redirect
  if (!user || !session) {
    return <Navigate to="/login" state={{ from: routeLocation }} replace />;
  }

  // 2. Security Loading Overlay
  if (status === 'checking' || status === 'idle') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] text-white p-6 overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute inset-0 bg-orange-500/5 radial-gradient pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 flex flex-col items-center w-full max-w-md"
        >
          {/* Main Visual: Scanning UI */}
          <div className="relative mb-12">
            {/* Pulsing Radar Rings */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: [0, 0.2, 0], scale: [0.8, 2, 2.5] }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 3, 
                  delay: i * 0.8,
                  ease: "easeOut" 
                }}
                className="absolute inset-0 border border-orange-500/30 rounded-full"
              />
            ))}

            {/* Core Hexagon/Shield Container */}
            <div className="relative bg-zinc-900 border border-white/10 p-8 rounded-[2rem] shadow-[0_0_50px_rgba(249,115,22,0.1)]">
              <div className="absolute inset-0 bg
