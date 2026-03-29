

  useEffect(() => {
    if (!adminProfile?.id || !storageKey) return;

    if (localStorage.getItem(storageKey) === "done") return;

    let cancelled = false;

    const run = async () => {
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

        // Always open once so user can explicitly trigger the browser prompt (user gesture)
        setOpen(true);

        status.onchange = () => {
          setPermissionState(status.state);
        };
      } catch (e) {
        setPermissionState("unsupported");
        setOpen(true);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [adminProfile?.id, storageKey]);

  const logLocationPermission = async (status: string, details?: Record<string, unknown>) => {
    if (!adminProfile?.id) return;

    const payload = {
      admin_id: adminProfile.id,
      action: "Location permission",
      details: {
        status,
        ...(details || {}),
        timestamp: new Date().toISOString(),
      },
    } as any;

    await supabase.from("admin_activity_logs").insert(payload);

    await supabase.from("audit_logs").insert({
      admin_id: adminProfile.id,
      action: "LOCATION_PERMISSION",
      details: payload.details,
    } as any);
  };

  const handleAllow = async () => {
    if (!adminProfile?.id || !storageKey) return;

    if (!navigator.geolocation) {
      toast({
        title: "Not supported",
        description: "Your browser does not support location access.",
        variant: "destructive",
      });
      localStorage.setItem(storageKey, "done");
      setOpen(false);
      return;
    }

    setLoading(true);
    try {
      await logLocationPermission("requested", {
        permissionState,
        userAgent: navigator.userAgent,
      });

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      });

      await logLocationPermission("granted", {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });

      toast({
        title: "Location enabled",
        description: "Location permission saved in logs.",
      });

      localStorage.setItem(storageKey, "done");
      setOpen(false);
    } catch (err: any) {
      await logLocationPermission("denied_or_failed", {
        errorName: err?.name,
        errorMessage: err?.message,
      });

      toast({
        title: "Location not enabled",
        description: err?.message || "Permission denied.",
        variant: "destructive",
      });

      localStorage.setItem(storageKey, "done");
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleNotNow = () => {
    if (storageKey) localStorage.setItem(storageKey, "done");
    setOpen(false);
  };

  if (!adminProfile) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle>Enable location for login logs</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            We can record your login location more accurately if you allow browser location access.
          </p>
          {permissionState === "denied" && (
            <p className="text-destructive">
              Location is currently blocked in your browser settings.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleNotNow} disabled={loading}>
            Not now
          </Button>
          <Button onClick={handleAllow} disabled={loading}>
            {loading ? "Requesting..." : "Allow location"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LocationPermissionPrompt;
