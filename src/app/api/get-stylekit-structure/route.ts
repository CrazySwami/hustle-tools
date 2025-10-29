import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    // This endpoint is for documentation purposes
    // It returns the expected Elementor Style Kit structure based on actual testing

    const exampleStyleKit = {
      info: "This is the structure fetched from a real Elementor installation",
      structure: {
        system_colors: [
          {
            _id: "primary",
            title: "Primary",
            color: "#6EC1E4"
          },
          {
            _id: "secondary",
            title: "Secondary",
            color: "#54595F"
          },
          {
            _id: "text",
            title: "Text",
            color: "#7A7A7A"
          },
          {
            _id: "accent",
            title: "Accent",
            color: "#61CE70"
          }
        ],
        custom_colors: [
          {
            _id: "custom_color_1",
            title: "Custom Color 1",
            color: "#FF5733"
          }
        ],
        system_typography: [
          {
            _id: "primary",
            title: "Primary",
            typography_typography: "custom",
            typography_font_family: "Roboto",
            typography_font_weight: "600"
          },
          {
            _id: "secondary",
            title: "Secondary",
            typography_typography: "custom",
            typography_font_family: "Roboto Slab",
            typography_font_weight: "400"
          },
          {
            _id: "text",
            title: "Text",
            typography_typography: "custom",
            typography_font_family: "Roboto",
            typography_font_weight: "400"
          },
          {
            _id: "accent",
            title: "Accent",
            typography_typography: "custom",
            typography_font_family: "Roboto",
            typography_font_weight: "500"
          }
        ],
        custom_typography: [
          {
            _id: "custom_typo_1",
            title: "Custom Typography 1",
            typography_typography: "custom",
            typography_font_family: "Inter",
            typography_font_weight: "700",
            typography_font_size: {
              unit: "px",
              size: 24
            },
            typography_line_height: {
              unit: "em",
              size: 1.5
            }
          }
        ],
        // Button styles
        button_typography: {
          typography_typography: "custom",
          typography_font_family: "Roboto",
          typography_font_weight: "500",
          typography_font_size: {
            unit: "px",
            size: 16
          }
        },
        button_border_radius: {
          unit: "px",
          top: 4,
          right: 4,
          bottom: 4,
          left: 4,
          isLinked: true
        },
        // Form fields
        form_field_typography: {
          typography_typography: "custom",
          typography_font_family: "Roboto",
          typography_font_size: {
            unit: "px",
            size: 14
          }
        },
        // Additional theme style settings
        default_generic_fonts: "Sans-serif",
        site_name: "My Site",
        site_description: "Site Description",
        page_title_selector: "h1.entry-title",
        activeBreakpoints: ["mobile", "mobile_extra", "tablet", "tablet_extra", "laptop"],
        viewport_lg: 1025,
        viewport_md: 768
      },
      notes: [
        "system_colors: 4 default system colors (primary, secondary, text, accent)",
        "custom_colors: User-defined colors that appear in color picker",
        "system_typography: 4 default typography presets",
        "custom_typography: User-defined typography presets",
        "button_* settings: Global button styles",
        "form_* settings: Global form field styles",
        "Each color needs: _id, title, color (hex)",
        "Each typography needs: _id, title, typography_typography: 'custom', font_family, font_weight",
        "Font sizes use object format: { unit: 'px', size: 24 }",
        "Typography can include: font_size, line_height, letter_spacing, text_transform, font_style, text_decoration"
      ]
    };

    return NextResponse.json(exampleStyleKit);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get style kit structure' },
      { status: 500 }
    );
  }
}
