import { DesignSystemSummary, CSSClass } from './global-stylesheet-context';

/**
 * Parses CSS and extracts all class selectors with their rules
 */
export function parseCSS(css: string): { className: string; rules: string }[] {
  const classes: { className: string; rules: string }[] = [];

  // Remove comments
  const cleanCss = css.replace(/\/\*[\s\S]*?\*\//g, '');

  // Match class selectors and their rules
  // This regex matches: .classname { rules }
  const classRegex = /\.([a-zA-Z0-9_-]+)\s*\{([^}]*)\}/g;
  let match;

  while ((match = classRegex.exec(cleanCss)) !== null) {
    const className = match[1];
    const rules = match[2].trim();

    // Skip empty rules
    if (rules.length > 0) {
      classes.push({
        className: `.${className}`,
        rules: rules
      });
    }
  }

  return classes;
}

/**
 * Extracts CSS variables from :root or other selectors
 */
export function extractCSSVariables(css: string): {
  colors: Record<string, string>;
  fonts: Record<string, string>;
  spacing: Record<string, string>;
  other: Record<string, string>;
} {
  const variables = {
    colors: {} as Record<string, string>,
    fonts: {} as Record<string, string>,
    spacing: {} as Record<string, string>,
    other: {} as Record<string, string>
  };

  // Match :root { ... } block
  const rootMatch = css.match(/:root\s*\{([^}]*)\}/);
  if (!rootMatch) return variables;

  const rootContent = rootMatch[1];

  // Match CSS variables --var-name: value;
  const varRegex = /--([\w-]+)\s*:\s*([^;]+);/g;
  let match;

  while ((match = varRegex.exec(rootContent)) !== null) {
    const name = match[1];
    const value = match[2].trim();

    // Categorize by name
    if (name.includes('color') || name.includes('bg') || name.includes('text') ||
        value.startsWith('#') || value.startsWith('rgb') || value.startsWith('hsl')) {
      variables.colors[`--${name}`] = value;
    } else if (name.includes('font') || name.includes('family') || name.includes('weight')) {
      variables.fonts[`--${name}`] = value;
    } else if (name.includes('spacing') || name.includes('padding') || name.includes('margin') ||
               name.includes('gap') || value.match(/^\d+(px|rem|em|%)/)) {
      variables.spacing[`--${name}`] = value;
    } else {
      variables.other[`--${name}`] = value;
    }
  }

  return variables;
}

/**
 * Analyzes CSS and creates a design system summary using AI
 */
export async function analyzeCSSWithAI(css: string, sourceUrl?: string): Promise<DesignSystemSummary> {
  console.log('🔍 Starting CSS analysis...');

  // Step 1: Parse classes
  const parsedClasses = parseCSS(css);
  console.log(`📊 Found ${parsedClasses.length} classes`);

  // Step 2: Extract variables
  const variables = extractCSSVariables(css);
  console.log(`📊 Found ${Object.keys(variables.colors).length} color variables`);

  // Step 3: Use AI to categorize classes
  const categorizedClasses = await categorizeCSSClasses(parsedClasses);

  // Step 4: Build summary
  const summary: DesignSystemSummary = {
    classes: categorizedClasses,
    variables: variables,
    totalClasses: parsedClasses.length,
    extractedFrom: sourceUrl,
    extractedAt: new Date().toISOString()
  };

  console.log('✅ CSS analysis complete:', {
    typography: summary.classes.typography.length,
    layout: summary.classes.layout.length,
    components: summary.classes.components.length,
    colors: summary.classes.colors.length,
    utilities: summary.classes.utilities.length,
    totalClasses: summary.totalClasses
  });

  return summary;
}

/**
 * Uses AI to categorize CSS classes into design system categories
 */
async function categorizeCSSClasses(classes: { className: string; rules: string }[]): Promise<{
  typography: CSSClass[];
  layout: CSSClass[];
  components: CSSClass[];
  colors: CSSClass[];
  utilities: CSSClass[];
}> {
  // Limit to first 200 classes to avoid token limits
  const limitedClasses = classes.slice(0, 200);

  const prompt = `Analyze these CSS classes and categorize them. Return a JSON object with these categories:
- typography: Classes for text styling (font-size, font-weight, text-align, etc.)
- layout: Classes for page structure (containers, grids, flexbox, spacing, etc.)
- components: Classes for UI components (buttons, cards, modals, nav, etc.)
- colors: Classes specifically for colors (text colors, backgrounds, borders)
- utilities: Utility/helper classes (display, visibility, overflow, etc.)

For each class, provide:
- name: The class name
- rules: The CSS rules
- category: One of the categories above
- description: A brief 1-sentence description of what the class does

CSS Classes to analyze:
${limitedClasses.map(c => `${c.className} { ${c.rules} }`).join('\n')}

Return ONLY valid JSON in this format:
{
  "typography": [{ "name": ".text-xl", "rules": "font-size: 1.25rem", "category": "typography", "description": "Extra large text" }],
  "layout": [...],
  "components": [...],
  "colors": [...],
  "utilities": [...]
}`;

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'anthropic/claude-haiku-4-5-20251001',
        webSearch: false,
        enableReasoning: false,
        enableTools: false
      })
    });

    if (!response.ok) {
      throw new Error('AI categorization failed');
    }

    // Parse streaming response
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let jsonText = '';

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        jsonText += chunk;
      }
    }

    // Extract JSON from the response (it might have extra text)
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    const categorized = JSON.parse(jsonMatch[0]);
    return categorized;

  } catch (error) {
    console.error('❌ AI categorization failed, using fallback:', error);

    // Fallback: Simple categorization based on keywords
    return categorizeCSSClassesFallback(limitedClasses);
  }
}

/**
 * Fallback categorization using simple keyword matching
 */
function categorizeCSSClassesFallback(classes: { className: string; rules: string }[]): {
  typography: CSSClass[];
  layout: CSSClass[];
  components: CSSClass[];
  colors: CSSClass[];
  utilities: CSSClass[];
} {
  const categorized = {
    typography: [] as CSSClass[],
    layout: [] as CSSClass[],
    components: [] as CSSClass[],
    colors: [] as CSSClass[],
    utilities: [] as CSSClass[]
  };

  for (const cls of classes) {
    const name = cls.className.toLowerCase();
    const rules = cls.rules.toLowerCase();

    const cssClass: CSSClass = {
      name: cls.className,
      rules: cls.rules,
      category: 'utilities',
      description: `Styles for ${cls.className}`
    };

    // Typography
    if (name.includes('text') || name.includes('font') || name.includes('heading') ||
        rules.includes('font-size') || rules.includes('font-weight') || rules.includes('line-height')) {
      cssClass.category = 'typography';
      categorized.typography.push(cssClass);
    }
    // Layout
    else if (name.includes('container') || name.includes('grid') || name.includes('flex') ||
             name.includes('col') || name.includes('row') || name.includes('section') ||
             rules.includes('display') || rules.includes('flex') || rules.includes('grid')) {
      cssClass.category = 'layout';
      categorized.layout.push(cssClass);
    }
    // Components
    else if (name.includes('btn') || name.includes('button') || name.includes('card') ||
             name.includes('modal') || name.includes('nav') || name.includes('hero') ||
             name.includes('header') || name.includes('footer')) {
      cssClass.category = 'components';
      categorized.components.push(cssClass);
    }
    // Colors
    else if (name.includes('bg-') || name.includes('text-') || name.includes('color') ||
             rules.includes('color:') || rules.includes('background')) {
      cssClass.category = 'colors';
      categorized.colors.push(cssClass);
    }
    // Utilities (everything else)
    else {
      categorized.utilities.push(cssClass);
    }
  }

  return categorized;
}
