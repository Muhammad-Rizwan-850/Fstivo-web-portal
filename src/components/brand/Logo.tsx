'use client';

import { cn } from '@/lib/utils';

interface LogoProps {
  variant?: 'default' | 'white' | 'black' | 'gradient';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showTagline?: boolean;
}

export function Logo({
  variant = 'default',
  size = 'md',
  className,
  showTagline = false
}: LogoProps) {
  const sizes = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16',
    xl: 'h-24',
  } as const;

  // Choose asset based on variant — use the same SVG for most variants,
  // CSS or alternative assets can be added if designer provides them.
  const src = '/brand/fstivo-wordmark.svg';

  const imgClass = cn(sizes[size], 'w-auto');

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <img src={src} alt="Fstivo" className={imgClass} />

      {showTagline && (
        <p className={cn(
          'text-gray-600 font-medium mt-2',
          size === 'sm' && 'text-xs',
          size === 'md' && 'text-sm',
          size === 'lg' && 'text-base',
          size === 'xl' && 'text-lg',
        )}>
          Events Made Simple
        </p>
      )}
    </div>
  );
}

// Simplified icon-only version — uses the new icon asset in /public/brand
export function LogoIcon({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizes = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
  } as const;

  const src = '/brand/fstivo-icon.svg';

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="Fstivo" className={cn(sizes[size], className)} />
  );
}
