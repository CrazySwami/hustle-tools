export interface ComponentGenerationContext {
  userPrompt: string
  selectedText?: string
}

export const COMPONENT_GENERATION_SYSTEM_PROMPT = `You are an AI assistant that generates component data for a Tiptap rich text editor. Output must be valid JSON.`

export const CHART_PROMPT = (context: ComponentGenerationContext) => `
Create a chart from: "${context.userPrompt}"
${context.selectedText ? `Context: ${context.selectedText}` : ''}

IMPORTANT STYLING GUIDELINES:
- Use colors that work well in both light and dark modes
- Prefer vibrant, saturated colors that maintain contrast in both themes
- Recommended color palette:
  * Blue: #3b82f6 (works in both modes)
  * Purple: #8b5cf6 (works in both modes)
  * Green: #10b981 (works in both modes)
  * Orange: #f59e0b (works in both modes)
  * Red: #ef4444 (works in both modes)
  * Cyan: #06b6d4 (works in both modes)
- Avoid pure white (#ffffff) or pure black (#000000)
- The chart will be displayed on:
  * Light mode: white background (#ffffff)
  * Dark mode: dark background (#2a2a2a)

Generate JSON in this format:
{
  "type": "bar" | "line" | "pie" | "doughnut",
  "title": "Chart title",
  "data": {
    "labels": ["Label1", "Label2"],
    "datasets": [{
      "label": "Dataset name",
      "data": [10, 20, 30],
      "backgroundColor": ["#3b82f6", "#8b5cf6", "#10b981"]
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
