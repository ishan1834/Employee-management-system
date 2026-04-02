import { useCallback, useRef, useEffect } from 'react';
export const useNotificationSound = () => {
  const isInitialized = useRef(false);
  const hasUserInteracted = useRef(false);

  useEffect(() => {
    const handleInteraction = () => {
      hasUserInteracted.current = true;

      const ctx = getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(console.warn);
      }

      initAudioElement();
    };

    const events = ['click', 'keydown', 'touchstart', 'scroll'];
    events.forEach(event => {
      window.addEventListener(event, handleInteraction, { once: true, passive: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleInteraction);
      });
    };
  }, []);
