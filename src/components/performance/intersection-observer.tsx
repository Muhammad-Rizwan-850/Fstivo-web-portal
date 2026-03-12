'use client';

import React, { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverProps {
  threshold?: number;
  rootMargin?: string;
}

export function useIntersectionObserver({
  threshold = 0,
  rootMargin = '50px'
}: UseIntersectionObserverProps = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold, rootMargin }
    );

    const currentTarget = targetRef.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [threshold, rootMargin]);

  return { targetRef, isIntersecting };
}

// Usage component
export function LazyLoadSection({ children }: { children: React.ReactNode }) {
  const { targetRef, isIntersecting } = useIntersectionObserver({
    rootMargin: '100px'
  });

  return (
    <div ref={targetRef}>
      {isIntersecting ? children : <div className="h-64 bg-gray-100 animate-pulse" />}
    </div>
  );
}
