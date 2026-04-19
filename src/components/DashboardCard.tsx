import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { useButtonClickSound } from '@/hooks/useButtonClickSound';
import { Star, Activity, TrendingUp } from 'lucide-react';

// ==========================================
// 1. TYPES & INTERFACES
// ==========================================
interface StatItem {
  label: string;
  value: string | number;
}

interface DashboardCardProps {
  title: string;
  description: string;
  iconSrc: string;
  onClick: () => void;
  badge?: string;
  isDisabled?: boolean;
  stats?: StatItem[];
  gradient?: string;
  glowColor?: string;
  progressValue?: number;
  favorite?: boolean;
}

// ==========================================
// 2. CARD BACKGROUND (FX & GLOW)
// ==========================================
const CardVisualEffects: React.FC<{ hovered: boolean }> = ({ hovered }) => (
  <>
    {/* Animated gradient overlay */}
    <div 
      className={`absolute inset-0 transition-opacity duration-500 bg-gradient-to-br from-primary/10 to-secondary/10 ${
        hovered ? 'opacity-100' : 'opacity-0'
      }`} 
    />
    {/* Floating glow circles */}
    <div className="absolute -top-20 -right-20 w-52 h-52 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
    <div className="absolute -bottom-20 -left-20 w-52 h-52 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
  </>
);

// ==========================================
// 3. CARD HEADER (ICON & ACTIONS)
// ==========================================
const CardHeaderActions: React.FC<{
  iconSrc: string;
  title: string;
  hovered: boolean;
  badge?: string;
  isFav: boolean;
  onFavToggle: (e: React.MouseEvent) => void;
}> = ({ iconSrc, title, hovered, badge, isFav, onFavToggle }) => (
  <div className="flex justify-between items-start mb-4">
    <motion.img
      src={iconSrc}
      alt={title}
      className="h-16 w-16 object-contain"
      animate={{ rotate: hovered ? 5 : 0 }}
    />
    <div className="flex gap-2">
      {badge && (
        <Badge className="bg-gradient-to-r from-primary to-secondary animate-pulse text-white">
          {badge}
        </Badge>
      )}
      <button
        onClick={onFavToggle}
        className="transition-transform active:scale-90"
      >
        <Star className={`w-5 h-5 ${isFav ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
      </button>
    </div>
  </div>
);

// ==========================================
// 4. STATS GRID COMPONENT
// ==========================================
const StatsGrid: React.FC<{ stats: StatItem[] }> = ({ stats }) => (
  <div className="grid grid-cols-2 gap-3 mb-4">
    {stats.map((stat, index) => (
      <motion.div
        key={index}
        whileHover={{ scale: 1.05 }}
        className="text-center p-3 rounded-xl bg-black/40 border border-white/10 backdrop-blur-lg"
      >
        <p className="text-xs text-muted-foreground">{stat.label}</p>
        <p className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          {stat.value}
        </p>
      </motion.div>
    ))}
  </div>
);

// ==========================================
// 5. PROGRESS SECTION
// ==========================================
const ProgressSection: React.FC<{ value: number }> = ({ value }) => (
  <div className="mb-4">
    <div className="flex justify-between text-xs mb-1">
      <span className="text-muted-foreground">Completion</span>
      <span className="font-mono">{value}%</span>
    </div>
    <Progress value={value} className="h-1.5" />
  </div>
);

// ==========================================
// 6. CARD FOOTER (META & BUTTON)
// ==========================================
const CardFooterActions: React.FC<{
  isDisabled: boolean;
  onOpenClick: (e: React.MouseEvent) => void;
}> = ({ isDisabled, onOpenClick }) => (
  <div className="flex items-center justify-between mt-auto">
    <div className="flex gap-3 text-muted-foreground text-[10px] uppercase tracking-wider">
      <span className="flex items-center gap-1"><Activity className="w-3 h-3 text-green-500" /> Active</span>
      <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-blue-500" /> Growth</span>
    </div>
    <Button
      disabled={isDisabled}
      onClick={onOpenClick}
      size="sm"
      className="bg-gradient-to-r from-primary to-secondary hover:shadow-[0_0_15px_rgba(124,58,237,0.5)] transition-shadow"
    >
      Open
    </Button>
  </div>
);

// ==========================================
// 7. MAIN ASSEMBLED COMPONENT
// ==========================================
const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  description,
  iconSrc,
  onClick,
  badge,
  isDisabled = false,
  stats = [],
  glowColor,
  progressValue = 0,
  favorite = false
}) => {
  const { playClickSound } = useButtonClickSound();
  const [hovered, setHovered] = useState(false);
  const [isFav, setIsFav] = useState(favorite);
  const [clickCount, setClickCount] = useState(0);

  // Power user logic
  useEffect(() => {
    if (clickCount > 5) console.log('Power user detected 🚀');
  }, [clickCount]);

  const handleMainClick = () => {
    if (!isDisabled) {
      playClickSound();
      setClickCount((prev) => prev + 1);
      onClick();
    }
  };

  const dynamicShadow = useMemo(() => {
    return glowColor
      ? `0 0 40px ${glowColor}, 0 0 80px ${glowColor}`
      : '0 0 30px rgba(124,58,237,0.3), 0 0 60px rgba(124,58,237,0.15)';
  }, [glowColor]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            whileHover={{ scale: isDisabled ? 1 : 1.03 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <Card
              className={`
                relative h-full overflow-hidden group rounded-2xl
                bg-black/60 backdrop-blur-xl border border-white/10
                transition-all duration-500
                ${!isDisabled ? 'cursor-pointer' : 'opacity-40 select-none'}
              `}
              style={{ boxShadow: !isDisabled && hovered ? dynamicShadow : 'none' }}
              onClick={handleMainClick}
            >
              <CardVisualEffects hovered={hovered} />

              <CardContent className="p-6 relative z-10 flex flex-col h-full">
                <CardHeaderActions 
                  iconSrc={iconSrc} 
                  title={title} 
                  hovered={hovered} 
                  badge={badge} 
                  isFav={isFav} 
                  onFavToggle={(e) => {
                    e.stopPropagation();
                    setIsFav(!isFav);
                  }}
                />

                <div className="mb-4">
                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                    {title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 italic">
                    {description}
                  </p>
                </div>

                {stats.length > 0 && <StatsGrid stats={stats} />}
                {progressValue > 0 && <ProgressSection value={progressValue} />}

                <CardFooterActions 
                  isDisabled={isDisabled} 
                  onOpenClick={(e) => {
                    e.stopPropagation();
                    playClickSound();
                  }}
                />
              </CardContent>
            </Card>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Access the {title} configuration</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default DashboardCard;
