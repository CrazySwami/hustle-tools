/**
 * Converts an Elementor Style Kit JSON to a CSS stylesheet
 * This is useful for:
 * - Previewing styles outside Elementor
 * - Applying styles to non-Elementor pages
 * - Generating fallback CSS
 */

export function stylekitToCSS(styleKit: any): string {
  const css: string[] = [];

  // Helper to get font family with fallbacks
  const getFontFamily = (fontName: string) => {
    if (!fontName) return 'sans-serif';
    // Add fallback fonts
    if (fontName.includes('serif') && !fontName.includes('sans')) {
      return `'${fontName}', Georgia, serif`;
    }
    return `'${fontName}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
  };

  // CSS Variables (Custom Properties)
  css.push('/* Elementor Style Kit - Generated CSS */');
  css.push(':root {');

  // System Colors
  if (styleKit.system_colors) {
    styleKit.system_colors.forEach((color: any) => {
      css.push(`  --e-global-color-${color._id}: ${color.color};`);
    });
  }

  // Custom Colors
  if (styleKit.custom_colors?.length) {
    styleKit.custom_colors.forEach((color: any, index: number) => {
      css.push(`  --e-global-color-custom${index + 1}: ${color.color};`);
    });
  }

  // System Typography Variables
  if (styleKit.system_typography) {
    styleKit.system_typography.forEach((typo: any) => {
      const id = typo._id;
      if (typo.typography_font_family) {
        css.push(`  --e-global-typography-${id}-font-family: ${getFontFamily(typo.typography_font_family)};`);
      }
      if (typo.typography_font_size?.size) {
        css.push(`  --e-global-typography-${id}-font-size: ${typo.typography_font_size.size}${typo.typography_font_size.unit || 'px'};`);
      }
      if (typo.typography_font_weight) {
        css.push(`  --e-global-typography-${id}-font-weight: ${typo.typography_font_weight};`);
      }
      if (typo.typography_line_height?.size) {
        css.push(`  --e-global-typography-${id}-line-height: ${typo.typography_line_height.size}${typo.typography_line_height.unit || 'em'};`);
      }
    });
  }

  css.push('}');
  css.push('');

  // Body Styles
  if (styleKit.body_typography || styleKit.body_color) {
    css.push('body {');
    if (styleKit.body_typography?.typography_font_family) {
      css.push(`  font-family: ${getFontFamily(styleKit.body_typography.typography_font_family)};`);
    }
    if (styleKit.body_typography?.typography_font_size?.size) {
      css.push(`  font-size: ${styleKit.body_typography.typography_font_size.size}${styleKit.body_typography.typography_font_size.unit || 'px'};`);
    }
    if (styleKit.body_typography?.typography_font_weight) {
      css.push(`  font-weight: ${styleKit.body_typography.typography_font_weight};`);
    }
    if (styleKit.body_typography?.typography_line_height?.size) {
      css.push(`  line-height: ${styleKit.body_typography.typography_line_height.size}${styleKit.body_typography.typography_line_height.unit || 'em'};`);
    }
    if (styleKit.body_color) {
      css.push(`  color: ${styleKit.body_color};`);
    }
    css.push('}');
    css.push('');
  }

  // Heading Styles (h1-h6)
  ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach((tag) => {
    const typo = styleKit[`${tag}_typography`];
    if (typo) {
      css.push(`${tag} {`);
      if (typo.typography_font_family) {
        css.push(`  font-family: ${getFontFamily(typo.typography_font_family)};`);
      }
      if (typo.typography_font_size?.size) {
        css.push(`  font-size: ${typo.typography_font_size.size}${typo.typography_font_size.unit || 'px'};`);
      }
      if (typo.typography_font_weight) {
        css.push(`  font-weight: ${typo.typography_font_weight};`);
      }
      if (typo.typography_line_height?.size) {
        css.push(`  line-height: ${typo.typography_line_height.size}${typo.typography_line_height.unit || 'em'};`);
      }
      if (typo.typography_letter_spacing?.size) {
        css.push(`  letter-spacing: ${typo.typography_letter_spacing.size}${typo.typography_letter_spacing.unit || 'px'};`);
      }
      if (typo.typography_text_transform) {
        css.push(`  text-transform: ${typo.typography_text_transform};`);
      }
      if (typo.typography_text_color) {
        css.push(`  color: ${typo.typography_text_color};`);
      }
      css.push('}');
      css.push('');
    }
  });

  // Tablet Responsive Styles
  const tablet = styleKit.viewport_md || 768;
  css.push(`@media (max-width: ${tablet + 24}px) {`);
  ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach((tag) => {
    const typo = styleKit[`${tag}_typography`];
    if (typo?.typography_font_size_tablet?.size) {
      css.push(`  ${tag} {`);
      css.push(`    font-size: ${typo.typography_font_size_tablet.size}${typo.typography_font_size_tablet.unit || 'px'};`);
      css.push(`  }`);
    }
  });
  if (styleKit.body_typography?.typography_font_size_tablet?.size) {
    css.push(`  body {`);
    css.push(`    font-size: ${styleKit.body_typography.typography_font_size_tablet.size}${styleKit.body_typography.typography_font_size_tablet.unit || 'px'};`);
    css.push(`  }`);
  }
  css.push('}');
  css.push('');

  // Mobile Responsive Styles
  css.push(`@media (max-width: ${tablet - 1}px) {`);
  ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach((tag) => {
    const typo = styleKit[`${tag}_typography`];
    if (typo?.typography_font_size_mobile?.size) {
      css.push(`  ${tag} {`);
      css.push(`    font-size: ${typo.typography_font_size_mobile.size}${typo.typography_font_size_mobile.unit || 'px'};`);
      css.push(`  }`);
    }
  });
  if (styleKit.body_typography?.typography_font_size_mobile?.size) {
    css.push(`  body {`);
    css.push(`    font-size: ${styleKit.body_typography.typography_font_size_mobile.size}${styleKit.body_typography.typography_font_size_mobile.unit || 'px'};`);
    css.push(`  }`);
  }
  css.push('}');
  css.push('');

  // Link Styles
  if (styleKit.link_normal_color) {
    css.push('a {');
    css.push(`  color: ${styleKit.link_normal_color};`);
    css.push('}');
    css.push('');
  }

  // Button Styles
  if (styleKit.button_typography || styleKit.button_background_color) {
    css.push('.elementor-button, button, .button {');
    if (styleKit.button_typography?.typography_font_family) {
      css.push(`  font-family: ${getFontFamily(styleKit.button_typography.typography_font_family)};`);
    }
    if (styleKit.button_typography?.typography_font_size?.size) {
      css.push(`  font-size: ${styleKit.button_typography.typography_font_size.size}${styleKit.button_typography.typography_font_size.unit || 'px'};`);
    }
    if (styleKit.button_typography?.typography_font_weight) {
      css.push(`  font-weight: ${styleKit.button_typography.typography_font_weight};`);
    }
    if (styleKit.button_typography?.typography_text_transform) {
      css.push(`  text-transform: ${styleKit.button_typography.typography_text_transform};`);
    }
    if (styleKit.button_typography?.typography_letter_spacing?.size) {
      css.push(`  letter-spacing: ${styleKit.button_typography.typography_letter_spacing.size}${styleKit.button_typography.typography_letter_spacing.unit || 'px'};`);
    }
    if (styleKit.button_background_color) {
      css.push(`  background-color: ${styleKit.button_background_color};`);
    }
    if (styleKit.button_text_color) {
      css.push(`  color: ${styleKit.button_text_color};`);
    }
    if (styleKit.button_border_radius) {
      const br = styleKit.button_border_radius;
      if (br.isLinked) {
        css.push(`  border-radius: ${br.top}${br.unit || 'px'};`);
      } else {
        css.push(`  border-radius: ${br.top}${br.unit || 'px'} ${br.right}${br.unit || 'px'} ${br.bottom}${br.unit || 'px'} ${br.left}${br.unit || 'px'};`);
      }
    }
    if (styleKit.button_padding) {
      const p = styleKit.button_padding;
      css.push(`  padding: ${p.top}${p.unit || 'px'} ${p.right}${p.unit || 'px'} ${p.bottom}${p.unit || 'px'} ${p.left}${p.unit || 'px'};`);
    }
    css.push(`  border: none;`);
    css.push(`  cursor: pointer;`);
    css.push('}');
    css.push('');
  }

  // Button Hover State
  if (styleKit.button_hover_background_color || styleKit.button_background_color_hover) {
    css.push('.elementor-button:hover, button:hover, .button:hover {');
    const hoverColor = styleKit.button_hover_background_color || styleKit.button_background_color_hover;
    if (hoverColor) {
      css.push(`  background-color: ${hoverColor};`);
    }
    if (styleKit.button_hover_text_color) {
      css.push(`  color: ${styleKit.button_hover_text_color};`);
    }
    css.push('}');
    css.push('');
  }

  // Form Field Styles
  if (styleKit.form_field_typography || styleKit.form_field_background_color) {
    css.push('input[type="text"], input[type="email"], input[type="password"], input[type="tel"], input[type="url"], textarea, select {');
    if (styleKit.form_field_typography?.typography_font_family) {
      css.push(`  font-family: ${getFontFamily(styleKit.form_field_typography.typography_font_family)};`);
    }
    if (styleKit.form_field_typography?.typography_font_size?.size) {
      css.push(`  font-size: ${styleKit.form_field_typography.typography_font_size.size}${styleKit.form_field_typography.typography_font_size.unit || 'px'};`);
    }
    if (styleKit.form_field_text_color) {
      css.push(`  color: ${styleKit.form_field_text_color};`);
    }
    if (styleKit.form_field_background_color) {
      css.push(`  background-color: ${styleKit.form_field_background_color};`);
    }
    if (styleKit.form_field_border_color) {
      css.push(`  border-color: ${styleKit.form_field_border_color};`);
    }
    if (styleKit.form_field_border_width) {
      const bw = styleKit.form_field_border_width;
      css.push(`  border-width: ${bw.top}${bw.unit || 'px'};`);
      css.push(`  border-style: solid;`);
    }
    if (styleKit.form_field_border_radius) {
      const br = styleKit.form_field_border_radius;
      if (br.isLinked) {
        css.push(`  border-radius: ${br.top}${br.unit || 'px'};`);
      }
    }
    if (styleKit.form_field_padding) {
      const p = styleKit.form_field_padding;
      css.push(`  padding: ${p.top}${p.unit || 'px'} ${p.right}${p.unit || 'px'} ${p.bottom}${p.unit || 'px'} ${p.left}${p.unit || 'px'};`);
    }
    css.push('}');
    css.push('');
  }

  // Form Field Focus State
  if (styleKit.form_field_focus_border_color) {
    css.push('input:focus, textarea:focus, select:focus {');
    css.push(`  border-color: ${styleKit.form_field_focus_border_color};`);
    css.push(`  outline: none;`);
    if (styleKit.form_field_focus_ring_color) {
      css.push(`  box-shadow: 0 0 0 3px ${styleKit.form_field_focus_ring_color}33;`); // 20% opacity
    }
    css.push('}');
    css.push('');
  }

  // Container Width
  if (styleKit.container_width?.size) {
    css.push('.elementor-section.elementor-section-boxed > .elementor-container {');
    css.push(`  max-width: ${styleKit.container_width.size}${styleKit.container_width.unit || 'px'};`);
    css.push('}');
    css.push('');
  }

  return css.join('\n');
}

/**
 * Download Style Kit as CSS file
 */
export function downloadStyleKitAsCSS(styleKit: any, filename: string = 'elementor-stylekit.css') {
  const cssContent = stylekitToCSS(styleKit);
  const blob = new Blob([cssContent], { type: 'text/css' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
