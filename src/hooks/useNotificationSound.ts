import { useCallback, useRef, useEffect } from 'react';
  const playSound = useCallback(async () => {
    try {
      if (!hasUserInteracted.current) {
        hasUserInteracted.current = true;
      }

      const ctx = getAudioContext();

      if (ctx) {
        if (ctx.state === 'suspended') {
          await ctx.resume().catch(console.warn);
        }

        if (ctx.state === 'running') {
          const playTone = (freq: number, duration: number, start: number) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.frequency.value = freq;
            osc.type = 'sine';

            gain.gain.setValueAtTime(0.4, start);
            gain.gain.exponentialRampToValueAtTime(0.01, start + duration);

            osc.start(start);
            osc.stop(start + duration);
          };

          const now = ctx.currentTime;
          playTone(880, 0.15, now);
          playTone(1046.5, 0.15, now + 0.1);
          playTone(1318.51, 0.2, now + 0.2);

          return;
        }
      }

      // fallback
      const audio = initAudioElement();
      audio.currentTime = 0;
      audio.volume = 0.7;
      await audio.play().catch(console.warn);

    } catch (e) {
      console.warn(e);
    }
  }, []);

  const initialize = useCallback(async () => {
    if (!isInitialized.current) {
      isInitialized.current = true;

      initAudioElement();
      const ctx = getAudioContext();

      if (ctx && ctx.state === 'suspended') {
        await ctx.resume().catch(console.warn);
      }
    }
  }, []);

  return { playSound, initialize };
};

export default useNotificationSound;
