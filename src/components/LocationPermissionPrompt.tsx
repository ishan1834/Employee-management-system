

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
