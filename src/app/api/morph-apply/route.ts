// Morph Fast Apply API - Merge lazy edits with original code
// Uses direct Morph API (not on AI Gateway yet)
export const maxDuration = 60;
export const runtime = 'nodejs'; // Explicitly use Node.js runtime for env vars

export async function POST(req: Request) {
  try {
    const {
      instruction,
      originalCode,
      lazyEdit,
      fileType,
    }: {
      instruction: string;
      originalCode: string;
      lazyEdit: string;
      fileType: 'html' | 'css' | 'js' | 'php';
    } = await req.json();

    // Check if this is a new file (empty originalCode)
    const isNewFile = originalCode.length === 0;

    console.log(`🔀 Morph Fast Apply: ${isNewFile ? 'Writing new' : 'Merging'} ${fileType.toUpperCase()} edit...`, {
      instruction: instruction.substring(0, 100),
      originalLength: originalCode.length,
      editLength: lazyEdit.length,
      efficiency: originalCode.length > 0
        ? `${Math.round((lazyEdit.length / originalCode.length) * 100)}% of original`
        : 'N/A (new file)',
    });

    // Validate inputs (originalCode can be empty string for new files)
    if (!instruction || lazyEdit === undefined || lazyEdit === null) {
      return Response.json(
        { error: 'Missing required fields: instruction, lazyEdit' },
        { status: 400 }
      );
    }

    if (!process.env.MORPH_API_KEY) {
      console.error('❌ MORPH_API_KEY not found in environment variables');
      console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('MORPH')));
      return Response.json(
        {
          error: 'MORPH_API_KEY not configured. Get one at https://morphllm.com',
          hint: 'Check Vercel dashboard > Settings > Environment Variables. Make sure MORPH_API_KEY is set for Production environment and redeploy.'
        },
        { status: 500 }
      );
    }

    // Call Morph API directly
    const startTime = Date.now();
    const response = await fetch('https://api.morphllm.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MORPH_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'morph-v3-fast',
        messages: [
          {
            role: 'user',
            content: `<instruction>${instruction}</instruction>
<code>${originalCode}</code>
<update>${lazyEdit}</update>`,
          },
        ],
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Morph API error:', response.status, errorText);
      throw new Error(`Morph API failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const mergedCode = data.choices[0]?.message?.content;
    const duration = Date.now() - startTime;

    // Get actual token usage from Morph response
    const usage = data.usage || {};
    const inputTokens = usage.prompt_tokens || 0;
    const outputTokens = usage.completion_tokens || 0;
    const totalTokens = usage.total_tokens || 0;

    // Calculate cost
    const MODEL_PRICING = {
      'morph/v3-fast': { input: 0.80, output: 1.20 },
      'morph/v3-large': { input: 0.90, output: 1.90 },
    };
    const pricing = MODEL_PRICING['morph/v3-fast'];
    const cost = (inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output;

    console.log(`✅ Morph merge complete in ${duration}ms`, {
      originalLength: originalCode.length,
      mergedLength: mergedCode?.length || 0,
      inputTokens,
      outputTokens,
      totalTokens,
      cost: `$${cost.toFixed(6)}`,
      tokensPerSec: totalTokens > 0 ? Math.round((totalTokens / duration) * 1000) : 0,
    });

    // Validate result
    if (!mergedCode || mergedCode.trim().length === 0) {
      console.error('❌ Morph returned empty result');
      return Response.json(
        { error: 'Morph returned empty result. Check your edit format.' },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      mergedCode,
      stats: {
        originalLength: originalCode.length,
        editLength: lazyEdit.length,
        mergedLength: mergedCode.length,
        durationMs: duration,
        efficiency: originalCode.length > 0
          ? `${Math.round((lazyEdit.length / originalCode.length) * 100)}%`
          : 'N/A (new file)',
      },
      usage: {
        model: 'morph/v3-fast',
        inputTokens,
        outputTokens,
        totalTokens,
        cost,
      },
    });

  } catch (error: any) {
    console.error('❌ Morph Fast Apply error:', error);
    return Response.json(
      {
        error: error.message || 'Morph Fast Apply failed',
        details: error.response?.data || null,
      },
      { status: 500 }
    );
  }
}
