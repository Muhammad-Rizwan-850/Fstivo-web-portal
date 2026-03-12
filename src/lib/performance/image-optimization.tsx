'use client';

/**
 * FSTIVO Image Optimization
 * Blur placeholders, AVIF/WebP support, and lazy loading
 */

'use client';

import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
// import { Box } from '@radix-ui/themes';

// Simple Box component replacement
const Box = ({ children, ...props }: any) => <div {...props}>{children}</div>;

// =====================================================
// TYPES
// =====================================================

export interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  className?: string;
  blurDataURL?: string;
  quality?: number;
  sizes?: string;
}

// =====================================================
// BLUR PLACEHOLDER GENERATION
// =====================================================

/**
 * Generate a blur placeholder from image URL
 * Creates a base64-encoded tiny blur image
 */
export function generateBlurPlaceholder(
  imageUrl: string
): string | undefined {
  // Return different placeholder based on image type
  if (imageUrl.includes('event')) {
    // Event image placeholder - purple gradient
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzlFM0MzRCIvPjwvc3ZnPg==';
  } else if (imageUrl.includes('avatar')) {
    // Avatar placeholder - gray gradient
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI0QxRDVEOCIvPjwvc3ZnPg==';
  }

  return undefined;
}

/**
 * Generate a colored placeholder based on string
 */
export function generateColorPlaceholder(
  seed: string,
  width: number = 10,
  height: number = 10
): string {
  // Simple hash function to generate consistent colors
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }

  const r = (hash & 0xff0000) >> 16;
  const g = (hash & 0x00ff00) >> 8;
  const b = hash & 0x0000ff;

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="rgb(${r},${g},${b})"/>
    </svg>
  `;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

// =====================================================
// IMAGE FORMAT DETECTION
// =====================================================

/**
 * Check if browser supports AVIF
 */
export function supportsAVIF(): boolean {
  if (typeof window === 'undefined') return false;

  const avif = 'image/avif';
  const canvas = document.createElement('canvas');
  return canvas.toDataURL(avif).indexOf(`data:${avif}`) === 0;
}

/**
 * Check if browser supports WebP
 */
export function supportsWebP(): boolean {
  if (typeof window === 'undefined') return false;

  const webp = 'image/webp';
  const canvas = document.createElement('canvas');
  return canvas.toDataURL(webp).indexOf(`data:${webp}`) === 0;
}

// =====================================================
// OPTIMIZED IMAGE COMPONENT
// =====================================================

/**
 * Optimized image component with blur placeholder
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill,
  priority,
  className,
  blurDataURL,
  quality = 75,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // Auto-generate blur placeholder if not provided
  const blur = blurDataURL || generateBlurPlaceholder(src);

  const handleError = () => {
    setIsLoading(false);
    setError(true);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  // Fallback UI
  if (error) {
    return (
      <Box
        className={className}
        style={{
          backgroundColor: '#f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...(fill ? { position: 'absolute', inset: 0 } : {}),
          ...(width && !fill ? { width } : {}),
          ...(height && !fill ? { height } : {}),
        }}
      >
        <span className="text-gray-400 text-sm">Image not available</span>
      </Box>
    );
  }

  return (
    <div className={className} style={{ position: 'relative' }}>
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        quality={quality}
        placeholder={blur ? 'blur' : 'empty'}
        blurDataURL={blur}
        onLoad={handleLoad}
        onError={handleError}
        className={`transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </div>
  );
}

// =====================================================
// RESPONSIVE IMAGE SIZES
// =====================================================

/**
 * Generate sizes attribute for responsive images
 */
export function getImageSizes(type: 'hero' | 'card' | 'thumbnail' | 'avatar'): string {
  const sizes = {
    hero: '(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px',
    card: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
    thumbnail: '(max-width: 768px) 50vw, 33vw',
    avatar: '64px',
  };

  return sizes[type];
}

// =====================================================
// IMAGE QUALITY SETTINGS
// =====================================================

/**
 * Get optimal quality based on image type
 */
export function getOptimalQuality(type: 'hero' | 'card' | 'thumbnail' | 'avatar'): number {
  const qualities = {
    hero: 85,
    card: 75,
    thumbnail: 60,
    avatar: 70,
  };

  return qualities[type];
}

// =====================================================
// LAZY LOADING IMAGES
// =====================================================

/**
 * Lazy load image component
 */
export function LazyImage({
  src,
  alt,
  className,
  ...props
}: OptimizedImageProps & { threshold?: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(props.priority || false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shouldLoad) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          setIsVisible(true);
        }
      },
      { threshold: props.threshold || 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [props.threshold, shouldLoad]);

  return (
    <div ref={imgRef} className={className}>
      {shouldLoad ? (
        <OptimizedImage
          src={src}
          alt={alt}
          className={`transition-opacity duration-300 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
          {...props}
        />
      ) : (
        <Box
          style={{
            backgroundColor: '#f3f4f6',
            ...(props.fill ? { position: 'absolute', inset: 0 } : {}),
            ...(props.width && !props.fill ? { width: props.width } : {}),
            ...(props.height && !props.fill ? { height: props.height } : {}),
          }}
        />
      )}
    </div>
  );
}

// =====================================================
// AVATAR COMPONENT
// =====================================================

interface AvatarProps {
  src?: string | null;
  alt: string;
  name?: string;
  size?: number;
  className?: string;
}

/**
 * Optimized avatar component with fallback
 */
export function OptimizedAvatar({
  src,
  alt,
  name,
  size = 40,
  className,
}: AvatarProps) {
  const blur = generateColorPlaceholder(name || alt);

  if (!src) {
    // Fallback to initials
    const initials = name
      ? name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : alt.slice(0, 2).toUpperCase();

    return (
      <Box
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          backgroundColor: '#9E33C4',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          fontSize: size / 2.5,
        }}
      >
        {initials}
      </Box>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full ${className || ''}`}
      blurDataURL={blur}
      quality={getOptimalQuality('avatar')}
      sizes={getImageSizes('avatar')}
    />
  );
}

// =====================================================
// EVENT IMAGE COMPONENT
// =====================================================

interface EventImageProps {
  src?: string | null;
  alt: string;
  priority?: boolean;
  className?: string;
}

/**
 * Optimized event image with aspect ratio
 */
export function OptimizedEventImage({
  src,
  alt,
  priority,
  className,
}: EventImageProps) {
  if (!src) {
    return (
      <Box
        className={className}
        style={{
          aspectRatio: '16/9',
          backgroundColor: '#f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span className="text-gray-400">No image</span>
      </Box>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      fill
      priority={priority}
      className={className}
      quality={getOptimalQuality('card')}
      sizes={getImageSizes('card')}
    />
  );
}

// =====================================================
// EXPORTS
// =====================================================

export default {
  OptimizedImage,
  LazyImage,
  OptimizedAvatar,
  OptimizedEventImage,
  generateBlurPlaceholder,
  generateColorPlaceholder,
  supportsAVIF,
  supportsWebP,
  getImageSizes,
  getOptimalQuality,
};
