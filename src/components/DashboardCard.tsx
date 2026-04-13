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
};

export default DashboardCard;
