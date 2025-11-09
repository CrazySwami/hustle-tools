import { NextRequest, NextResponse } from 'next/server'
import { streamText } from 'ai'
import { gateway } from '@ai-sdk/gateway'
import { getComponentPrompt } from '@/lib/component-prompts'

const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { componentType, userPrompt, selectedText, model } = await req.json()

    const systemPrompt = getComponentPrompt(componentType, { userPrompt, selectedText })

    const result = await streamText({
      model: gateway(model || 'anthropic/claude-3-5-sonnet-20241022', {
        apiKey: process.env.AI_GATEWAY_API_KEY!,
      }),
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('Component generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate component' },
      { status: 500 }
    )
  }
}
