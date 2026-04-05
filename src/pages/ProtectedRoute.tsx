


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


export default ProtectedRoute;

