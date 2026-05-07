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

type SectionRevealAnimation =
  | 'fade-up'
  | 'slide-right'
  | 'slide-left'
  | 'zoom-in'
  | 'flip-up'
  | 'rise';

const sectionAnimations: Record<
  SectionRevealAnimation,
  { initial: Record<string, unknown>; animate: Record<string, unknown> }
> = {
  'fade-up': {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
  },
  'slide-right': {
    initial: { opacity: 0, x: -60 },
    animate: { opacity: 1, x: 0 },
  },
  'slide-left': {
    initial: { opacity: 0, x: 60 },
    animate: { opacity: 1, x: 0 },
  },
  'zoom-in': {
    initial: { opacity: 0, scale: 0.92 },
    animate: { opacity: 1, scale: 1 },
  },
  'flip-up': {
    initial: { opacity: 0, rotateX: 12, y: 30 },
    animate: { opacity: 1, rotateX: 0, y: 0 },
  },
  rise: {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
  },
};

interface SectionRevealProps {
  children: ReactNode;
  animation?: SectionRevealAnimation;
  className?: string;
  duration?: number;
  delay?: number;
}

export const SectionReveal = ({
  children,
  animation = 'fade-up',
  className = '',
  duration = 0.65,
  delay = 0,
}: SectionRevealProps) => {
  const anim = sectionAnimations[animation] ?? sectionAnimations['fade-up'];
  return (
    <motion.section
      initial={anim.initial}
      whileInView={anim.animate}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.section>
  );
};

export const SectionHeading = ({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) => {
  return <div className={className}>{children}</div>;
};

export const CardStagger = ({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: { staggerChildren: 0.08 },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const CardItem = ({ children }: { children: ReactNode }) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 24, scale: 0.96 },
        show: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
        },
      }}
    >
      {children}
    </motion.div>
  );
};
