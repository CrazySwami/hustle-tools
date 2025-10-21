import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface PreparedContext {
  contextType: 'full' | 'targeted' | 'summary' | 'none';
  json?: any;
  summary?: string;
  tokenEstimate: number;
}

interface DependencyInfo {
  parents: any[];
  children: any[];
  references: any[];
  globals: any[];
}

export async function POST(req: NextRequest) {
  try {
    const { fullJson, intent, message } = await req.json();

    // If intent requires full JSON, return it immediately
    if (intent.requiresFullJson || intent.category === 'complex') {
      console.log('📦 Sending full JSON (required by intent)');
      return NextResponse.json({
        contextType: 'full',
        json: fullJson,
        summary: null,
        tokenEstimate: Math.ceil(JSON.stringify(fullJson).length / 4)
      } as PreparedContext);
    }

    // If documentation query, send no JSON
    if (intent.category === 'documentation') {
      console.log('📚 Documentation query - no JSON needed');
      return NextResponse.json({
        contextType: 'none',
        json: null,
        summary: 'User asked about documentation/how-to. No JSON context needed.',
        tokenEstimate: 0
      } as PreparedContext);
    }

    // If structure query, create summary
    if (intent.category === 'query_structure') {
      console.log('📊 Creating structural summary');
      const summary = await createStructuralSummary(fullJson, message);
      return NextResponse.json({
        contextType: 'summary',
        json: null,
        summary,
        tokenEstimate: Math.ceil(summary.length / 4)
      } as PreparedContext);
    }

    // If modify_json with high confidence, extract targeted context
    if (intent.category === 'modify_json' && intent.confidence >= 0.7) {
      console.log('🎯 Extracting targeted context for:', intent.targetElements);
      const targeted = await extractTargetedContext(fullJson, intent.targetElements, message);
      return NextResponse.json({
        contextType: 'targeted',
        json: targeted.context,
        summary: targeted.summary,
        tokenEstimate: Math.ceil(JSON.stringify(targeted.context).length / 4)
      } as PreparedContext);
    }

    // Fallback: send full JSON
    console.log('⚠️ Uncertain intent - sending full JSON as safety');
    return NextResponse.json({
      contextType: 'full',
      json: fullJson,
      summary: null,
      tokenEstimate: Math.ceil(JSON.stringify(fullJson).length / 4)
    } as PreparedContext);

  } catch (error: any) {
    console.error('❌ Context preparation error:', error);

    // Safe fallback
    return NextResponse.json({
      contextType: 'full',
      json: req.body,
      summary: null,
      tokenEstimate: 0
    } as PreparedContext, { status: 500 });
  }
}

// Create a structural summary of the JSON
async function createStructuralSummary(json: any, userMessage: string): Promise<string> {
  const stats = analyzeJsonStructure(json);

  const summaryPrompt = `You are analyzing an Elementor template JSON structure. The user asked: "${userMessage}"

JSON Statistics:
- Total sections: ${stats.sectionCount}
- Total widgets: ${stats.widgetCount}
- Widget types: ${JSON.stringify(stats.widgetTypes)}
- Total elements: ${stats.elementCount}
- Has global settings: ${stats.hasGlobalSettings}
- Global colors defined: ${stats.globalColors}
- Global fonts defined: ${stats.globalFonts}

Create a concise 2-3 sentence summary that answers the user's question based on this structure.
Focus on what they asked about. Be specific with numbers and types.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',  // Using mini for context preparation
      messages: [{ role: 'user', content: summaryPrompt }],
      temperature: 0.5,
      max_tokens: 200
    })
  });

  if (!response.ok) {
    // Fallback to basic summary
    return `Your template has ${stats.sectionCount} sections and ${stats.widgetCount} widgets. Widget types: ${Object.entries(stats.widgetTypes).map(([type, count]) => `${count} ${type}`).join(', ')}.`;
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || 'Unable to generate summary.';
}

// Extract targeted context with dependencies
async function extractTargetedContext(
  json: any,
  targetElements: string[],
  userMessage: string
): Promise<{ context: any; summary: string }> {
  // Find all matching elements
  const matches: any[] = [];
  const dependencies: DependencyInfo = {
    parents: [],
    children: [],
    references: [],
    globals: []
  };

  // Traverse JSON to find target elements
  traverseJson(json, targetElements, matches, dependencies);

  console.log(`🔍 Search results: Found ${matches.length} matches for [${targetElements.join(', ')}]`);

  // If no matches found but we're looking for text content, include all text-editor widgets
  if (matches.length === 0 && targetElements.some(t => ['paragraph', 'text'].includes(t.toLowerCase()))) {
    console.log('📝 No direct matches, searching for text-editor widgets...');
    const textEditors: any[] = [];
    traverseJson(json, ['text-editor', 'heading'], textEditors, dependencies);
    matches.push(...textEditors);
    console.log(`📝 Found ${textEditors.length} text-editor/heading widgets`);
  }

  // Build context object
  const context = {
    targets: matches,
    dependencies: {
      parents: dependencies.parents,
      globals: dependencies.globals,
      // Only include children if not too many
      children: dependencies.children.length > 10 ? [] : dependencies.children,
    },
    metadata: {
      totalMatches: matches.length,
      hasMoreChildren: dependencies.children.length > 10,
    }
  };

  // Create summary of the rest of the template
  const stats = analyzeJsonStructure(json);
  const summary = `Found ${matches.length} matching element(s). Template has ${stats.sectionCount} sections, ${stats.widgetCount} total widgets. Other widgets not included in context.`;

  return { context, summary };
}

// Traverse JSON to find elements and build dependency graph
function traverseJson(
  obj: any,
  targetTypes: string[],
  matches: any[],
  dependencies: DependencyInfo,
  parent: any = null,
  path: string = ''
): void {
  if (!obj || typeof obj !== 'object') return;

  // Check if this is a widget/element we're looking for
  const widgetType = obj.widgetType?.toLowerCase() || obj.elType?.toLowerCase();

  // Log widget types for debugging (only for widgets, not all objects)
  if (widgetType && obj.id) {
    console.log(`🔎 Found widget: ${widgetType} at ${path}`);
  }

  if (widgetType && targetTypes.some(t => widgetType.includes(t.toLowerCase()))) {
    console.log(`✅ MATCH: ${widgetType} matches target ${targetTypes}`);
    matches.push({
      ...obj,
      _path: path,
      _widgetType: widgetType
    });

    // Add parent if exists
    if (parent && !dependencies.parents.some(p => p._path === parent._path)) {
      dependencies.parents.push(parent);
    }
  }

  // Check for global settings references
  if (obj.settings) {
    const settings = obj.settings;
    if (settings.__globals__) {
      Object.entries(settings.__globals__).forEach(([key, value]) => {
        if (!dependencies.globals.some(g => g.key === key)) {
          dependencies.globals.push({ key, value, _path: path });
        }
      });
    }
  }

  // Recurse into children
  if (Array.isArray(obj.elements)) {
    obj.elements.forEach((child: any, index: number) => {
      traverseJson(
        child,
        targetTypes,
        matches,
        dependencies,
        { ...obj, _path: path },
        `${path}/elements/${index}`
      );
    });
  }

  // Recurse into content array
  if (Array.isArray(obj.content)) {
    obj.content.forEach((item: any, index: number) => {
      traverseJson(
        item,
        targetTypes,
        matches,
        dependencies,
        { ...obj, _path: path },
        `${path}/content/${index}`
      );
    });
  }

  // Recurse into object properties
  if (!Array.isArray(obj)) {
    Object.keys(obj).forEach(key => {
      if (typeof obj[key] === 'object' && key !== 'settings') {
        traverseJson(
          obj[key],
          targetTypes,
          matches,
          dependencies,
          parent,
          `${path}/${key}`
        );
      }
    });
  }
}

// Analyze JSON structure for statistics
function analyzeJsonStructure(json: any): any {
  const stats = {
    sectionCount: 0,
    widgetCount: 0,
    widgetTypes: {} as Record<string, number>,
    elementCount: 0,
    hasGlobalSettings: false,
    globalColors: 0,
    globalFonts: 0,
  };

  function count(obj: any): void {
    if (!obj || typeof obj !== 'object') return;

    stats.elementCount++;

    const elType = obj.elType?.toLowerCase();
    const widgetType = obj.widgetType?.toLowerCase();

    if (elType === 'section') stats.sectionCount++;
    if (widgetType) {
      stats.widgetCount++;
      stats.widgetTypes[widgetType] = (stats.widgetTypes[widgetType] || 0) + 1;
    }

    // Check for global settings
    if (obj.settings?.__globals__) {
      stats.hasGlobalSettings = true;
    }

    // Count global colors/fonts
    if (obj.system_colors) stats.globalColors = obj.system_colors.length;
    if (obj.custom_colors) stats.globalColors += obj.custom_colors.length;
    if (obj.system_typography) stats.globalFonts = obj.system_typography.length;
    if (obj.custom_typography) stats.globalFonts += obj.custom_typography.length;

    if (Array.isArray(obj.elements)) obj.elements.forEach(count);
    if (Array.isArray(obj.content)) obj.content.forEach(count);

    Object.keys(obj).forEach(key => {
      if (typeof obj[key] === 'object' && !['elements', 'content', 'settings'].includes(key)) {
        count(obj[key]);
      }
    });
  }

  count(json);
  return stats;
}
