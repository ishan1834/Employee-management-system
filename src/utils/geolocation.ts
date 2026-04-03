export type GeoPermissionState = PermissionState | "unsupported";

const GEO_GRANT_STORAGE_KEY = "geo_location_granted_v1";

export const setGeolocationGrantedFlag = (granted: boolean) => {
  try {
    localStorage.setItem(GEO_GRANT_STORAGE_KEY, granted ? "true" : "false");
  } catch {
    // ignore
  }
};

export const getGeolocationGrantedFlag = () => {
  try {
    return localStorage.getItem(GEO_GRANT_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
};

export const getGeolocationPermissionState = async (): Promise<GeoPermissionState> => {
  const permissionsApi = (navigator as any).permissions;
  if (!permissionsApi?.query) return "unsupported";

  try {
    const status = await permissionsApi.query({ name: "geolocation" as any });
    return status.state as PermissionState;
  } catch {
    return "unsupported";
  }
};

export const requestGeolocation = async (options?: PositionOptions) => {
  if (!navigator.geolocation) {
    throw new Error("Geolocation is not supported by your browser");
  }

  return await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0,
      ...(options || {}),
    });
  });
};

export const getGeolocationErrorMessage = (err: any) => {
  const code = err?.code;

  // Standard GeolocationPositionError codes
  if (code === 1) return "Location access denied. Please enable it in browser settings and try again.";
  if (code === 2) return "Location information is unavailable. Please try again.";
  if (code === 3) return "Location request timed out. Please try again.";

  if (typeof err?.message === "string" && err.message.trim()) return err.message;
  return "Unable to access location. Please try again.";
};

export const checkGeolocationAccess = async (opts?: {
  attemptPosition?: boolean;
  positionOptions?: PositionOptions;
}): Promise<{ allowed: boolean; state: GeoPermissionState; message?: string }> => {
  if (!navigator.geolocation) {
    return {
      allowed: false,
      state: "unsupported",
      message: "Geolocation is not supported by your browser.",
    };
  }

  const state = await getGeolocationPermissionState();

  if (state === "denied") {
    return {
      allowed: false,
      state,
      message: "Location is blocked. Please enable it in your browser settings.",
    };
  }

  if (state === "granted") {
    return { allowed: true, state };
  }

  if (!opts?.attemptPosition) {
    return {
      allowed: false,
      state,
      message: "Location permission is required.",
    };
  }

  try {
    await requestGeolocation({
      enableHighAccuracy: false,
      timeout: 6000,
      maximumAge: 60000,
      ...(opts.positionOptions || {}),
    });

    return { allowed: true, state };
  } catch (err: any) {
    return {
      allowed: false,
      state,
      message: getGeolocationErrorMessage(err),
    };
  }
};
