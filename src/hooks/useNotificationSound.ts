import { useCallback, useRef, useEffect } from 'react';

// Audio element for notification sound
let audioElement: HTMLAudioElement | null = null;

const initAudioElement = (): HTMLAudioElement => {
  if (!audioElement) {
    audioElement = new Audio();

    const createNotificationSound = (): string => {
      return 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgkKqrjFU0Ln+dpJxqPDJhgqGdm3Y6KExul6KZfUEqOVSFo56VdTojMT9pj6CbjHAwJjJHXomdmIVmLCc0RlmGmZWCZTAmMUNUgpORf2MuKDI/TXiOj352NDEzOkNsfIuHd1w4NDg7RWx7h4V3XDg1ODtDbHuHhHdcODU4O0Vre4eFd1w4NTg7Q2x7h4V3XDg1ODtDbHuHhXdcODU4O0Nse4eFd1w4NTg7Q2x7h4V3XDg1ODtDbHuHhXdcODU4O0Nse4eFd1w4NTg7Q2x7h4V3XA==';
    };

    audioElement.src = createNotificationSound();
    audioElement.volume = 0.6;
  }
  return audioElement;
};
