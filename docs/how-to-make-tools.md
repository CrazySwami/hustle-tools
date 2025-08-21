# How to Create and Add New Tools

This guide provides a clear, repeatable process for adding new tools to the chat application. Following these steps will allow you to seamlessly extend the AI's capabilities.

There are two main parts to adding a new tool:
1.  **Backend**: Defining the tool's logic and making it available to the AI.
2.  **Frontend (Optional)**: Creating a custom user interface to display the tool's results in a rich, interactive way.

---

## Step 1: Define the Tool (Backend)

All tool definitions live in `src/lib/tools.ts`. This is the single source of truth for all tools in the application.

1.  **Open `src/lib/tools.ts`**.

2.  **Import necessary modules**: You'll always need `tool` from `ai` and `z` from `zod`.

3.  **Add your new tool** to the `tools` object. Use the `tool` helper function from the Vercel AI SDK.

    -   `description`: A clear, concise description of what the tool does. The AI uses this to decide when to use your tool.
    -   `inputSchema`: A schema defined with Zod. This validates the parameters that the AI provides to your tool.
    -   `execute`: An `async` function that contains the logic for your tool. It receives the validated parameters and should return a JSON object with the results.

### Example: Creating a `getStockPrice` Tool

```typescript
// src/lib/tools.ts
import { tool } from 'ai';
import { z } from 'zod';

// A hypothetical function to fetch stock data
async function fetchStockPrice(symbol: string) {
  // In a real scenario, you would call an external API here
  console.log(`Fetching stock price for ${symbol}...`);
  return Math.random() * 1000;
}

export const tools = {
  // ... other existing tools

  getStockPrice: tool({
    description: 'Get the current stock price for a given stock symbol.',
    inputSchema: z.object({
      symbol: z.string().describe('The stock symbol, e.g., GOOGL, AAPL'),
    }),
    execute: async ({ symbol }) => {
      const price = await fetchStockPrice(symbol);
      return {
        symbol,
        price: price.toFixed(2),
        timestamp: new Date().toISOString(),
      };
    },
  }),
};
```

Once you save this file, the AI will automatically have access to this new tool. No changes are needed in the API route (`src/app/api/chat/route.ts`).

---

## Step 2: Create a Custom UI Widget (Optional Frontend)

By default, the tool's result will be displayed as raw JSON. To provide a better user experience, you can create a custom React component to render the result.

1.  **Create a new widget file** in `src/components/tool-ui/`. For our example, let's call it `stock-widget.tsx`.

2.  **Build the component**. It will receive the `result` from the tool's `execute` function as a `data` prop.

### Example: Creating a `StockWidget`

```tsx
// src/components/tool-ui/stock-widget.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

interface StockData {
  symbol: string;
  price: string;
  timestamp: string;
}

export function StockWidget({ data }: { data: StockData }) {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-green-500" />
          Stock Price: {data.symbol.toUpperCase()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">${data.price}</p>
        <p className="text-sm text-muted-foreground">
          As of {new Date(data.timestamp).toLocaleTimeString()}
        </p>
      </CardContent>
    </Card>
  );
}
```

---

## Step 3: Integrate the New Widget (Frontend)

Finally, tell the `ToolResultRenderer` to use your new widget.

1.  **Open `src/components/tool-ui/tool-result-renderer.tsx`**.

2.  **Import your new widget** at the top of the file.

3.  **Add a new `case`** to the `switch` statement. The case should match the name of your tool in `tools.ts` (`getStockPrice` in our example).

### Example: Updating the Renderer

```tsx
// src/components/tool-ui/tool-result-renderer.tsx

// ... other imports
import { StockWidget } from './stock-widget'; // 1. Import your widget

export function ToolResultRenderer({ toolResult }: ToolResultRendererProps) {
  const { toolName, result } = toolResult;

  switch (toolName) {
    // ... other cases

    // 2. Add the new case for your tool
    case 'getStockPrice':
      return <StockWidget data={result} />;

    default:
      // Fallback renderer
      return (
        // ...
      );
  }
}
```

And that's it! The next time the AI uses the `getStockPrice` tool, the frontend will automatically render your custom `StockWidget` instead of the raw JSON.
