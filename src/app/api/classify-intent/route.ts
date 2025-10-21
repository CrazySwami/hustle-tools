import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface IntentClassification {
  category: 'modify_json' | 'query_structure' | 'documentation' | 'general' | 'complex';
  confidence: number;
  requiresFullJson: boolean;
  targetElements: string[];
  reasoning: string;
}

export async function POST(req: NextRequest) {
  try {
    const { message, conversationHistory } = await req.json();

    // Build context from recent conversation
    const recentMessages = conversationHistory?.slice(-4) || [];
    const contextStr = recentMessages.map((m: any) => `${m.role}: ${m.content}`).join('\n');

    const classificationPrompt = `You are an intent classifier for an Elementor JSON editor chat interface. Analyze the user's message and classify their intent.

Recent conversation:
${contextStr}

User's current message: "${message}"

Classify into ONE of these categories:
1. "modify_json" - User wants to change/add/remove elements in their JSON (buttons, colors, text, widgets, etc.)
2. "query_structure" - User wants to know what's in their JSON (list widgets, count elements, find something)
3. "documentation" - User has questions about how Elementor works, how to use features, best practices
4. "general" - General conversation, greetings, unclear requests
5. "complex" - Multi-step changes, global style changes, restructuring, or requests affecting many elements

For "modify_json" category, identify:
- Target element types (e.g., "button", "heading", "section", "image")
- Whether it's a simple isolated change or affects multiple/related elements

Return ONLY valid JSON in this exact format:
{
  "category": "modify_json|query_structure|documentation|general|complex",
  "confidence": 0.0-1.0,
  "requiresFullJson": true|false,
  "targetElements": ["element_type", "..."],
  "reasoning": "brief explanation"
}

Rules:
- confidence > 0.7 for clear requests
- requiresFullJson = true if: category is "complex", confidence < 0.7, or change affects globals/multiple sections
- requiresFullJson = false if: simple isolated change, query, or documentation
- targetElements should be lowercased widget types like "button", "heading", "section"`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',  // Using mini for fast classification
        messages: [
          {
            role: 'user',
            content: classificationPrompt
          }
        ],
        temperature: 0.3, // Low temperature for consistent classification
        max_tokens: 300
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Intent classification failed:', errorData);

      // Fallback: assume complex and require full JSON
      return NextResponse.json({
        category: 'complex',
        confidence: 0.5,
        requiresFullJson: true,
        targetElements: [],
        reasoning: 'Classification failed, using safe fallback'
      } as IntentClassification);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';

    // Parse the JSON response
    let classification: IntentClassification;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      classification = JSON.parse(jsonStr);

      console.log('🎯 Intent classified:', classification);
    } catch (parseError) {
      console.error('❌ Failed to parse classification:', content);

      // Fallback
      classification = {
        category: 'complex',
        confidence: 0.5,
        requiresFullJson: true,
        targetElements: [],
        reasoning: 'Parse error, using safe fallback'
      };
    }

    return NextResponse.json(classification);

  } catch (error: any) {
    console.error('❌ Intent classification error:', error);

    // Safe fallback on any error
    return NextResponse.json({
      category: 'complex',
      confidence: 0.5,
      requiresFullJson: true,
      targetElements: [],
      reasoning: `Error: ${error.message}`
    } as IntentClassification);
  }
}
