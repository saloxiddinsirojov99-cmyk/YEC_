'use client';

import { useEffect, useRef, useState } from 'react';

export default function ScrollReveal({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    // Safety fallback: if observer fails, show content after 1.5s
    const timer = setTimeout(() => setIsVisible(true), 1500);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`${className} transition-[opacity,transform] duration-500 ease-premium-in-out ${
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-[0.98]'
      }`}
    >
      {children}
    </div>
  );
}
