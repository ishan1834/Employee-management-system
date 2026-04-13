import React from 'react';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { motion } from 'framer-motion';

import CardContainer from './CardContainer';
import CardContentSection from './CardContentSection';
import useDashboardCardLogic from './useDashboardCardLogic';

const DashboardCard = (props: any) => {
  const logic = useDashboardCardLogic(props);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            onMouseEnter={logic.setHoveredTrue}
            onMouseLeave={logic.setHoveredFalse}
            whileHover={{ scale: props.isDisabled ? 1 : 1.03 }}
            transition={{ duration: 0.3 }}
          >
            <CardContainer {...props} {...logic}>
              <CardContentSection {...props} {...logic} />
            </CardContainer>
          </motion.div>
        </TooltipTrigger>

        <TooltipContent>
          <p>{props.title} Module</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
  import { useState, useEffect, useMemo } from 'react';
import { useButtonClickSound } from '@/hooks/useButtonClickSound';

const useDashboardCardLogic = ({
  glowColor,
  isDisabled,
  onClick,
  favorite
}: any) => {
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

  return {
    hovered,
    isFav,
    setIsFav,
    handleClick,
    dynamicShadow,
    playClickSound,
    setHoveredTrue: () => setHovered(true),
    setHoveredFalse: () => setHovered(false)
  };
};

export default useDashboardCardLogic;
};

export default DashboardCard;
import { Card } from '@/components/ui/card';

const CardContainer = ({ children, isDisabled, dynamicShadow, handleClick }: any) => {
  return (
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
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 bg-gradient-to-br from-primary/10 to-secondary/10" />

      <div className="absolute -top-20 -right-20 w-52 h-52 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-20 -left-20 w-52 h-52 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />

      {children}
    </Card>
  );
};

export default CardContainer;
