/**
 * Complete Elementor Style Kit Generator
 * Generates a comprehensive Style Kit with ALL default Elementor fields
 * Based on extracted brand colors and fonts
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

/**
 * Generate complete Elementor Style Kit with ALL default fields
 * Includes all typography presets, colors, buttons, forms, images, and global settings
 */
export function generateCompleteStyleKit(analysis: BrandAnalysis) {
  // Extract fonts
  const customFonts = analysis.fonts.filter(
    f => !f.family.includes('-apple-system') &&
         !f.family.includes('BlinkMacSystemFont') &&
         !f.family.includes('system-ui') &&
         !f.family.includes('Segoe UI')
  );

  const headingFont = customFonts[0] || { family: 'Roboto', weights: [400, 600, 700] };
  const bodyFont = customFonts[1] || customFonts[0] || { family: 'Roboto', weights: [400] };

  // Extract colors
  const colors = analysis.colors;
  const primary = colors.find(c => c.category === 'primary') || colors[0] || { hex: '#957EFC' };
  const secondary = colors.find(c => c.category === 'secondary') || colors[1] || { hex: '#1D2228' };
  const text = colors.find(c => c.category === 'neutral') || { hex: '#7D2EFF' };
  const accent = colors.find(c => c.category === 'accent') || colors[2] || { hex: '#E0E4E9' };

  // Helper to get font weight
  const getWeight = (font: typeof headingFont, preferredWeight: number) => {
    return font.weights?.find(w => w >= preferredWeight) || font.weights?.[0] || preferredWeight;
  };

  const styleKit = {
    // ========== SYSTEM COLORS ==========
    system_colors: [
      { _id: 'primary', title: 'Primary', color: primary.hex.toUpperCase() },
      { _id: 'secondary', title: 'Secondary', color: secondary.hex.toUpperCase() },
      { _id: 'text', title: 'Text', color: text.hex.toUpperCase() },
      { _id: 'accent', title: 'Accent', color: accent.hex.toUpperCase() },
    ],

    // ========== CUSTOM COLORS ==========
    custom_colors: colors.slice(0, 8).map((color, index) => ({
      _id: `brand_color_${index + 1}`,
      title: color.category
        ? color.category.charAt(0).toUpperCase() + color.category.slice(1)
        : `Color ${index + 1}`,
      color: color.hex.toUpperCase(),
    })),

    // ========== SYSTEM TYPOGRAPHY (4 defaults) ==========
    system_typography: [
      {
        _id: 'primary',
        title: 'Primary',
        typography_typography: 'custom',
        typography_font_family: headingFont.family,
        typography_font_weight: String(getWeight(headingFont, 600)),
        typography_font_size: { unit: 'px', size: 48, sizes: [] },
        typography_font_size_tablet: { unit: 'px', size: 40, sizes: [] },
        typography_font_size_mobile: { unit: 'px', size: 32, sizes: [] },
        typography_line_height: { unit: 'em', size: 1.2, sizes: [] },
        typography_letter_spacing: { unit: 'px', size: 0, sizes: [] },
        typography_text_transform: 'none',
        typography_font_style: 'normal',
        typography_text_decoration: 'none',
      },
      {
        _id: 'secondary',
        title: 'Secondary',
        typography_typography: 'custom',
        typography_font_family: headingFont.family,
        typography_font_weight: String(getWeight(headingFont, 500)),
        typography_font_size: { unit: 'px', size: 32, sizes: [] },
        typography_font_size_tablet: { unit: 'px', size: 28, sizes: [] },
        typography_font_size_mobile: { unit: 'px', size: 24, sizes: [] },
        typography_line_height: { unit: 'em', size: 1.3, sizes: [] },
        typography_letter_spacing: { unit: 'px', size: 0, sizes: [] },
        typography_text_transform: 'none',
        typography_font_style: 'normal',
        typography_text_decoration: 'none',
      },
      {
        _id: 'text',
        title: 'Text',
        typography_typography: 'custom',
        typography_font_family: bodyFont.family,
        typography_font_weight: String(getWeight(bodyFont, 400)),
        typography_font_size: { unit: 'px', size: 16, sizes: [] },
        typography_font_size_tablet: { unit: 'px', size: 16, sizes: [] },
        typography_font_size_mobile: { unit: 'px', size: 14, sizes: [] },
        typography_line_height: { unit: 'em', size: 1.6, sizes: [] },
        typography_letter_spacing: { unit: 'px', size: 0, sizes: [] },
        typography_text_transform: 'none',
        typography_font_style: 'normal',
        typography_text_decoration: 'none',
      },
      {
        _id: 'accent',
        title: 'Accent',
        typography_typography: 'custom',
        typography_font_family: bodyFont.family,
        typography_font_weight: String(getWeight(bodyFont, 500)),
        typography_font_size: { unit: 'px', size: 14, sizes: [] },
        typography_font_size_tablet: { unit: 'px', size: 14, sizes: [] },
        typography_font_size_mobile: { unit: 'px', size: 12, sizes: [] },
        typography_line_height: { unit: 'em', size: 1.4, sizes: [] },
        typography_letter_spacing: { unit: 'px', size: 0, sizes: [] },
        typography_text_transform: 'none',
        typography_font_style: 'normal',
        typography_text_decoration: 'none',
      },
    ],

    // ========== CUSTOM TYPOGRAPHY (6 custom slots) ==========
    custom_typography: customFonts.slice(0, 6).map((font, index) => {
      const titles = ['Primary Heading', 'Secondary Heading', 'Body Text', 'Caption', 'Small Text', 'Accent Text'];
      const sizes = [48, 32, 16, 14, 12, 16];
      const weights = [700, 600, 400, 400, 400, 500];

      return {
        _id: `custom_typo_${index + 1}`,
        title: titles[index],
        typography_typography: 'custom',
        typography_font_family: font.family,
        typography_font_weight: String(getWeight(font, weights[index])),
        typography_font_size: { unit: 'px', size: sizes[index], sizes: [] },
        typography_line_height: { unit: 'em', size: 1.4, sizes: [] },
      };
    }),

    // ========== GLOBAL COLORS ==========
    show_global_colors: 'yes',

    // ========== BUTTON STYLES ==========
    button_typography: {
      typography_typography: 'custom',
      typography_font_family: bodyFont.family,
      typography_font_weight: String(getWeight(bodyFont, 500)),
      typography_font_size: { unit: 'px', size: 16, sizes: [] },
      typography_text_transform: '',
      typography_font_style: '',
      typography_text_decoration: '',
      typography_line_height: { unit: 'em', size: 1.5, sizes: [] },
      typography_letter_spacing: { unit: 'px', size: 0, sizes: [] },
    },
    button_text_color: '#FFFFFF',
    button_background_color: primary.hex.toUpperCase(),
    button_background_hover_color: secondary.hex.toUpperCase(),
    button_hover_text_color: '#FFFFFF',
    button_border_radius: {
      unit: 'px',
      top: 4,
      right: 4,
      bottom: 4,
      left: 4,
      isLinked: true,
    },
    button_padding: {
      unit: 'px',
      top: 12,
      right: 24,
      bottom: 12,
      left: 24,
      isLinked: false,
    },
    button_box_shadow_box_shadow_type: '',
    button_box_shadow_box_shadow: {
      horizontal: 0,
      vertical: 0,
      blur: 10,
      spread: 0,
      color: 'rgba(0,0,0,0.1)',
    },
    button_hover_animation: '',

    // ========== FORM FIELD STYLES ==========
    form_field_typography: {
      typography_typography: 'custom',
      typography_font_family: bodyFont.family,
      typography_font_weight: String(getWeight(bodyFont, 400)),
      typography_font_size: { unit: 'px', size: 16, sizes: [] },
      typography_line_height: { unit: 'em', size: 1.5, sizes: [] },
    },
    form_field_text_color: text.hex.toUpperCase(),
    form_field_background_color: '#FFFFFF',
    form_field_border_color: secondary.hex.toUpperCase(),
    form_field_border_width: {
      unit: 'px',
      top: 1,
      right: 1,
      bottom: 1,
      left: 1,
      isLinked: true,
    },
    form_field_border_radius: {
      unit: 'px',
      top: 4,
      right: 4,
      bottom: 4,
      left: 4,
      isLinked: true,
    },
    form_field_padding: {
      unit: 'px',
      top: 12,
      right: 16,
      bottom: 12,
      left: 16,
      isLinked: false,
    },
    form_field_focus_border_color: primary.hex.toUpperCase(),

    // ========== BODY & TYPOGRAPHY GLOBAL SETTINGS ==========
    body_color: text.hex.toUpperCase(),
    body_typography: {
      typography_typography: 'custom',
      typography_font_family: bodyFont.family,
      typography_font_weight: String(getWeight(bodyFont, 400)),
      typography_font_size: { unit: 'px', size: 16, sizes: [] },
      typography_line_height: { unit: 'em', size: 1.6, sizes: [] },
    },
    paragraph_spacing: { unit: 'px', size: 20, sizes: [] },

    // ========== LINK STYLES ==========
    link_normal_color: primary.hex.toUpperCase(),
    link_hover_color: secondary.hex.toUpperCase(),
    link_typography: {
      typography_typography: 'custom',
      typography_font_family: bodyFont.family,
      typography_font_weight: String(getWeight(bodyFont, 400)),
      typography_text_decoration: 'underline',
    },

    // ========== HEADINGS (H1-H6) ==========
    headings_color: text.hex.toUpperCase(),
    heading_font: 'default',

    h1_typography: {
      typography_typography: 'custom',
      typography_font_family: headingFont.family,
      typography_font_weight: String(getWeight(headingFont, 700)),
      typography_font_size: { unit: 'px', size: 48, sizes: [] },
      typography_line_height: { unit: 'em', size: 1.2, sizes: [] },
    },
    h1_color: text.hex.toUpperCase(),

    h2_typography: {
      typography_typography: 'custom',
      typography_font_family: headingFont.family,
      typography_font_weight: String(getWeight(headingFont, 700)),
      typography_font_size: { unit: 'px', size: 40, sizes: [] },
      typography_line_height: { unit: 'em', size: 1.3, sizes: [] },
    },
    h2_color: text.hex.toUpperCase(),

    h3_typography: {
      typography_typography: 'custom',
      typography_font_family: headingFont.family,
      typography_font_weight: String(getWeight(headingFont, 600)),
      typography_font_size: { unit: 'px', size: 32, sizes: [] },
      typography_line_height: { unit: 'em', size: 1.3, sizes: [] },
    },
    h3_color: text.hex.toUpperCase(),

    h4_typography: {
      typography_typography: 'custom',
      typography_font_family: headingFont.family,
      typography_font_weight: String(getWeight(headingFont, 600)),
      typography_font_size: { unit: 'px', size: 24, sizes: [] },
      typography_line_height: { unit: 'em', size: 1.4, sizes: [] },
    },
    h4_color: text.hex.toUpperCase(),

    h5_typography: {
      typography_typography: 'custom',
      typography_font_family: headingFont.family,
      typography_font_weight: String(getWeight(headingFont, 600)),
      typography_font_size: { unit: 'px', size: 20, sizes: [] },
      typography_line_height: { unit: 'em', size: 1.4, sizes: [] },
    },
    h5_color: text.hex.toUpperCase(),

    h6_typography: {
      typography_typography: 'custom',
      typography_font_family: headingFont.family,
      typography_font_weight: String(getWeight(headingFont, 600)),
      typography_font_size: { unit: 'px', size: 16, sizes: [] },
      typography_line_height: { unit: 'em', size: 1.5, sizes: [] },
    },
    h6_color: text.hex.toUpperCase(),

    // ========== IMAGE STYLES ==========
    image_border_type: 'none',
    image_border_radius: {
      unit: 'px',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      isLinked: true,
    },
    image_opacity: { unit: '', size: 1, sizes: [] },
    image_box_shadow_box_shadow_type: '',

    // ========== SITE SETTINGS (shown in screenshots) ==========
    site_name: '',
    site_description: '',
    viewport_lg: 1025,
    viewport_md: 768,
    viewport_mobile: 0,
    container_width: { unit: 'px', size: 1140, sizes: [] },
    space_between_widgets: { unit: 'px', size: 20, sizes: [] },
    page_title_selector: 'h1.entry-title',
    stretched_section_container: '',
    default_generic_fonts: 'Sans-serif',

    // ========== LIGHTBOX SETTINGS ==========
    lightbox_enable_counter: 'yes',
    lightbox_enable_fullscreen: 'yes',
    lightbox_enable_zoom: 'yes',
    lightbox_enable_share: 'yes',
    lightbox_title_src: 'caption',
    lightbox_description_src: 'description',

    // ========== GENERATED METADATA ==========
    _generated_by: 'claude-code-brand-extractor',
    _generated_at: new Date().toISOString(),
    _brand_source: 'automated-extraction',
  };

  return styleKit;
}
