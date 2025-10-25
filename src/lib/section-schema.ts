/**
 * Section Schema & Data Structures
 * Defines the shape of HTML/CSS/JS sections and their settings
 */

// Unit types for CSS measurements
export type CSSUnit = 'px' | '%' | 'em' | 'rem' | 'vh' | 'vw';

// Spacing value with unit
export interface SpacingValue {
  top: number;
  right: number;
  bottom: number;
  left: number;
  unit: CSSUnit;
}

// Background types
export type BackgroundType = 'none' | 'color' | 'gradient' | 'image';

export interface BackgroundSettings {
  type: BackgroundType;
  color?: string;
  gradientStart?: string;
  gradientEnd?: string;
  gradientAngle?: number;
  imageUrl?: string;
  imageSize?: 'cover' | 'contain' | 'auto';
  imagePosition?: string;
  imageRepeat?: 'repeat' | 'no-repeat' | 'repeat-x' | 'repeat-y';
}

// Border settings
export interface BorderSettings {
  width: SpacingValue;
  color: string;
  style: 'solid' | 'dashed' | 'dotted' | 'none';
  radius: {
    topLeft: number;
    topRight: number;
    bottomRight: number;
    bottomLeft: number;
    unit: CSSUnit;
  };
}

// Shadow settings
export interface ShadowSettings {
  horizontal: number;
  vertical: number;
  blur: number;
  spread: number;
  color: string;
}

// Animation types
export type AnimationType =
  | 'none'
  | 'fadeIn'
  | 'fadeInUp'
  | 'fadeInDown'
  | 'fadeInLeft'
  | 'fadeInRight'
  | 'slideInUp'
  | 'slideInDown'
  | 'slideInLeft'
  | 'slideInRight'
  | 'zoomIn'
  | 'zoomOut'
  | 'bounce'
  | 'pulse';

export type AnimationDuration = 'fast' | 'normal' | 'slow';

export interface AnimationSettings {
  type: AnimationType;
  duration: AnimationDuration;
  delay: number; // in milliseconds
}

// Layout settings
export interface LayoutSettings {
  margin: SpacingValue;
  padding: SpacingValue;
  width: {
    value: number;
    unit: CSSUnit;
  };
  maxWidth: {
    value: number;
    unit: CSSUnit;
  };
  height: {
    value: number;
    unit: CSSUnit;
  };
  minHeight: {
    value: number;
    unit: CSSUnit;
  };
}

// Advanced settings
export interface AdvancedSettings {
  customClasses: string[];
  zIndex: number;
  position: 'relative' | 'absolute' | 'fixed' | 'sticky';
  opacity: number; // 0-1
  cssFilters: {
    blur: number;
    brightness: number;
    contrast: number;
  };
}

// Complete section settings
export interface SectionSettings {
  layout: LayoutSettings;
  background: BackgroundSettings;
  border: BorderSettings;
  shadow: ShadowSettings;
  animation: AnimationSettings;
  advanced: AdvancedSettings;
}

// Main Section interface
export interface Section {
  id: string;
  name: string;
  html: string;
  css: string;
  js: string;
  php?: string; // Elementor widget PHP code (optional)
  settings: SectionSettings;
  createdAt: number;
  updatedAt: number;
}

// Style Kit interface - reusable CSS stylesheets
export interface StyleKit {
  id: string;
  name: string;
  css: string;
  isDefault: boolean; // True for WordPress default stylesheet
  isActive: boolean; // Only one can be active at a time
  createdAt: number;
  updatedAt: number;
}

// Default values
export const defaultSpacing: SpacingValue = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  unit: 'px'
};

export const defaultLayoutSettings: LayoutSettings = {
  margin: { ...defaultSpacing },
  padding: { ...defaultSpacing },
  width: { value: 100, unit: '%' },
  maxWidth: { value: 1200, unit: 'px' },
  height: { value: 0, unit: 'px' },
  minHeight: { value: 0, unit: 'px' }
};

export const defaultBackgroundSettings: BackgroundSettings = {
  type: 'none'
};

export const defaultBorderSettings: BorderSettings = {
  width: { ...defaultSpacing },
  color: '#000000',
  style: 'solid',
  radius: {
    topLeft: 0,
    topRight: 0,
    bottomRight: 0,
    bottomLeft: 0,
    unit: 'px'
  }
};

export const defaultShadowSettings: ShadowSettings = {
  horizontal: 0,
  vertical: 0,
  blur: 0,
  spread: 0,
  color: 'rgba(0, 0, 0, 0.1)'
};

export const defaultAnimationSettings: AnimationSettings = {
  type: 'none',
  duration: 'normal',
  delay: 0
};

export const defaultAdvancedSettings: AdvancedSettings = {
  customClasses: [],
  zIndex: 1,
  position: 'relative',
  opacity: 1,
  cssFilters: {
    blur: 0,
    brightness: 100,
    contrast: 100
  }
};

export const defaultSectionSettings: SectionSettings = {
  layout: defaultLayoutSettings,
  background: defaultBackgroundSettings,
  border: defaultBorderSettings,
  shadow: defaultShadowSettings,
  animation: defaultAnimationSettings,
  advanced: defaultAdvancedSettings
};

// Create a new section with defaults
export function createSection(partial?: Partial<Section>): Section {
  return {
    id: partial?.id || `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: partial?.name || 'Untitled Section',
    html: partial?.html || '',
    css: partial?.css || '',
    js: partial?.js || '',
    settings: partial?.settings || defaultSectionSettings,
    createdAt: partial?.createdAt || Date.now(),
    updatedAt: Date.now()
  };
}

// Create a new style kit with defaults
export function createStyleKit(partial?: Partial<StyleKit>): StyleKit {
  return {
    id: partial?.id || `stylekit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: partial?.name || 'Untitled Style Kit',
    css: partial?.css || '',
    isDefault: partial?.isDefault || false,
    isActive: partial?.isActive || false,
    createdAt: partial?.createdAt || Date.now(),
    updatedAt: Date.now()
  };
}

// Convert section settings to inline CSS
export function sectionSettingsToCSS(settings: SectionSettings): string {
  const css: string[] = [];

  // Layout
  const { margin, padding, width, maxWidth, height, minHeight } = settings.layout;

  if (margin.top || margin.right || margin.bottom || margin.left) {
    css.push(`margin: ${margin.top}${margin.unit} ${margin.right}${margin.unit} ${margin.bottom}${margin.unit} ${margin.left}${margin.unit};`);
  }

  if (padding.top || padding.right || padding.bottom || padding.left) {
    css.push(`padding: ${padding.top}${padding.unit} ${padding.right}${padding.unit} ${padding.bottom}${padding.unit} ${padding.left}${padding.unit};`);
  }

  if (width.value) {
    css.push(`width: ${width.value}${width.unit};`);
  }

  if (maxWidth.value) {
    css.push(`max-width: ${maxWidth.value}${maxWidth.unit};`);
  }

  if (height.value) {
    css.push(`height: ${height.value}${height.unit};`);
  }

  if (minHeight.value) {
    css.push(`min-height: ${minHeight.value}${minHeight.unit};`);
  }

  // Background
  const { background } = settings;

  if (background.type === 'color' && background.color) {
    css.push(`background-color: ${background.color};`);
  } else if (background.type === 'gradient' && background.gradientStart && background.gradientEnd) {
    const angle = background.gradientAngle || 180;
    css.push(`background: linear-gradient(${angle}deg, ${background.gradientStart}, ${background.gradientEnd});`);
  } else if (background.type === 'image' && background.imageUrl) {
    css.push(`background-image: url('${background.imageUrl}');`);
    css.push(`background-size: ${background.imageSize || 'cover'};`);
    css.push(`background-position: ${background.imagePosition || 'center'};`);
    css.push(`background-repeat: ${background.imageRepeat || 'no-repeat'};`);
  }

  // Border
  const { border } = settings;

  if (border.style !== 'none') {
    css.push(`border-width: ${border.width.top}${border.width.unit} ${border.width.right}${border.width.unit} ${border.width.bottom}${border.width.unit} ${border.width.left}${border.width.unit};`);
    css.push(`border-style: ${border.style};`);
    css.push(`border-color: ${border.color};`);
  }

  const { radius } = border;
  if (radius.topLeft || radius.topRight || radius.bottomRight || radius.bottomLeft) {
    css.push(`border-radius: ${radius.topLeft}${radius.unit} ${radius.topRight}${radius.unit} ${radius.bottomRight}${radius.unit} ${radius.bottomLeft}${radius.unit};`);
  }

  // Shadow
  const { shadow } = settings;

  if (shadow.blur || shadow.spread || shadow.horizontal || shadow.vertical) {
    css.push(`box-shadow: ${shadow.horizontal}px ${shadow.vertical}px ${shadow.blur}px ${shadow.spread}px ${shadow.color};`);
  }

  // Advanced
  const { advanced } = settings;

  css.push(`position: ${advanced.position};`);
  css.push(`z-index: ${advanced.zIndex};`);

  if (advanced.opacity !== 1) {
    css.push(`opacity: ${advanced.opacity};`);
  }

  const { cssFilters } = advanced;
  const filters: string[] = [];

  if (cssFilters.blur) {
    filters.push(`blur(${cssFilters.blur}px)`);
  }

  if (cssFilters.brightness !== 100) {
    filters.push(`brightness(${cssFilters.brightness}%)`);
  }

  if (cssFilters.contrast !== 100) {
    filters.push(`contrast(${cssFilters.contrast}%)`);
  }

  if (filters.length > 0) {
    css.push(`filter: ${filters.join(' ')};`);
  }

  return css.join(' ');
}

// Get animation CSS class name
export function getAnimationClassName(animation: AnimationSettings): string {
  if (animation.type === 'none') return '';

  const durationMap = {
    fast: '0.5s',
    normal: '1s',
    slow: '2s'
  };

  return `animate-${animation.type}`;
}

// Get animation CSS keyframes and rules
export function getAnimationCSS(animation: AnimationSettings): string {
  if (animation.type === 'none') return '';

  const durationMap = {
    fast: '0.5s',
    normal: '1s',
    slow: '2s'
  };

  const duration = durationMap[animation.duration];
  const delay = animation.delay ? `${animation.delay}ms` : '0s';

  return `
.animate-${animation.type} {
  animation: ${animation.type} ${duration} ease-out ${delay} both;
}

@keyframes ${animation.type} {
  ${getKeyframesForAnimation(animation.type)}
}
`;
}

function getKeyframesForAnimation(type: AnimationType): string {
  const keyframes: Record<AnimationType, string> = {
    none: '',
    fadeIn: 'from { opacity: 0; } to { opacity: 1; }',
    fadeInUp: 'from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); }',
    fadeInDown: 'from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); }',
    fadeInLeft: 'from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); }',
    fadeInRight: 'from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); }',
    slideInUp: 'from { transform: translateY(100%); } to { transform: translateY(0); }',
    slideInDown: 'from { transform: translateY(-100%); } to { transform: translateY(0); }',
    slideInLeft: 'from { transform: translateX(-100%); } to { transform: translateX(0); }',
    slideInRight: 'from { transform: translateX(100%); } to { transform: translateX(0); }',
    zoomIn: 'from { opacity: 0; transform: scale(0.3); } to { opacity: 1; transform: scale(1); }',
    zoomOut: 'from { opacity: 0; transform: scale(1.7); } to { opacity: 1; transform: scale(1); }',
    bounce: '0%, 20%, 50%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-30px); } 60% { transform: translateY(-15px); }',
    pulse: '0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); }'
  };

  return keyframes[type] || '';
}

// Validation
export function validateSection(section: Section): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!section.id) {
    errors.push('Section ID is required');
  }

  if (!section.name || section.name.trim().length === 0) {
    errors.push('Section name is required');
  }

  // HTML validation (basic check)
  if (section.html && (
    section.html.includes('<!DOCTYPE') ||
    section.html.includes('<html') ||
    section.html.includes('<head') ||
    section.html.includes('<body')
  )) {
    errors.push('HTML should not include DOCTYPE, html, head, or body tags');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
