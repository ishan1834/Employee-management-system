


import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { checkGeolocationAccess, getGeolocationGrantedFlag } from '@/utils/geolocation';




interface ProtectedRouteProps {
  children: React.ReactNode;
}





const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, session, logout } = useAuth();
  const [locationChecked, setLocationChecked] = useState(false);
  const [locationAllowed, setLocationAllowed] = useState(false);




  

  useEffect(() => {
    // If no user or session, skip location check
    if (!user || !session) {
      setLocationChecked(true);
      setLocationAllowed(false);
      return;
    }





    
    let cancelled = false;





    

    const run = async () => {
      setLocationChecked(false);
      setLocationAllowed(false);





      

      // Fast path: if we never recorded a successful location grant in this browser,
      // force a logout so user must grant permission at login.


      if (!getGeolocationGrantedFlag()) {
        toast({
          title: 'Location required',
          description: 'Please allow location access to use the dashboard.',
          variant: 'destructive',
        });
        await logout();
        if (!cancelled) {
          setLocationChecked(true);
          setLocationAllowed(false);
        }
        return;
      }

      const result = await checkGeolocationAccess({ attemptPosition: true });

      if (cancelled) return;

      if (!result.allowed) {
        toast({
          title: 'Location required',
          description: result.message || 'Please allow location access to use the dashboard.',
          variant: 'destructive',
        });
        await logout();
        if (!cancelled) {
          setLocationChecked(true);
          setLocationAllowed(false);
        }
        return;
      }

      setLocationChecked(true);
      setLocationAllowed(true);
    };

    run();

    return () => {
      cancelled = true;
    };




    
    // Re-check when session changes




    
  }, [user, session, logout]);

  // If no user or session, redirect to login




  
  if (!user || !session) {
    return <Navigate to="/login" replace />;
  }

  if (!locationChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-sm text-muted-foreground">Checking location permission…</div>
      </div>
    );
  }

  if (!locationAllowed) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

      


export default ProtectedRoute;

