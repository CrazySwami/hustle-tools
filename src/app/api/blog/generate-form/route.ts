import { generateText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { description, clientBio, currentUrl, businessName, model = 'anthropic/claude-haiku-4-5-20251001' } = await request.json();

    if (!description) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    console.log('📝 Generating content order form with model:', model);
    console.log('📝 Inputs:', { currentUrl, businessName, description: description.substring(0, 100) });

    const { text } = await generateText({
      model,
      prompt: `You are a content strategist creating a detailed Content Order Form for a blog article.

==============================================
🎯 USER'S REQUEST (HIGHEST PRIORITY - FOLLOW THIS EXACTLY):
==============================================
${description}

==============================================
📋 CONTEXT INFORMATION:
==============================================
${businessName ? `Business Name: ${businessName}` : ''}
${currentUrl ? `Target Page URL: ${currentUrl}` : ''}
${clientBio ? `\nClient Background:\n${clientBio}` : ''}

==============================================
⚠️ CRITICAL INSTRUCTIONS - FOLLOW PRECISELY:
==============================================
THE USER'S REQUEST ABOVE IS THE MOST IMPORTANT SOURCE OF TRUTH. ALL fields below MUST be derived from what the user explicitly stated.

1. PRIMARY KEYWORD: If the user specified a PRIMARY KEYWORD in their request, it MUST be the FIRST item in the keywords array
2. PRIMARY FOCUS/TOPIC: The niche, target audience, and ALL fields must align with what the user EXPLICITLY requested
3. GEOGRAPHIC LOCATION: Use the EXACT location the user mentioned (e.g., "Tampa Bay, Florida" NOT "Seattle" or any other location)
4. TARGET AUDIENCE: Extract directly from the user's request - who did THEY say they're writing for?
5. ADDITIONAL INSTRUCTIONS: Suggest tone and style that matches the user's description and their stated target audience
6. DO NOT invent or assume information - ONLY use what the user provided
7. DO NOT use generic examples or placeholders - be specific to the user's actual request
8. If the user mentioned a client background, use that to inform your suggestions, but the USER'S REQUEST takes priority

Return ONLY valid JSON with this exact structure (no markdown, no code blocks):

{
  "niche": "Specific niche based on user request in format: Industry → Sub-category → Specialty",
  "intendedResult": "Clear CTA based on what the user wants readers to do",
  "targetAudience": "Specific demographics from user request, including location if mentioned",
  "geoLocations": "EXACT location from user request (e.g., 'Tampa Bay, Florida' or 'Remote/Online')",
  "keywords": ["PRIMARY_KEYWORD_from_user_request", "related_keyword_2", "related_keyword_3", "related_keyword_4", "related_keyword_5"],
  "additionalInstructions": "Tone and style instructions that match the user's content description and target audience"
}

Generate the JSON now:`,
      temperature: 0.5,
      maxTokens: 1000,
    });

    console.log('✅ Content order form generated successfully');
    console.log('📝 Raw response:', text.substring(0, 200));

    // Parse the JSON response
    let formData;
    try {
      // Try to extract JSON if wrapped in markdown code blocks
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        formData = JSON.parse(jsonMatch[0]);
      } else {
        formData = JSON.parse(text);
      }
    } catch (e) {
      console.error('❌ Failed to parse JSON response:', e);
      console.error('❌ Raw text that failed to parse:', text);
      // Return a default structure if parsing fails
      formData = {
        niche: "General",
        intendedResult: "Contact us",
        targetAudience: "General audience",
        geoLocations: "United States",
        keywords: ["keyword"],
        additionalInstructions: "",
        includeKeyPoints: true,
        contentPreference: "create"
      };
    }

    return NextResponse.json({ form: formData });
  } catch (error: any) {
    console.error('❌ Form generation error:', error);

    if (error.message && error.message.includes('AI Gateway')) {
      return NextResponse.json(
        {
          error: 'AI Gateway not configured. Please configure the Cloudflare AI Gateway in your Cloudflare dashboard, or contact your administrator.',
          details: error.message
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to generate form' },
      { status: 500 }
    );
  }
}
