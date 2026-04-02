import { useCallback, useRef, useEffect } from 'react';
let audioElement: HTMLAudioElement | null = null;

const initAudioElement = (): HTMLAudioElement => {
  if (!audioElement) {
    audioElement = new Audio();
    // Create an oscillator-based sound as a data URL
    const createNotificationSound = (): string => {
      // Use a pre-built notification sound via base64 or create one dynamically
      return 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgkKqrjFU0Ln+dpJxqPDJhgqGdm3Y6KExul6KZfUEqOVSFo56VdTojMT9pj6CbjHAwJjJHXomdmIVmLCc0RlmGmZWCZTAmMUNUgpORf2MuKDI/TXiOj352NDEzOkNsfIuHd1w4NDg7RWx7h4V3XDg1ODtDbHuHhHdcODU4O0Vre4eFd1w4NTg7Q2x7h4V3XDg1ODtDbHuHhXdcODU4O0Nse4eFd1w4NTg7Q2x7h4V3XDg1ODtDbHuHhXdcODU4O0Nse4eFd1w4NTg7Q2x7h4V3XA==';
    };
    audioElement.src = createNotificationSound();
    audioElement.volume = 0.6;
  }
  return audioElement;
};

// Web Audio API for better sound
let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContext;
  } catch {
    return null;
  }
};

export const useNotificationSound = () => {
  const isInitialized = useRef(false);
  const hasUserInteracted = useRef(false);
  
  // Initialize on user interaction
  useEffect(() => {
    const handleInteraction = () => {
      hasUserInteracted.current = true;
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(console.warn);
      }
      initAudioElement();
    };
    
    // Listen for any user interaction to enable audio
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
  
  const playSound = useCallback(async () => {
    try {
      // Always try to initialize on first sound attempt
      if (!hasUserInteracted.current) {
        hasUserInteracted.current = true;
      }
      
      const ctx = getAudioContext();
      
      if (ctx) {
        // Resume context if suspended
        if (ctx.state === 'suspended') {
          try {
            await ctx.resume();
          } catch (e) {
            console.warn('Failed to resume audio context:', e);
          }
        }
        
        if (ctx.state === 'running') {
          const playTone = (frequency: number, duration: number, startTime: number) => {
            try {
              const oscillator = ctx.createOscillator();
              const gainNode = ctx.createGain();
              
              oscillator.connect(gainNode);
              gainNode.connect(ctx.destination);
              
              oscillator.frequency.value = frequency;
              oscillator.type = 'sine';
              
              gainNode.gain.setValueAtTime(0.4, startTime);
              gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
              
              oscillator.start(startTime);
              oscillator.stop(startTime + duration);
            } catch (e) {
              console.warn('Tone playback failed:', e);
            }
          };
          
          // Play a pleasant notification chime
          const now = ctx.currentTime;
          playTone(880, 0.15, now);         // A5
          playTone(1046.50, 0.15, now + 0.1); // C6
          playTone(1318.51, 0.2, now + 0.2); // E6
          
          console.log('Notification sound played via Web Audio');
          return;
        }
      }
      
      // Fallback to Audio element
      const audio = initAudioElement();
      audio.currentTime = 0;
      audio.volume = 0.7;
      await audio.play().catch((e) => {
        console.warn('Audio element playback failed:', e);
      });
      
    } catch (error) {
      console.warn('Could not play notification sound:', error);
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
