// AI-based widget validation using Claude Haiku 4.5
import { generateObject } from 'ai';
import { z } from 'zod';

export const maxDuration = 30;

// Validation result schema
const ValidationResultSchema = z.object({
  checks: z.array(z.object({
    requirement: z.string(),
    passed: z.boolean(),
    details: z.string(),
    severity: z.enum(['critical', 'warning', 'info'])
  })),
  overallScore: z.number().min(0).max(100),
  summary: z.string()
});

export async function POST(req: Request) {
  try {
    const { widgetPhp, widgetName, widgetTitle } = await req.json();

    if (!widgetPhp) {
      return Response.json({ error: 'Widget PHP code is required' }, { status: 400 });
    }

    console.log('🔍 Validating widget:', widgetName);

    // Use Claude Haiku 4.5 for fast, cost-effective validation
    const result = await generateObject({
      model: 'anthropic/claude-haiku-4-5-20251001',
      schema: ValidationResultSchema,
      prompt: `You are an expert Elementor widget code reviewer. Analyze this PHP widget and verify it follows all requirements.

**Widget Name:** ${widgetName}
**Widget Title:** ${widgetTitle}

**Widget PHP Code:**
\`\`\`php
${widgetPhp}
\`\`\`

**Validation Requirements:**

Check each requirement and return a detailed validation report:

1. **Class Structure** (CRITICAL)
   - Must extend \\Elementor\\Widget_Base (with double backslash)
   - Class name follows proper naming convention

2. **Required Methods** (CRITICAL)
   - Has get_name() returning widget slug
   - Has get_title() returning translatable title
   - Has get_icon() returning Elementor icon
   - Has get_categories() returning ['hustle-tools']
   - Has register_controls() method
   - Has render() method

3. **ABSPATH Check** (CRITICAL)
   - Starts with if (!defined('ABSPATH')) exit;

4. **Code Location** (CRITICAL)
   - ALL code is inside the class
   - No CSS/JS/code outside the closing }

5. **CSS Handling** (CRITICAL)
   - Custom CSS uses heredoc syntax (<<<CSS ... CSS)
   - CSS is in heredoc AS-IS (not modified by extra {{WRAPPER}} tokens)
   - No {{WRAPPER}} inside @font-face or @keyframes rules
   - No {{WRAPPER}} before body/html global selectors

6. **Controls Registration** (WARNING)
   - Has Content tab sections
   - Has Style tab sections
   - Has Advanced tab with custom_css and custom_js controls
   - Uses proper control types (TEXT, TEXTAREA, MEDIA, COLOR, etc.)

7. **Render Method** (WARNING)
   - Uses $settings = $this->get_settings_for_display()
   - Outputs custom CSS in <style> tags
   - Outputs custom JS in <script> tags
   - Uses proper escaping (esc_html, esc_url, esc_attr)

8. **Group Controls** (INFO)
   - Typography controls use Group_Control_Typography
   - Background controls use Group_Control_Background
   - Border controls use Group_Control_Border

9. **Responsive Controls** (INFO)
   - Uses add_responsive_control for spacing where appropriate

10. **Translations** (INFO)
    - Labels use __() for i18n support

For each requirement, return:
- requirement: Short description of what was checked
- passed: true/false
- details: Specific findings (what passed/failed and where in the code)
- severity: critical/warning/info

Calculate overallScore as percentage of passed checks (critical = 20 points, warning = 10 points, info = 5 points each).

Provide a brief summary of the validation results.`,
      temperature: 0.1, // Low temperature for consistent validation
    });

    console.log('✅ Validation complete:', {
      score: result.object.overallScore,
      passedChecks: result.object.checks.filter(c => c.passed).length,
      totalChecks: result.object.checks.length
    });

    return Response.json(result.object);

  } catch (error: any) {
    console.error('❌ Widget Validation Error:', error);
    return Response.json(
      { error: 'Validation failed', details: error.message },
      { status: 500 }
    );
  }
}
