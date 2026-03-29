



import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

/**
 * ===============================
 * CONFIGURATION
 * ===============================
 */

const DEBUG = true;
const MAX_RETRIES = 2;
const LOCATION_TIMEOUT = 15000;
const MIN_ACCURACY_THRESHOLD = 1000; // meters

type GeoPermissionState = PermissionState | "unsupported";

/**
 * ===============================
 * UTIL FUNCTIONS
 * ===============================
 */

const getStorageKey = (adminId: string) => `location_prompted_v2:${adminId}`;

const getSessionKey = (adminId: string) => `location_session:${adminId}`;

const logDebug = (...args: any[]) => {
  if (DEBUG) console.log("[LocationDebug]", ...args);
};

const getDeviceInfo = () => {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screen: {
      width: window.screen.width,
      height: window.screen.height,
    },
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
};

/**
 * ===============================
 * COMPONENT
 * ===============================
 */

const LocationPermissionPrompt: React.FC = () => {
  const { adminProfile } = useAuth();

  const [open, setOpen] = useState(false);
  const [permissionState, setPermissionState] = useState<GeoPermissionState>("prompt");
  const [loading, setLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorState, setErrorState] = useState<string | null>(null);

  const storageKey = useMemo(() => {
    if (!adminProfile?.id) return null;
    return getStorageKey(adminProfile.id);
  }, [adminProfile?.id]);

  const sessionKey = useMemo(() => {
    if (!adminProfile?.id) return null;
    return getSessionKey(adminProfile.id);
  }, [adminProfile?.id]);

  /**
   * ===============================
   * LOGGING FUNCTION
   * ===============================
   */

  const logLocationPermission = async (
    status: string,
    details?: Record<string, unknown>
  ) => {
    if (!adminProfile?.id) return;

    const payload = {
      admin_id: adminProfile.id,
      action: "Location permission",
      details: {
        status,
        ...details,
        device: getDeviceInfo(),
        timestamp: new Date().toISOString(),
      },
    };

    try {
      await supabase.from("admin_activity_logs").insert(payload);

      await supabase.from("audit_logs").insert({
        admin_id: adminProfile.id,
        action: "LOCATION_PERMISSION",
        details: payload.details,
      });
    } catch (err) {
      logDebug("Logging failed", err);
    }
  };

  /**
   * ===============================
   * GEOLOCATION FETCH
   * ===============================
   */

  const fetchLocation = () => {
    return new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: LOCATION_TIMEOUT,
        maximumAge: 0,
      });
    });
  };

  /**
   * ===============================
   * IP FALLBACK (optional)
   * ===============================
   */

  const fetchIPLocation = async () => {
    try {
      const res = await fetch("https://ipapi.co/json/");
      const data = await res.json();

      return {
        latitude: data.latitude,
        longitude: data.longitude,
        city: data.city,
        country: data.country_name,
      };
    } catch {
      return null;
    }
  };

  /**
   * ===============================
   * MAIN HANDLER
   * ===============================
   */

  const handleAllow = async () => {
    if (!adminProfile?.id || !storageKey) return;

    if (!navigator.geolocation) {
      toast({
        title: "Not supported",
        description: "Geolocation not supported.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setStatusMessage("Requesting location...");
    setErrorState(null);

    try {
      await logLocationPermission("requested", {
        permissionState,
      });

      const position = await fetchLocation();

      if (position.coords.accuracy > MIN_ACCURACY_THRESHOLD) {
        throw new Error("Low accuracy location");
      }

      await logLocationPermission("granted", {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });

      toast({
        title: "Location captured",
        description: "High accuracy location saved.",
      });

      localStorage.setItem(storageKey, "done");
      sessionStorage.setItem(sessionKey!, "done");

      setOpen(false);
    } catch (err: any) {
      logDebug("Location error", err);

      if (retryCount < MAX_RETRIES) {
        setRetryCount((prev) => prev + 1);
        setStatusMessage(`Retrying... (${retryCount + 1})`);
        handleAllow();
        return;
      }

      // fallback to IP
      setStatusMessage("Trying fallback (IP-based)...");

      const ipLocation = await fetchIPLocation();

      if (ipLocation) {
        await logLocationPermission("fallback_ip", ipLocation);

        toast({
          title: "Fallback location used",
          description: `${ipLocation.city}, ${ipLocation.country}`,
        });
      } else {
        await logLocationPermission("failed", {
          error: err?.message,
        });

        setErrorState(err?.message || "Failed");
      }

      localStorage.setItem(storageKey, "done");
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  /**
   * ===============================
   * PERMISSION CHECK
   * ===============================
   */

  useEffect(() => {
    if (!adminProfile?.id || !storageKey) return;

    if (
      localStorage.getItem(storageKey) === "done" ||
      sessionStorage.getItem(sessionKey!) === "done"
    )
      return;

    let cancelled = false;

    const init = async () => {
      try {
        const permissionsApi = (navigator as any).permissions;

        if (!permissionsApi?.query) {
          setPermissionState("unsupported");
          setOpen(true);
          return;
        }

        const status = await permissionsApi.query({ name: "geolocation" });

        if (cancelled) return;

        setPermissionState(status.state);
        setOpen(true);

        status.onchange = () => {
          setPermissionState(status.state);
        };
      } catch {
        setPermissionState("unsupported");
        setOpen(true);
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [adminProfile?.id]);

  /**
   * ===============================
   * UI HANDLERS
   * ===============================
   */

  const handleNotNow = () => {
    if (storageKey) localStorage.setItem(storageKey, "done");
    setOpen(false);
  };

  const handleRetry = () => {
    setRetryCount(0);
    handleAllow();
  };

  /**
   * ===============================
   * RENDER
   * ===============================
   */

  if (!adminProfile) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle>Enable Location Tracking</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            Allow location access to improve security logs and admin tracking.
          </p>

          <p className="text-xs text-muted-foreground">
            Your location helps detect suspicious login attempts.
          </p>

          {permissionState === "denied" && (
            <p className="text-destructive">
              Location is blocked. Please enable it from browser settings.
            </p>
          )}

          {loading && (
            <p className="text-blue-400 animate-pulse">{statusMessage}</p>
          )}

          {errorState && (
            <p className="text-red-400">Error: {errorState}</p>
          )}
        </div>

        <div className="flex justify-between mt-4">
          <Button variant="outline" onClick={handleNotNow} disabled={loading}>
            Not now
          </Button>

          <div className="flex gap-2">
            {errorState && (
              <Button variant="secondary" onClick={handleRetry}>
                Retry
              </Button>
            )}

            <Button onClick={handleAllow} disabled={loading}>
              {loading ? "Processing..." : "Allow"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LocationPermissionPrompt;
