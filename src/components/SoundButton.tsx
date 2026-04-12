import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useButtonClickSound } from '@/hooks/useButtonClickSound';
import { cn } from "@/lib/utils"; // Standard shadcn utility

// ─── Types ────────────────────────────────────────────────────────────────────

export type SoundType = 'click' | 'hover' | 'success' | 'error' | 'switch';

export interface SoundButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  enableSound?: boolean;
  clickSound?: SoundType;
  hoverSound?: SoundType;
  volume?: number;
  haptic?: boolean;
  hapticDuration?: number | number[];
  loading?: boolean;
  loadingLabel?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  // Custom motion props if you want to override defaults
  motionProps?: any; 
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
      haptic = true,
      hapticDuration = 15,
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

    // Internal Haptic Trigger
    const triggerHaptic = () => {
      if (haptic && typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(hapticDuration);
      }
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (loading || disabled) return;
      
      if (enableSound) playSound(clickSound);
      triggerHaptic();
      
      onClick?.(e);
    };

    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!loading && !disabled && enableSound && hoverSound) {
        playSound(hoverSound);
      }
      onMouseEnter?.(e);
    };

    return (
      <motion.div
        whileTap={(!disabled && !loading) ? { scale: 0.97 } : {}}
        className={cn("inline-block w-full sm:w-auto", className)}
      >
        <Button
          ref={ref}
          variant={variant}
          size={size}
          disabled={disabled || loading}
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          className="relative w-full overflow-hidden transition-all duration-200"
          {...props}
        >
          {/* Use AnimatePresence for a smooth spinner transition */}
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y:
