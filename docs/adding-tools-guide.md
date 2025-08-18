# Adding Tools to the AI Chat System

This guide explains how to add new tools to the AI chat system using the Vercel AI SDK. Tools allow the AI to perform specific actions and return structured data that can be rendered as interactive UI components.

## Overview

Our tool system consists of three main parts:
1. **Tool Definition** - Define the tool with input schema and execute function
2. **UI Widget** - Create a React component to render tool results
3. **Integration** - Wire the tool into the chat system

## Step-by-Step Guide

### 1. Define Your Tool

Add your tool to `/src/lib/tools.ts`:

```typescript
import { tool } from 'ai';
import { z } from 'zod';

export const myNewTool = tool({
  description: 'Brief description of what this tool does',
  inputSchema: z.object({
    // Define your input parameters with Zod schema
    parameter1: z.string().describe('Description of parameter1'),
    parameter2: z.number().optional().describe('Optional parameter'),
  }),
  execute: async ({ parameter1, parameter2 }) => {
    // Implement your tool logic here
    try {
      // Your tool implementation
      const result = await someAsyncOperation(parameter1, parameter2);
      
      return {
        success: true,
        data: result,
        // Include any other data you want to pass to the UI
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
});
```

**Best Practices for Tool Definition:**
- Use descriptive names and descriptions
- Validate inputs with Zod schemas
- Include helpful descriptions for each parameter
- Handle errors gracefully
- Return structured data that's easy to render in UI
- Keep execute functions focused and single-purpose

### 2. Create a UI Widget

Create a new widget component in `/src/components/tool-ui/`:

```typescript
// /src/components/tool-ui/my-new-tool-widget.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Download } from 'lucide-react';

interface MyNewToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

interface MyNewToolWidgetProps {
  result: MyNewToolResult;
  input: {
    parameter1: string;
    parameter2?: number;
  };
}

export function MyNewToolWidget({ result, input }: MyNewToolWidgetProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(result.data, null, 2));
  };

  if (!result.success) {
    return (
      <Card className="w-full max-w-2xl border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <span>Tool Error</span>
            <Badge variant="destructive">Failed</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{result.error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>My New Tool Result</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="h-8 px-2"
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Badge variant="secondary">Success</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Render your tool result data here */}
        <div className="space-y-2">
          <p><strong>Input:</strong> {input.parameter1}</p>
          {input.parameter2 && <p><strong>Parameter 2:</strong> {input.parameter2}</p>}
          <div className="mt-4">
            <h4 className="font-medium mb-2">Result:</h4>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 3. Update the Tool Result Renderer

Add your new widget to `/src/components/tool-ui/tool-result-renderer.tsx`:

```typescript
// Import your new widget
import { MyNewToolWidget } from './my-new-tool-widget';

// Add case in the switch statement
case 'myNewTool':
  return (
    <MyNewToolWidget 
      result={toolResult.result} 
      input={toolResult.args}
    />
  );
```

### 4. Export Your Tool

Update the exports in `/src/lib/tools.ts`:

```typescript
// At the bottom of the file
export const tools = {
  weatherTool,
  calculatorTool,
  codeGeneratorTool,
  taskManagerTool,
  myNewTool, // Add your new tool here
};
```

### 5. Test Your Tool

1. Start your development server
2. Enable tools in the chat interface (wrench icon)
3. Ask the AI to use your tool: "Can you use myNewTool with parameter1 as 'test'?"
4. Verify the tool executes and renders correctly

## Tool Examples

### Simple Data Fetching Tool

```typescript
export const userProfileTool = tool({
  description: 'Fetch user profile information',
  inputSchema: z.object({
    userId: z.string().describe('The user ID to fetch'),
  }),
  execute: async ({ userId }) => {
    // Simulate API call
    const profile = {
      id: userId,
      name: 'John Doe',
      email: 'john@example.com',
      joinDate: new Date().toISOString(),
    };
    
    return {
      success: true,
      profile,
    };
  },
});
```

### File Processing Tool

```typescript
export const fileProcessorTool = tool({
  description: 'Process and analyze file content',
  inputSchema: z.object({
    content: z.string().describe('File content to process'),
    format: z.enum(['json', 'csv', 'text']).describe('File format'),
  }),
  execute: async ({ content, format }) => {
    let result;
    
    switch (format) {
      case 'json':
        try {
          result = JSON.parse(content);
        } catch (e) {
          return { success: false, error: 'Invalid JSON format' };
        }
        break;
      case 'csv':
        result = content.split('\n').map(row => row.split(','));
        break;
      default:
        result = { wordCount: content.split(' ').length };
    }
    
    return {
      success: true,
      format,
      processedData: result,
    };
  },
});
```

## Best Practices

### Tool Design
- **Single Responsibility**: Each tool should do one thing well
- **Clear Naming**: Use descriptive names that indicate the tool's purpose
- **Input Validation**: Always validate inputs with Zod schemas
- **Error Handling**: Gracefully handle and return errors
- **Documentation**: Include clear descriptions for tools and parameters

### UI Widget Design
- **Consistent Styling**: Use existing UI components and design patterns
- **Error States**: Always handle and display error states
- **Loading States**: Show loading indicators for async operations
- **Accessibility**: Ensure widgets are accessible with proper ARIA labels
- **Responsive**: Make widgets work on different screen sizes

### Performance
- **Async Operations**: Use async/await for I/O operations
- **Error Boundaries**: Wrap widgets in error boundaries if needed
- **Memoization**: Use React.memo for expensive renders
- **Lazy Loading**: Consider lazy loading for heavy components

### Security
- **Input Sanitization**: Sanitize user inputs in tool execute functions
- **API Keys**: Never expose API keys in client-side code
- **Rate Limiting**: Implement rate limiting for external API calls
- **Validation**: Validate all data before processing

## Troubleshooting

### Tool Not Executing
- Check that the tool is exported in the `tools` object
- Verify the tool name matches exactly
- Check browser console for errors
- Ensure input schema validation passes

### UI Not Rendering
- Verify the tool result renderer includes your tool case
- Check that the widget component is properly imported
- Ensure the tool result structure matches widget expectations
- Check React DevTools for component errors

### Common Issues
- **Zod Schema Errors**: Ensure input schemas match the data being passed
- **Async Issues**: Make sure to await async operations in execute functions
- **Type Mismatches**: Verify TypeScript types match between tool and widget
- **Missing Dependencies**: Check that all required packages are installed

## Advanced Features

### Multi-Step Tools
Tools can be designed to work in multiple steps by returning partial results and instructions for the AI to continue:

```typescript
export const multiStepTool = tool({
  description: 'A tool that works in multiple steps',
  inputSchema: z.object({
    step: z.number().default(1),
    data: z.any().optional(),
  }),
  execute: async ({ step, data }) => {
    switch (step) {
      case 1:
        return {
          success: true,
          step: 1,
          nextStep: 2,
          message: 'Step 1 complete, proceed to step 2',
          data: { initialResult: 'some data' },
        };
      case 2:
        return {
          success: true,
          step: 2,
          complete: true,
          finalResult: `Processed: ${data.initialResult}`,
        };
      default:
        return { success: false, error: 'Invalid step' };
    }
  },
});
```

### Tool Composition
Tools can call other tools or services to compose complex functionality:

```typescript
export const composedTool = tool({
  description: 'A tool that combines multiple operations',
  inputSchema: z.object({
    input: z.string(),
  }),
  execute: async ({ input }) => {
    // Call multiple services or other tools
    const step1 = await someService(input);
    const step2 = await anotherService(step1.result);
    
    return {
      success: true,
      pipeline: [step1, step2],
      finalResult: step2.result,
    };
  },
});
```

## Conclusion

This system provides a flexible foundation for adding new tools to your AI chat application. Each tool can have custom logic and UI rendering, making it easy to create rich, interactive experiences for users.

For more examples, see the existing tools in `/src/lib/tools.ts` and their corresponding widgets in `/src/components/tool-ui/`.
