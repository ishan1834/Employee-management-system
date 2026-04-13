
import React, { useState, useEffect, useMemo } from 'react';


import { Card, CardContent } from '@/components/ui/card';


import { Button } from '@/components/ui/button';


import { Badge } from '@/components/ui/badge';


import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


import { Progress } from '@/components/ui/progress';


import { motion } from 'framer-motion';


import { useButtonClickSound } from '@/hooks/useButtonClickSound';


import { Star, Activity, TrendingUp } from 'lucide-react';



interface DashboardCardProps {
  title: string;
  description: string;
  iconSrc: string;
  onClick: () => void;
  badge?: string;
  isDisabled?: boolean;
  stats?: {
    label: string;
    value: string | number;
  }[];
  gradient?: string;
  glowColor?: string;
  progressValue?: number;
  favorite?: boolean;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  description,
  iconSrc,
  onClick,
  badge,
  isDisabled = false,
  stats = [],
  gradient,
  glowColor,
  progressValue = 0,
  favorite = false
}) => {
  const { playClickSound } = useButtonClickSound();



  
  const [hovered, setHovered] = useState(false);
  const [isFav, setIsFav] = useState(favorite);
  const [clickCount, setClickCount] = useState(0);

  useEffect(() => {
    if (clickCount > 5) {
      console.log('Power user detected 🚀');
    }
  }, [clickCount]);

  const handleClick = () => {
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

  const renderStats = () => {
    return stats.map((stat, index) => (
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
    ));
  };


  

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            whileHover={{ scale: isDisabled ? 1 : 1.03 }}
            transition={{ duration: 0.3 }}
          >
            <Card
              className={`
                relative overflow-hidden group rounded-2xl
                bg-black/60 backdrop-blur-xl
                border border-white/10
                transition-all duration-500
                ${!isDisabled ? 'cursor-pointer' : 'opacity-40'}
              `}
              style={{ boxShadow: !isDisabled ? dynamicShadow : 'none' }}
              onClick={handleClick}
            >
              {/* Animated gradient overlay */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 bg-gradient-to-br from-primary/10 to-secondary/10" />



              
              {/* Floating glow circles */}
              <div className="absolute -top-20 -right-20 w-52 h-52 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
              <div className="absolute -bottom-20 -left-20 w-52 h-52 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />



              
              <CardContent className="p-6 relative z-10">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <motion.img
                    src={iconSrc}
                    alt={title}
                    className="h-16 w-16 object-contain"
                    animate={{ rotate: hovered ? 5 : 0 }}
                  />


                  
                  <div className="flex gap-2">
                    {badge && (
                      <Badge className="bg-gradient-to-r from-primary to-secondary animate-pulse">
                        {badge}
                      </Badge>
                    )}


                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsFav(!isFav);
                      }}
                    >
                      <Star className={`w-5 h-5 ${isFav ? 'text-yellow-400' : 'text-muted-foreground'}`} />
                    </button>
                  </div>
                </div>

                

                {/* Title */}
                <h3 className="text-xl font-bold mb-2">{title}</h3>

                

                {/* Description */}
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {description}
                </p>

                

                {/* Stats */}
                {stats.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {renderStats()}
                  </div>
                )}

                

                {/* Progress */}
                {progressValue > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Progress</span>
                      <span>{progressValue}%</span>
                    </div>
                    <Progress value={progressValue} />
                  </div>
                )}

                

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 text-muted-foreground text-xs">
                    <Activity className="w-4 h-4" /> Active
                    <TrendingUp className="w-4 h-4" /> Growth
                  </div>

                  <Button
                    disabled={isDisabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      playClickSound();
                    }}
                    className="bg-gradient-to-r from-primary to-secondary"
                  >
                    Open
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{title} Module</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default DashboardCard;
modify this code and dont change my original code and split this code into 7 part
