// ========== src/lib/design/index.ts ==========
// FSTIVO Design System - Central Export Point

// Import brand design tokens
import { brand, typography, spacing, borderRadius, shadows, animations, breakpoints, zIndex } from './brand';

// Export brand design tokens
export { brand, typography, spacing, borderRadius, shadows, animations, breakpoints, zIndex } from './brand';

// Export types
export type Brand = typeof brand;
export type Typography = typeof typography;
export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;
export type Shadows = typeof shadows;
export type Animations = typeof animations;
export type Breakpoints = typeof breakpoints;
export type ZIndex = typeof zIndex;

// Re-export commonly used values for convenience
export const {
  primary: { pink: brandPink, magenta: brandMagenta, purple: brandPurple, deepPurple: brandDeepPurple },
  gradient: { main: brandGradient, hover: brandGradientHover, subtle: brandGradientSubtle },
  neutral: { gray },
  semantic,
} = brand;

// Brand color utilities
export const brandColors = {
  pink: '#E94C89',
  magenta: '#D4498E',
  purple: '#9B4FCC',
  deepPurple: '#7B3FA8',
};

// CSS custom properties (for use in style attributes or components)
export const brandCSSVars = {
  '--brand-pink': brandColors.pink,
  '--brand-magenta': brandColors.magenta,
  '--brand-purple': brandColors.purple,
  '--brand-deep-purple': brandColors.deepPurple,
};

// Gradient utilities
export const gradients = {
  primary: 'linear-gradient(135deg, #E94C89 0%, #D4498E 50%, #9B4FCC 100%)',
  hover: 'linear-gradient(135deg, #F05B96 0%, #DD5599 50%, #A85CD4 100%)',
  subtle: 'linear-gradient(135deg, rgba(233, 76, 137, 0.1) 0%, rgba(155, 79, 204, 0.1) 100%)',
  text: 'linear-gradient(135deg, #E94C89, #9B4FCC)',
};

// Shadow utilities
export const brandShadows = {
  default: '0 8px 32px rgba(233, 76, 137, 0.3)',
  hover: '0 12px 40px rgba(155, 79, 204, 0.4)',
};

// Animation utilities
export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  normal: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
};

export default {
  brand,
  typography,
  spacing,
  borderRadius,
  shadows,
  animations,
  breakpoints,
  zIndex,
  brandColors,
  gradients,
  brandShadows,
  transitions,
};
