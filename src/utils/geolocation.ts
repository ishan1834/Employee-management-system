if (state === "granted") {
  if (opts?.attemptPosition) {
    try {
      await requestGeolocation(opts.positionOptions);
      return { allowed: true, state };
    } catch (err: any) {
      return {
        allowed: false,
        state,
        message: getGeolocationErrorMessage(err),
      };
    }
  }
  return { allowed: true, state };
}
switch (err?.code) {
  case 1:
    return "Permission denied. Enable location access.";
  case 2:
    return "Position unavailable (network/GPS issue).";
  case 3:
    return "Request timed out.";
  default:
    return err?.message || "Unknown location error.";
}
