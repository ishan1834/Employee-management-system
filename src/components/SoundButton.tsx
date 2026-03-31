import React, { useCallback } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useButtonClickSound } from '@/hooks/useButtonClickSound';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SoundType = 'click' | 'hover' | 'success' | 'error' | 'switch';

export interface SoundButtonProps extends Omit<HTMLMotionProps<"button">, 'ref'> {
  /** Enable or disable all sounds. Default: true */
  enableSound?: boolean;
  /** Which sound to play on click. Default: 'click' */
  clickSound?: SoundType;
  /** Which sound to play on hover. Default: none */
  hoverSound?: SoundType;
  /** Volume level 0–1. Default: 1 */
  volume?: number;
  /** Enable haptic feedback on mobile (navigator.vibrate). Default: false */
  haptic?: boolean;
  /** Haptic vibration duration in ms or pattern. Default: 30 */
  hapticDuration?: number | number[];
  /** Show loading spinner and disable interaction while true */
  loading?: boolean;
  /** Accessible label shown during loading */
  loadingLabel?: string;
  /** The base shadcn button variant */
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  /** The base shadcn button size */
  size?: "default" | "sm" | "lg" | "icon";
}

// ─── Component ────────────────────────────────────────────────────────────────

const SoundButton = React.forwardRef<HTMLButtonElement, SoundButtonProps>(
  (
    {
      onClick,
      onMouseEnter,
      enableSound = true,
      clickSound = 'click',
      hoverSound,
      volume = 1,
      haptic = true, // Enabled by default for tactile feel
      hapticDuration = 15, // Shorter is usually "snappier"
      loading = false,
      loadingLabel = 'Processing...',
      disabled,
      children,
      variant = "default",
      size = "default",
      className,
      ...props
    },
    ref
  ) => {
    const { playSound } = useButtonClickSound({ volume });

    // Memoized haptic trigger to prevent re-renders
    const triggerHaptic = useCallback(() => {
      if (haptic && typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(hapticDuration);
      }
    }, [haptic, hapticDuration]);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (loading || disabled) return;
      
      if (enableSound) playSound(clickSound);
      triggerHaptic();
      
      if (onClick) onClick(e as any);
    };

    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!loading && !disabled && enableSound && hoverSound) {
        playSound(hoverSound);
      }
      if (onMouseEnter) onMouseEnter(e as any);
    };

    return (
      <motion.div
        whileTap={{ scale: (disabled || loading) ? 1 : 0.96 }}
        className="
