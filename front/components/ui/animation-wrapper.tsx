'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimationWrapperProps {
  children: ReactNode;
  animationType?: 'fade' | 'slide-up' | 'scale' | 'none';
  className?: string;
  delay?: number;
  duration?: number;
}

export const AnimationWrapper = ({
  children,
  animationType = 'fade',
  className = '',
  delay = 0,
  duration = 0.5,
}: AnimationWrapperProps) => {
  const animations = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    'slide-up': {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
    },
    scale: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 },
    },
    none: {
      initial: {},
      animate: {},
      exit: {},
    },
  };

  const selectedAnimation = animations[animationType];

  return (
    <motion.div
      initial={selectedAnimation.initial}
      animate={selectedAnimation.animate}
      exit={selectedAnimation.exit}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const FadeInStagger = ({ children, className = '' }: { children: ReactNode; className?: string }) => {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-100px" }}
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const FadeInItem = ({ children }: { children: ReactNode }) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
      }}
    >
      {children}
    </motion.div>
  );
};
