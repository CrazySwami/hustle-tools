/**
 * /api/edit-code
 *
 * API endpoint for generating unified diffs for code edits.
 * Takes current code content and an instruction, uses AI to generate modified code,
 * then returns a unified diff for preview and approval.
 *
 * Request Body:
 * {
 *   currentContent: { html, css, js },
 *   instruction: "Make the button red",
 *   file: "css",
 *   targetSection: ".hero-button" (optional)
 * }
 *
 * Response:
 * {
 *   type: "diff",
 *   file: "css",
 *   original: "...",
 *   modified: "...",
 *   unifiedDiff: "...",
 *   summary: { linesAdded: 2, linesRemoved: 1, hunks: 1 }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createAzure } from '@ai-sdk/azure';
import { createTwoFilesPatch, parsePatch } from 'diff';

// Initialize Azure OpenAI via AI Gateway
const azure = createAzure({
  resourceName: 'ai-gateway-hustle-tools',
  apiKey: process.env.AI_GATEWAY_API_KEY || '',
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { currentContent, instruction, file, targetSection } = body;

    if (!currentContent || !instruction || !file) {
      return NextResponse.json(
        { error: 'Missing required fields: currentContent, instruction, file' },
        { status: 400 }
      );
    }

    if (!['html', 'css', 'js'].includes(file)) {
      return NextResponse.json(
        { error: 'Invalid file type. Must be html, css, or js' },
        { status: 400 }
      );
    }

    const originalCode = currentContent[file] || '';

    // Check if original code is empty
    if (!originalCode.trim()) {
      return NextResponse.json(
        { error: `The ${file.toUpperCase()} file is empty. Please add some code first.` },
        { status: 400 }
      );
    }

    // Generate system prompt for unified diff output
    const systemPrompt = `You are an expert code editor that makes precise, targeted changes to code.

CRITICAL RULES:
1. You will receive code and an instruction for how to modify it
2. You MUST respond with ONLY the complete modified code
3. Do NOT include explanations, comments about changes, or markdown code blocks
4. Do NOT include diff syntax (like +++, ---, @@) in your response
5. Output the ENTIRE modified ${file.toUpperCase()} file, not just the changed portions
6. Maintain exact indentation and formatting style of the original
7. For CSS: Use the same selector format and property order as the original
8. For HTML: Preserve the structure and tag nesting of the original
9. For JavaScript: Keep the same coding style (var/let/const, semicolons, etc.)

If the instruction is unclear or impossible, still output valid code with minimal changes.`;

    const userPrompt = `Current ${file.toUpperCase()} code:
\`\`\`${file}
${originalCode}
\`\`\`

Instruction: ${instruction}${targetSection ? `\nTarget section: ${targetSection}` : ''}

Output the complete modified ${file.toUpperCase()} code:`;

    console.log('🤖 Generating code edit with AI...');
    console.log('File:', file);
    console.log('Instruction:', instruction);
    console.log('Original length:', originalCode.length);

    // Generate modified code with AI
    const { text: modifiedCode } = await generateText({
      model: azure('openai/gpt-4.1'),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.3, // Lower temperature for more deterministic code edits
      maxTokens: 4000,
    });

    console.log('✅ AI generated modified code');
    console.log('Modified length:', modifiedCode.length);

    // Clean up the modified code (remove markdown artifacts if any)
    const cleanedCode = modifiedCode
      .replace(/^```[a-z]*\n/gm, '')
      .replace(/\n```$/gm, '')
      .trim();

    // Generate unified diff
    const unifiedDiff = createTwoFilesPatch(
      `${file}.original`,
      `${file}.modified`,
      originalCode,
      cleanedCode,
      'Original',
      'Modified'
    );

    console.log('📊 Unified diff generated');

    // Parse the diff to extract summary statistics
    const parsedDiff = parsePatch(unifiedDiff);
    let linesAdded = 0;
    let linesRemoved = 0;
    let hunks = 0;

    if (parsedDiff.length > 0) {
      const diffHunks = parsedDiff[0].hunks;
      hunks = diffHunks.length;

      diffHunks.forEach((hunk) => {
        hunk.lines.forEach((line) => {
          if (line.startsWith('+') && !line.startsWith('+++')) {
            linesAdded++;
          } else if (line.startsWith('-') && !line.startsWith('---')) {
            linesRemoved++;
          }
        });
      });
    }

    console.log('📈 Diff summary:', { linesAdded, linesRemoved, hunks });

    return NextResponse.json({
      type: 'diff',
      file,
      original: originalCode,
      modified: cleanedCode,
      unifiedDiff,
      summary: {
        linesAdded,
        linesRemoved,
        hunks,
        instruction,
        targetSection: targetSection || null,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Error in /api/edit-code:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate code edit',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
