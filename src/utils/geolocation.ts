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
