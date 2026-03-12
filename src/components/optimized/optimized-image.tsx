'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ComponentProps<typeof Image> {
  fallback?: string;
  aspectRatio?: '16/9' | '4/3' | '1/1' | '3/2';
}

export function OptimizedImage({
  src,
  alt,
  fallback = '/images/placeholder.jpg',
  aspectRatio,
  className,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const aspectRatioClasses = {
    '16/9': 'aspect-video',
    '4/3': 'aspect-4/3',
    '1/1': 'aspect-square',
    '3/2': 'aspect-3/2'
  };

  return (
    <div className={cn('relative overflow-hidden', aspectRatio && aspectRatioClasses[aspectRatio])}>
      <Image
        src={hasError ? fallback : src}
        alt={alt}
        className={cn(
          'transition-opacity duration-300',
          isLoading && 'opacity-0',
          !isLoading && 'opacity-100',
          className
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
        {...props}
      />
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
    </div>
  );
}
