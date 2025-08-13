[AI SDK](https://ai-sdk.dev/)

v5

Search…
`⌘ K`

Feedback

Sign in with Vercel

Sign in with Vercel

Menu

[Introduction](https://ai-sdk.dev/elements/overview)

[Setup](https://ai-sdk.dev/elements/overview/setup)

[Usage](https://ai-sdk.dev/elements/overview/usage)

[Troubleshooting](https://ai-sdk.dev/elements/overview/troubleshooting)

[Examples](https://ai-sdk.dev/elements/examples)

[Chatbot](https://ai-sdk.dev/elements/examples/chatbot)

[v0 clone](https://ai-sdk.dev/elements/examples/v0)

[Components](https://ai-sdk.dev/elements/components)

[Actions](https://ai-sdk.dev/elements/components/actions)

[Branch](https://ai-sdk.dev/elements/components/branch)

[Code Block](https://ai-sdk.dev/elements/components/code-block)

[Conversation](https://ai-sdk.dev/elements/components/conversation)

[Image](https://ai-sdk.dev/elements/components/image)

[Inline Citation](https://ai-sdk.dev/elements/components/inline-citation)

[Loader](https://ai-sdk.dev/elements/components/loader)

[Message](https://ai-sdk.dev/elements/components/message)

[Prompt Input](https://ai-sdk.dev/elements/components/prompt-input)

[Reasoning](https://ai-sdk.dev/elements/components/reasoning)

[Response](https://ai-sdk.dev/elements/components/response)

[Sources](https://ai-sdk.dev/elements/components/sources)

[Suggestion](https://ai-sdk.dev/elements/components/suggestion)

[Task](https://ai-sdk.dev/elements/components/task)

[Tool](https://ai-sdk.dev/elements/components/tool)

[Web Preview](https://ai-sdk.dev/elements/components/web-preview)

Copy markdown

# [Tool](https://ai-sdk.dev/elements/components/tool\#tool)

The `Tool` component displays a collapsible interface for showing/hiding tool details. It is designed to take the `ToolUIPart` type from the AI SDK and display it in a collapsible interface.

tool-database\_queryCompleted

## [Installation](https://ai-sdk.dev/elements/components/tool\#installation)

ai-elementsshadcnManual

```
npx ai-elements@latest add tool
```

## [Usage](https://ai-sdk.dev/elements/components/tool\#usage)

```code-block_code__yIKW2

import {

  Tool,

  ToolContent,

  ToolHeader,

  ToolOutput,

  ToolInput,

} from '@/components/ai-elements/tool';
```

```code-block_code__yIKW2

<Tool>

  <ToolHeader type="tool-call" state={'output-available' as const} />

  <ToolContent>

    <ToolInput input="Input to tool call" />

    <ToolOutput errorText="Error" output="Output from tool call" />

  </ToolContent>

</Tool>
```

## [Usage in AI SDK](https://ai-sdk.dev/elements/components/tool\#usage-in-ai-sdk)

Build a simple stateful weather app that renders the last message in a tool using [`useChat`](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat).

Add the following component to your frontend:

app/page.tsx

```code-block_code__yIKW2

'use client';

import { useChat } from '@ai-sdk/react';

import { DefaultChatTransport, type ToolUIPart } from 'ai';

import { Button } from '@/components/ui/button';

import { Response } from '@/components/ai-elements/response';

import {

  Tool,

  ToolContent,

  ToolHeader,

  ToolInput,

  ToolOutput,

} from '@/components/ai-elements/tool';

type WeatherToolInput = {

  location: string;

  units: 'celsius' | 'fahrenheit';

};

type WeatherToolOutput = {

  location: string;

  temperature: string;

  conditions: string;

  humidity: string;

  windSpeed: string;

  lastUpdated: string;

};

type WeatherToolUIPart = ToolUIPart<{

  fetch_weather_data: {

    input: WeatherToolInput;

    output: WeatherToolOutput;

  };

}>;

const Example = () => {

  const { messages, sendMessage, status } = useChat({

    transport: new DefaultChatTransport({

      api: '/api/weather',

    }),

  });

  const handleWeatherClick = () => {

    sendMessage({ text: 'Get weather data for San Francisco in fahrenheit' });

  };

  const latestMessage = messages[messages.length - 1];

  const weatherTool = latestMessage?.parts?.find(

    (part) => part.type === 'tool-fetch_weather_data',

  ) as WeatherToolUIPart | undefined;

  return (

    <div className="max-w-4xl mx-auto p-6 relative size-full rounded-lg border h-[600px]">

      <div className="flex flex-col h-full">

        <div className="space-y-4">

          <Button onClick={handleWeatherClick} disabled={status !== 'ready'}>

            Get Weather for San Francisco

          </Button>

          {weatherTool && (

            <Tool defaultOpen={true}>

              <ToolHeader type="fetch_weather_data" state={weatherTool.state} />

              <ToolContent>

                <ToolInput input={weatherTool.input} />

                <ToolOutput

                  output={

                    <Response>

                      {formatWeatherResult(weatherTool.output)}

                    </Response>

                  }

                  errorText={weatherTool.errorText}

                />

              </ToolContent>

            </Tool>

          )}

        </div>

      </div>

    </div>

  );

};

function formatWeatherResult(result: WeatherToolOutput): string {

  return `**Weather for ${result.location}**

**Temperature:** ${result.temperature}

**Conditions:** ${result.conditions}

**Humidity:** ${result.humidity}

**Wind Speed:** ${result.windSpeed}

*Last updated: ${result.lastUpdated}*`;

}

export default Example;
```

Add the following route to your backend:

app/api/weather/route.tsx

```code-block_code__yIKW2

import { streamText, UIMessage, convertToModelMessages } from 'ai';

import { z } from 'zod';

// Allow streaming responses up to 30 seconds

export const maxDuration = 30;

export async function POST(req: Request) {

  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({

    model: 'openai/gpt-4o',

    messages: convertToModelMessages(messages),

    tools: {

      fetch_weather_data: {

        description: 'Fetch weather information for a specific location',

        parameters: z.object({

          location: z

            .string()

            .describe('The city or location to get weather for'),

          units: z

            .enum(['celsius', 'fahrenheit'])

            .default('celsius')

            .describe('Temperature units'),

        }),

        inputSchema: z.object({

          location: z.string(),

          units: z.enum(['celsius', 'fahrenheit']).default('celsius'),

        }),

        execute: async ({ location, units }) => {

          await new Promise((resolve) => setTimeout(resolve, 1500));

          const temp =

            units === 'celsius'

              ? Math.floor(Math.random() * 35) + 5

              : Math.floor(Math.random() * 63) + 41;

          return {

            location,

            temperature: `${temp}°${units === 'celsius' ? 'C' : 'F'}`,

            conditions: 'Sunny',

            humidity: `12%`,

            windSpeed: `35 ${units === 'celsius' ? 'km/h' : 'mph'}`,

            lastUpdated: new Date().toLocaleString(),

          };

        },

      },

    },

  });

  return result.toUIMessageStreamResponse();

}
```

## [Features](https://ai-sdk.dev/elements/components/tool\#features)

- Collapsible interface for showing/hiding tool details
- Visual status indicators with icons and badges
- Support for multiple tool execution states (pending, running, completed, error)
- Formatted parameter display with JSON syntax highlighting
- Result and error handling with appropriate styling
- Composable structure for flexible layouts
- Accessible keyboard navigation and screen reader support
- Consistent styling that matches your design system
- Auto-opens completed tools by default for better UX

## [Examples](https://ai-sdk.dev/elements/components/tool\#examples)

### [Input Streaming (Pending)](https://ai-sdk.dev/elements/components/tool\#input-streaming-pending)

Shows a tool in its initial state while parameters are being processed.

tool-web\_searchPending

### [Input Available (Running)](https://ai-sdk.dev/elements/components/tool\#input-available-running)

Shows a tool that's actively executing with its parameters.

tool-image\_generationRunning

### [Output Available (Completed)](https://ai-sdk.dev/elements/components/tool\#output-available-completed)

Shows a completed tool with successful results. Opens by default to show the results. In this instance, the output is a JSON object, so we can use the `CodeBlock` component to display it.

tool-database\_queryCompleted

### [Output Error](https://ai-sdk.dev/elements/components/tool\#output-error)

Shows a tool that encountered an error during execution. Opens by default to display the error.

tool-api\_requestError

## [Props](https://ai-sdk.dev/elements/components/tool\#props)

### [`<Tool />`](https://ai-sdk.dev/elements/components/tool\#tool-)

### \[...props\]?:

React.ComponentProps<typeof Collapsible>

Any other props are spread to the root Collapsible component.

### [`<ToolHeader />`](https://ai-sdk.dev/elements/components/tool\#toolheader-)

### type:

ToolUIPart\["type"\]

The type/name of the tool.

### state:

ToolUIPart\["state"\]

The current state of the tool (input-streaming, input-available, output-available, or output-error).

### className?:

string

Additional CSS classes to apply to the header.

### \[...props\]?:

React.ComponentProps<typeof CollapsibleTrigger>

Any other props are spread to the CollapsibleTrigger.

### [`<ToolContent />`](https://ai-sdk.dev/elements/components/tool\#toolcontent-)

### \[...props\]?:

React.ComponentProps<typeof CollapsibleContent>

Any other props are spread to the CollapsibleContent.

### [`<ToolInput />`](https://ai-sdk.dev/elements/components/tool\#toolinput-)

### input:

ToolUIPart\["input"\]

The input parameters passed to the tool, displayed as formatted JSON.

### \[...props\]?:

React.ComponentProps<"div">

Any other props are spread to the underlying div.

### [`<ToolOutput />`](https://ai-sdk.dev/elements/components/tool\#tooloutput-)

### output:

React.ReactNode

The output/result of the tool execution.

### errorText:

ToolUIPart\["errorText"\]

An error message if the tool execution failed.

### \[...props\]?:

React.ComponentProps<"div">

Any other props are spread to the underlying div.

On this page

[Tool](https://ai-sdk.dev/elements/components/tool#tool)

[Installation](https://ai-sdk.dev/elements/components/tool#installation)

[Usage](https://ai-sdk.dev/elements/components/tool#usage)

[Usage in AI SDK](https://ai-sdk.dev/elements/components/tool#usage-in-ai-sdk)

[Features](https://ai-sdk.dev/elements/components/tool#features)

[Examples](https://ai-sdk.dev/elements/components/tool#examples)

[Input Streaming (Pending)](https://ai-sdk.dev/elements/components/tool#input-streaming-pending)

[Input Available (Running)](https://ai-sdk.dev/elements/components/tool#input-available-running)

[Output Available (Completed)](https://ai-sdk.dev/elements/components/tool#output-available-completed)

[Output Error](https://ai-sdk.dev/elements/components/tool#output-error)

[Props](https://ai-sdk.dev/elements/components/tool#props)

[<Tool />](https://ai-sdk.dev/elements/components/tool#tool-)

[<ToolHeader />](https://ai-sdk.dev/elements/components/tool#toolheader-)

[<ToolContent />](https://ai-sdk.dev/elements/components/tool#toolcontent-)

[<ToolInput />](https://ai-sdk.dev/elements/components/tool#toolinput-)

[<ToolOutput />](https://ai-sdk.dev/elements/components/tool#tooloutput-)

Elevate your AI applications with Vercel.

Trusted by OpenAI, Replicate, Suno, Pinecone, and more.

Vercel provides tools and infrastructure to deploy AI apps and features at scale.

[Talk to an expert](https://vercel.com/contact/sales?utm_source=ai_sdk&utm_medium=web&utm_campaign=contact_sales_cta&utm_content=talk_to_an_expert_sdk_docs)