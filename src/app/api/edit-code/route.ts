/**
 * Edit Code API Endpoint
 *
 * Generates modified code using AI (full-file replacement approach).
 * Based on research from /docs/ai-diff-editing-research.md
 *
 * Flow:
 * 1. Receive: fileType, originalCode, instructions
 * 2. Generate: Full modified file using AI
 * 3. Return: Modified code (diff calculated client-side)
 *
 * Research-backed approach:
 * - Full-file generation (more accurate than asking AI to generate diffs)
 * - GPT-4.1 at 0.3 temperature for balanced output
 * - Token-efficient for small files (<500 lines, typical for HTML/CSS/JS sections)
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { gateway } from '@ai-sdk/gateway';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface EditCodeRequest {
  fileType: 'html' | 'css' | 'js';
  originalCode: string;
  instructions: string;
  model?: string; // Optional: uses Haiku 4.5 as default
}

const fileTypeLabels = {
  html: 'HTML',
  css: 'CSS',
  js: 'JavaScript',
};

const fileTypeExtensions = {
  html: '.html',
  css: '.css',
  js: '.js',
};

export async function POST(req: NextRequest) {
  try {
    const body: EditCodeRequest = await req.json();
    const { fileType, originalCode, instructions, model } = body;

    // Use provided model or default to Haiku 4.5
    const selectedModel = model || 'anthropic/claude-haiku-4-5-20251001';

    // Validation
    if (!fileType || !['html', 'css', 'js'].includes(fileType)) {
      return NextResponse.json(
        { error: 'Invalid file type. Must be html, css, or js.' },
        { status: 400 }
      );
    }

    if (!originalCode) {
      return NextResponse.json(
        { error: 'Original code is required.' },
        { status: 400 }
      );
    }

    if (!instructions || instructions.trim() === '') {
      return NextResponse.json(
        { error: 'Instructions are required.' },
        { status: 400 }
      );
    }

    // Build system prompt (emphasizes full-file output)
    const systemPrompt = `You are an expert ${fileTypeLabels[fileType]} developer. Your task is to modify existing code based on user instructions.

**CRITICAL RULES:**
1. Return ONLY the complete modified ${fileTypeLabels[fileType]} code
2. Do NOT include explanations, markdown, or code fences
3. Do NOT add DOCTYPE, <html>, <head>, or <body> tags for HTML (section-level only)
4. Do NOT add <style> tags for CSS (pure CSS only)
5. Do NOT add <script> tags for JavaScript (pure JS only)
6. Preserve code style, indentation, and formatting as much as possible
7. Make ONLY the requested changes - do not refactor unnecessarily
8. If the instruction is unclear or impossible, return the original code unchanged

**Output Format:**
- For HTML: Section-level elements only (e.g., <div>, <section>, <header>, etc.)
- For CSS: Pure CSS rules only (no <style> tags)
- For JavaScript: Pure JavaScript only (no <script> tags)

**Example:**
User: "Change button color to red"
Original: .button { color: blue; }
Output: .button { color: red; }`;

    const userPrompt = `Here is the original ${fileTypeLabels[fileType]} code:

\`\`\`${fileType}
${originalCode}
\`\`\`

**Instructions:** ${instructions}

Please provide the ENTIRE modified ${fileTypeLabels[fileType]} code with the requested changes applied. Remember:
- Return ONLY the code (no explanations)
- Include the COMPLETE file (not just changed sections)
- Preserve the original formatting and style`;

    // Generate modified code using AI
    console.log(`📝 Generating ${fileType.toUpperCase()} edit with model: ${selectedModel}, instructions: "${instructions}"`);

    const { text: modifiedCode } = await generateText({
      model: gateway(selectedModel, {
        apiKey: process.env.AI_GATEWAY_API_KEY || '',
      }),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.3,
      maxTokens: 4000,
    });

    // Clean up the output (remove any markdown artifacts)
    let cleanedCode = modifiedCode.trim();

    // Remove markdown code fences if present
    if (cleanedCode.startsWith('```')) {
      cleanedCode = cleanedCode.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim();
    }

    // Validate that we got actual code back
    if (!cleanedCode || cleanedCode.length === 0) {
      throw new Error('AI returned empty code');
    }

    // Check if AI returned the same code (no changes made)
    const unchanged = cleanedCode.trim() === originalCode.trim();

    console.log(`✅ ${fileType.toUpperCase()} edit generated (${cleanedCode.length} chars, unchanged: ${unchanged})`);

    return NextResponse.json({
      modifiedCode: cleanedCode,
      unchanged,
      stats: {
        originalLength: originalCode.length,
        modifiedLength: cleanedCode.length,
        difference: cleanedCode.length - originalCode.length,
      },
    });
  } catch (error) {
    console.error('❌ Edit code generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate modified code',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
