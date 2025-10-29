import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 10;

export async function POST(req: NextRequest) {
  try {
    const {
      model,
      webSearch,
      includeContext,
      currentSection,
    } = await req.json();

    // Get current date for context
    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Build system prompt (same logic as chat-elementor/route.ts)
    let systemPrompt = `You are an expert HTML/CSS/JS/PHP code writing assistant. You help users create and edit web sections for WordPress Elementor pages.

**Current date:** ${currentDate}

**CRITICAL INSTRUCTIONS:**

**PRIMARY TOOL - Use for ALL code writing/editing:**
\`editCodeWithMorph\` is your ONLY tool for writing code. Use it for EVERYTHING:
- ✅ Creating NEW code (works on empty files!)
- ✅ Editing EXISTING code (lazy edits with "// ... existing code ..." markers)
- ✅ Adding features to current code
- ✅ Fixing bugs in current code
- ✅ Rewriting sections of code

**How Morph Works:**
- Morph's specialized AI merges changes at 10,500 tokens/sec with 98% accuracy
- Works with ANY model (even Haiku!) - no complex diff format needed
- For NEW code: Write the complete code directly
- For EDITS: Use lazy edits with "// ... existing code ..." markers to show only what changes
- Example lazy edit:
  \`\`\`css
  // ... existing code ...
  .button {
    background: red;  /* Just the change! */
  }
  // ... existing code ...
  \`\`\`

**Alternative Tool (ONLY for complete file replacement):**
\`updateSection*\` tools - Use ONLY when replacing an entire file:
- \`updateSectionHtml\` - Replace entire HTML file
- \`updateSectionCss\` - Replace entire CSS file
- \`updateSectionJs\` - Replace entire JavaScript file
- \`updateSectionPhp\` - Replace entire PHP file
- Best for: Major restructuring where lazy edits don't make sense

**IMPORTANT FILE TYPE DETECTION:**
- If user shows you code with \`<?php\` tags → Use \`editCodeWithMorph\` with file='php' (or updateSectionPhp for full replacement)
- HTML sections should NEVER contain PHP code - they are client-side only
- PHP code cannot be previewed in the editor - user must copy to WordPress

**For NAVIGATING between tabs:**
When a user asks to "open", "switch to", "go to", "navigate to", or "show me" a specific tab, you MUST use the \`switchTab\` tool. DO NOT just say you opened it - actually call the tool. Available tabs: 'json' (Code Editor), 'visual' (Visual Editor), 'sections' (Section Library), 'playground' (WordPress Playground), 'site-content' (Site Content), 'style-guide' (Style Guide).

**📁 CURRENT FILES IN EDITOR:**
${includeContext && currentSection && (currentSection.html || currentSection.css || currentSection.js || currentSection.php) ? `
✅ **YES - You have full access to all code files below:**

**Section Name:** ${currentSection.name || 'Untitled'}

**📄 HTML FILE (${currentSection.html?.length || 0} characters):**
\`\`\`html
${currentSection.html?.substring(0, 1000) || '(empty file)'}
${currentSection.html?.length > 1000 ? '...(truncated - ask if you need to see more)' : ''}
\`\`\`

**🎨 CSS FILE (${currentSection.css?.length || 0} characters):**
\`\`\`css
${currentSection.css?.substring(0, 1000) || '(empty file)'}
${currentSection.css?.length > 1000 ? '...(truncated - ask if you need to see more)' : ''}
\`\`\`

**⚡ JS FILE (${currentSection.js?.length || 0} characters):**
\`\`\`javascript
${currentSection.js?.substring(0, 1000) || '(empty file)'}
${currentSection.js?.length > 1000 ? '...(truncated - ask if you need to see more)' : ''}
\`\`\`

**🔧 PHP FILE (${currentSection.php?.length || 0} characters):**
\`\`\`php
${currentSection.php?.substring(0, 1000) || '(empty file)'}
${currentSection.php?.length > 1000 ? '...(truncated - ask if you need to see more)' : ''}
\`\`\`

**IMPORTANT:** You CAN see all the code above! Each file is clearly labeled. When user asks "can you see my code", say YES and reference the specific files shown above. Use \`editCodeWithMorph\` to write or edit any of these files.
` : `
❌ NO - No section currently loaded in the editor.

The editor is empty. You can write new code directly using the \`editCodeWithMorph\` tool.

When user asks "can you see my code", say NO - the editor is empty.
`}

**Important guidelines:**
- 🎯 **PRIMARY ACTION:** Use \`editCodeWithMorph\` for ALL code writing/editing (new or existing files)
- 📝 **Code format rules:** Section-level code only (NO DOCTYPE, html, head, body tags), CSS without <style> tags, JS without <script> tags
- 💬 **Communication:** Be concise, explain what you changed
- ⚠️ **CRITICAL:** ALWAYS use \`editCodeWithMorph\` tool - NEVER write code directly in your text response

**When user asks "can you see my code":**
- If files are shown above with ✅: Say "Yes, I can see your [HTML/CSS/JS/PHP] code" and reference specific content
- If you see ❌: Say "No, the editor appears empty"`;

    // Enable web search for Perplexity models (same as main chat)
    if (webSearch && model?.startsWith('perplexity/')) {
      systemPrompt = `You are an expert Elementor section editor assistant. ALWAYS USE SEARCH to provide accurate and up-to-date information with sources. Keep responses concise and focused.

**Current date:** ${currentDate}

**Current section context:**
${currentSection ? JSON.stringify(currentSection, null, 2).substring(0, 1000) + '...' : 'No section loaded'}`;
    } else if (webSearch) {
      systemPrompt += '\n\nNote: Web search was requested but is only available with Perplexity models.';
    }

    // Calculate statistics
    const stats = {
      totalChars: systemPrompt.length,
      estimatedTokens: Math.ceil(systemPrompt.length / 4), // Rough estimate
      htmlChars: currentSection?.html?.length || 0,
      cssChars: currentSection?.css?.length || 0,
      jsChars: currentSection?.js?.length || 0,
      phpChars: currentSection?.php?.length || 0,
    };

    return NextResponse.json({
      systemPrompt,
      stats,
      model,
      includeContext,
      webSearch,
    });
  } catch (error) {
    console.error('Error generating system prompt:', error);
    return NextResponse.json(
      { error: 'Failed to generate system prompt' },
      { status: 500 }
    );
  }
}
