/**
 * Convert Brand Analysis to Elementor Style Kit format
 */

interface BrandColor {
  hex: string;
  rgb: string;
  frequency: number;
  category?: 'primary' | 'secondary' | 'accent' | 'neutral' | 'background';
}

interface BrandFont {
  family: string;
  frequency: number;
  source?: 'google-fonts' | 'adobe-fonts' | 'system' | 'custom';
  weights?: number[];
  url?: string;
}

interface BrandAnalysis {
  colors: BrandColor[];
  fonts: BrandFont[];
}

interface ElementorColor {
  _id: string;
  title: string;
  color: string;
}

interface ElementorTypography {
  _id: string;
  title: string;
  typography_typography: 'custom';
  typography_font_family: string;
  typography_font_weight?: string;
  typography_font_size?: {
    unit: string;
    size: number;
  };
  typography_line_height?: {
    unit: string;
    size: number;
  };
}

interface ElementorStyleKit {
  system_colors?: ElementorColor[];
  system_typography?: ElementorTypography[];
  custom_colors?: ElementorColor[];
  custom_typography?: ElementorTypography[];
  // Button styles
  button_typography?: Partial<ElementorTypography>;
  button_border_radius?: {
    unit: string;
    top: number;
    right: number;
    bottom: number;
    left: number;
    isLinked: boolean;
  };
  button_background_color?: string;
  button_background_hover_color?: string;
  button_text_color?: string;
  button_hover_text_color?: string;
  // Form styles
  form_field_typography?: Partial<ElementorTypography>;
  form_field_text_color?: string;
  form_field_background_color?: string;
  form_field_border_color?: string;
}

/**
 * Generate complete Elementor Style Kit with all default fields
 * Based on extracted brand colors and fonts
 */
export function brandAnalysisToStyleKit(analysis: BrandAnalysis): ElementorStyleKit {
  const styleKit: ElementorStyleKit = {};

  // Map colors to system_colors (Elementor's 4 default colors)
  if (analysis.colors && analysis.colors.length > 0) {
    const colors = analysis.colors;

    // Find primary/accent colors (most saturated)
    const primary = colors.find(c => c.category === 'primary') || colors[0];
    const secondary = colors.find(c => c.category === 'secondary') || colors[1];
    const accent = colors.find(c => c.category === 'accent') || colors[2];
    const text = colors.find(c => c.category === 'neutral') || { hex: '#7A7A7A' };

    styleKit.system_colors = [
      { _id: 'primary', title: 'Primary', color: primary?.hex.toUpperCase() || '#6EC1E4' },
      { _id: 'secondary', title: 'Secondary', color: secondary?.hex.toUpperCase() || '#54595F' },
      { _id: 'text', title: 'Text', color: text.hex.toUpperCase() },
      { _id: 'accent', title: 'Accent', color: accent?.hex.toUpperCase() || '#61CE70' },
    ];

    // Additional colors go to custom_colors
    styleKit.custom_colors = colors.slice(0, 8).map((color, index) => ({
      _id: `brand_color_${index + 1}`,
      title: color.category
        ? color.category.charAt(0).toUpperCase() + color.category.slice(1)
        : `Color ${index + 1}`,
      color: color.hex.toUpperCase(),
    }));

    // Apply button colors from brand
    styleKit.button_background_color = primary?.hex.toUpperCase();
    styleKit.button_background_hover_color = secondary?.hex.toUpperCase();
    styleKit.button_text_color = '#FFFFFF';
    styleKit.button_hover_text_color = '#FFFFFF';
    styleKit.button_border_radius = {
      unit: 'px',
      top: 4,
      right: 4,
      bottom: 4,
      left: 4,
      isLinked: true,
    };

    // Apply form field colors
    styleKit.form_field_text_color = text.hex.toUpperCase();
    styleKit.form_field_background_color = '#FFFFFF';
    styleKit.form_field_border_color = secondary?.hex.toUpperCase() || '#E0E0E0';
  }

  // Map fonts to system_typography (Elementor's 4 default typography)
  if (analysis.fonts && analysis.fonts.length > 0) {
    // Filter out system fonts
    const customFonts = analysis.fonts.filter(
      f => !f.family.includes('-apple-system') &&
           !f.family.includes('BlinkMacSystemFont') &&
           !f.family.includes('system-ui') &&
           !f.family.includes('Segoe UI')
    );

    if (customFonts.length > 0) {
      const headingFont = customFonts[0];
      const bodyFont = customFonts[1] || customFonts[0];
      const accentFont = customFonts[2] || customFonts[0];

      // Get appropriate weights
      const headingWeight = headingFont.weights?.find(w => w >= 600) || headingFont.weights?.[0] || 600;
      const bodyWeight = bodyFont.weights?.find(w => w === 400) || bodyFont.weights?.[0] || 400;
      const accentWeight = accentFont.weights?.find(w => w === 500) || accentFont.weights?.[0] || 500;

      styleKit.system_typography = [
        {
          _id: 'primary',
          title: 'Primary',
          typography_typography: 'custom',
          typography_font_family: headingFont.family,
          typography_font_weight: String(headingWeight),
        },
        {
          _id: 'secondary',
          title: 'Secondary',
          typography_typography: 'custom',
          typography_font_family: headingFont.family,
          typography_font_weight: String(bodyWeight),
        },
        {
          _id: 'text',
          title: 'Text',
          typography_typography: 'custom',
          typography_font_family: bodyFont.family,
          typography_font_weight: String(bodyWeight),
        },
        {
          _id: 'accent',
          title: 'Accent',
          typography_typography: 'custom',
          typography_font_family: accentFont.family,
          typography_font_weight: String(accentWeight),
        },
      ];

      // Additional fonts go to custom_typography
      styleKit.custom_typography = customFonts.slice(0, 6).map((font, index) => {
        const titles = ['Primary Heading', 'Secondary Heading', 'Body Text', 'Caption', 'Small Text', 'Accent Text'];
        const defaultWeight = font.weights?.[0] || 400;

        return {
          _id: `brand_typo_${index + 1}`,
          title: titles[index] || `Typography ${index + 1}`,
          typography_typography: 'custom',
          typography_font_family: font.family,
          typography_font_weight: String(defaultWeight),
        };
      });

      // Apply button typography
      styleKit.button_typography = {
        typography_typography: 'custom',
        typography_font_family: bodyFont.family,
        typography_font_weight: String(500),
        typography_font_size: {
          unit: 'px',
          size: 16,
        },
      };

      // Apply form field typography
      styleKit.form_field_typography = {
        typography_typography: 'custom',
        typography_font_family: bodyFont.family,
        typography_font_size: {
          unit: 'px',
          size: 14,
        },
      };
    }
  }

  return styleKit;
}

/**
 * Get a summary of what will be applied
 */
export function getStyleKitSummary(styleKit: ElementorStyleKit): string {
  const colorCount = styleKit.custom_colors?.length || 0;
  const fontCount = styleKit.custom_typography?.length || 0;

  const parts = [];
  if (colorCount > 0) parts.push(`${colorCount} colors`);
  if (fontCount > 0) parts.push(`${fontCount} fonts`);

  return parts.join(' and ');
}

/**
 * Load Google Fonts for the typography
 */
export function loadGoogleFontsForStyleKit(analysis: BrandAnalysis): void {
  if (!analysis.fonts) return;

  // Remove previously injected style kit fonts
  document.querySelectorAll('link[data-stylekit-font]').forEach(el => el.remove());

  // Get Google Fonts
  const googleFonts = analysis.fonts.filter(f => f.source === 'google-fonts' && f.url);

  googleFonts.forEach(font => {
    if (font.url) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = font.url;
      link.setAttribute('data-stylekit-font', 'true');
      document.head.appendChild(link);
    }
  });

  // Try loading custom fonts from Google Fonts API
  const customFonts = analysis.fonts.filter(
    f => f.source === 'custom' &&
    !f.family.includes('-apple-system') &&
    !f.family.includes('BlinkMacSystemFont') &&
    !f.family.includes('system-ui')
  );

  customFonts.forEach(font => {
    // Build weights string
    const weightsStr = font.weights && font.weights.length > 0
      ? `:wght@${font.weights.join(';')}`
      : ':wght@400;500;600;700';

    const googleFontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font.family)}${weightsStr}&display=swap`;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = googleFontUrl;
    link.setAttribute('data-stylekit-font', 'true');
    link.onerror = () => {
      console.log(`Font ${font.family} not available on Google Fonts`);
      link.remove();
    };
    document.head.appendChild(link);
  });
}
