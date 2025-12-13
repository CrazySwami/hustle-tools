import type { VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithoutRef } from 'react';

/**
 * __COMPONENT_NAME__ variant configuration
 * Generated from interview decisions
 */
export type __COMPONENT_NAME__Variant = 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost';

/**
 * __COMPONENT_NAME__ size configuration
 */
export type __COMPONENT_NAME__Size = 'sm' | 'md' | 'lg';

/**
 * Props for the __COMPONENT_NAME__ component
 *
 * @property variant - Visual style variant
 * @property size - Size variant
 * @property loading - Shows loading spinner and disables interaction
 * @property disabled - Disables the component
 * @property className - Additional CSS classes
 * @property children - Content to render inside the component
 */
export interface __COMPONENT_NAME__Props
  extends ComponentPropsWithoutRef<'button'> {
  /**
   * Visual style variant
   * @default 'primary'
   */
  variant?: __COMPONENT_NAME__Variant;

  /**
   * Size variant
   * @default 'md'
   */
  size?: __COMPONENT_NAME__Size;

  /**
   * Shows loading spinner and disables interaction
   * @default false
   */
  loading?: boolean;

  /**
   * Disables the component
   * @default false
   */
  disabled?: boolean;

  /**
   * Content to render inside the component
   */
  children: React.ReactNode;
}
