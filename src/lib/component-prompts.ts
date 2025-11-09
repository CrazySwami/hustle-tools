export interface ComponentGenerationContext {
  userPrompt: string
  selectedText?: string
}

export const COMPONENT_GENERATION_SYSTEM_PROMPT = `You are an AI assistant that generates component data for a Tiptap rich text editor. Output must be valid JSON.`

export const CHART_PROMPT = (context: ComponentGenerationContext) => `
Create a chart from: "${context.userPrompt}"
${context.selectedText ? `Context: ${context.selectedText}` : ''}

Generate JSON in this format:
{
  "type": "bar" | "line" | "pie" | "doughnut",
  "title": "Chart title",
  "data": {
    "labels": ["Label1", "Label2"],
    "datasets": [{
      "label": "Dataset name",
      "data": [10, 20, 30],
      "backgroundColor": ["#3b82f6", "#8b5cf6"]
    }]
  },
  "fallbackText": "Text description"
}
`

export const INFO_CARD_PROMPT = (context: ComponentGenerationContext) => `
Create an info card from: "${context.userPrompt}"
${context.selectedText ? `Context: ${context.selectedText}` : ''}

Generate JSON:
{
  "type": "info" | "warning" | "success" | "error",
  "title": "Card title",
  "icon": "📌",
  "content": "Main content",
  "bullets": ["Point 1", "Point 2"],
  "footer": "Optional footer"
}
`

export function getComponentPrompt(
  componentType: 'chart' | 'infoCard',
  context: ComponentGenerationContext
): string {
  return componentType === 'chart' ? CHART_PROMPT(context) : INFO_CARD_PROMPT(context)
}
