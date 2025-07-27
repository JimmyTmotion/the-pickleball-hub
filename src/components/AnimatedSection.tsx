import React, { ReactNode } from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  animation?: 'fade-up' | 'fade-in' | 'scale-in' | 'slide-in-left' | 'slide-in-right';
  delay?: number;
}

const AnimatedSection = ({ 
  children, 
  className = '', 
  animation = 'fade-up',
  delay = 0 
}: AnimatedSectionProps) => {
  const { elementRef, isVisible } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px',
  });

  const getAnimationClasses = () => {
    const baseClasses = 'transition-all duration-500 ease-out';
    
    if (!isVisible) {
      switch (animation) {
        case 'fade-up':
          return `${baseClasses} opacity-0 translate-y-8`;
        case 'fade-in':
          return `${baseClasses} opacity-0`;
        case 'scale-in':
          return `${baseClasses} opacity-0 scale-95`;
        case 'slide-in-left':
          return `${baseClasses} opacity-0 -translate-x-8`;
        case 'slide-in-right':
          return `${baseClasses} opacity-0 translate-x-8`;
        default:
          return `${baseClasses} opacity-0 translate-y-8`;
      }
    }
    
    return `${baseClasses} opacity-100 translate-y-0 translate-x-0 scale-100`;
  };

  return (
    <div 
      ref={elementRef}
      className={`${getAnimationClasses()} ${className}`}
      style={{ 
        transitionDelay: `${delay}ms` 
      }}
    >
      {children}
    </div>
  );
};

export default AnimatedSection;