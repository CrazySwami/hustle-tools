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

# [Reasoning](https://ai-sdk.dev/elements/components/reasoning\#reasoning)

The `Reasoning` component displays AI reasoning content, automatically opening during streaming and closing when finished.

Thinking...

Let me think about this problem step by step.

First, I need to understand what the user is asking for.

They want a reasoning component that opens automatically when streaming begins and closes when streaming finishes. The component should be composable and follow existi

## [Installation](https://ai-sdk.dev/elements/components/reasoning\#installation)

ai-elementsshadcnManual

```
npx ai-elements@latest add reasoning
```

## [Usage](https://ai-sdk.dev/elements/components/reasoning\#usage)

```code-block_code__yIKW2

import {

  Reasoning,

  ReasoningContent,

  ReasoningTrigger,

} from '@/components/ai-elements/reasoning';
```

```code-block_code__yIKW2

<Reasoning className="w-full" isStreaming={false}>

  <ReasoningTrigger />

  <ReasoningContent>I need to computer the square of 2.</ReasoningContent>

</Reasoning>
```

## [Usage with AI SDK](https://ai-sdk.dev/elements/components/reasoning\#usage-with-ai-sdk)

Build a chatbot with reasoning using Deepseek R1.

Add the following component to your frontend:

app/page.tsx

```code-block_code__yIKW2

'use client';

import {

  Reasoning,

  ReasoningContent,

  ReasoningTrigger,

} from '@/components/ai-elements/reasoning';

import {

  Conversation,

  ConversationContent,

  ConversationScrollButton,

} from '@/components/ai-elements/conversation';

import {

  PromptInput,

  PromptInputTextarea,

  PromptInputSubmit,

} from '@/components/ai-elements/prompt-input';

import { Loader } from '@/components/ai-elements/loader';

import { Message, MessageContent } from '@/components/ai-elements/message';

import { useState } from 'react';

import { useChat } from '@ai-sdk/react';

import { Response } from @/components/ai-elements/response';

const ReasoningDemo = () => {

  const [input, setInput] = useState('');

  const { messages, sendMessage, status } = useChat();

  const handleSubmit = (e: React.FormEvent) => {

    e.preventDefault();

    sendMessage({ text: input });

    setInput('');

  };

  return (

    <div className="max-w-4xl mx-auto p-6 relative size-full rounded-lg border h-[600px]">

      <div className="flex flex-col h-full">

        <Conversation>

          <ConversationContent>

            {messages.map((message) => (

              <Message from={message.role} key={message.id}>

                <MessageContent>

                  {message.parts.map((part, i) => {

                    switch (part.type) {

                      case 'text':

                        return (

                          <Response key={`${message.id}-${i}`}>

                            {part.text}

                          </Response>

                        );

                      case 'reasoning':

                        return (

                          <Reasoning

                            key={`${message.id}-${i}`}

                            className="w-full"

                            isStreaming={status === 'streaming'}

                          >

                            <ReasoningTrigger />

                            <ReasoningContent>{part.text}</ReasoningContent>

                          </Reasoning>

                        );

                    }

                  })}

                </MessageContent>

              </Message>

            ))}

            {status === 'submitted' && <Loader />}

          </ConversationContent>

          <ConversationScrollButton />

        </Conversation>

        <PromptInput

          onSubmit={handleSubmit}

          className="mt-4 w-full max-w-2xl mx-auto relative"

        >

          <PromptInputTextarea

            value={input}

            placeholder="Say something..."

            onChange={(e) => setInput(e.currentTarget.value)}

            className="pr-12"

          />

          <PromptInputSubmit

            status={status === 'streaming' ? 'streaming' : 'ready'}

            disabled={!input.trim()}

            className="absolute bottom-1 right-1"

          />

        </PromptInput>

      </div>

    </div>

  );

};

export default ReasoningDemo;
```

Add the following route to your backend:

app/api/chat/route.ts

```code-block_code__yIKW2

import { streamText, UIMessage, convertToModelMessages } from 'ai';

// Allow streaming responses up to 30 seconds

export const maxDuration = 30;

export async function POST(req: Request) {

  const { model, messages }: { messages: UIMessage[]; model: string } =

    await req.json();

  const result = streamText({

    model: 'deepseek/deepseek-r1',

    messages: convertToModelMessages(messages),

  });

  return result.toUIMessageStreamResponse({

    sendReasoning: true,

  });

}
```

## [Features](https://ai-sdk.dev/elements/components/reasoning\#features)

- Automatically opens when streaming content and closes when finished
- Manual toggle control for user interaction
- Smooth animations and transitions powered by Radix UI
- Visual streaming indicator with pulsing animation
- Composable architecture with separate trigger and content components
- Built with accessibility in mind including keyboard navigation
- Responsive design that works across different screen sizes
- Seamlessly integrates with both light and dark themes
- Built on top of shadcn/ui Collapsible primitives
- TypeScript support with proper type definitions

## [Props](https://ai-sdk.dev/elements/components/reasoning\#props)

### [`<Reasoning />`](https://ai-sdk.dev/elements/components/reasoning\#reasoning-)

### isStreaming?:

boolean

Whether the reasoning is currently streaming (auto-opens and closes the panel).

### \[...props\]?:

React.ComponentProps<typeof Collapsible>

Any other props are spread to the underlying Collapsible component.

### [`<ReasoningTrigger />`](https://ai-sdk.dev/elements/components/reasoning\#reasoningtrigger-)

### title?:

string

Optional title to display in the trigger (default: "Reasoning").

### \[...props\]?:

React.ComponentProps<typeof CollapsibleTrigger>

Any other props are spread to the underlying CollapsibleTrigger component.

### [`<ReasoningContent />`](https://ai-sdk.dev/elements/components/reasoning\#reasoningcontent-)

### \[...props\]?:

React.ComponentProps<typeof CollapsibleContent>

Any other props are spread to the underlying CollapsibleContent component.

On this page

[Reasoning](https://ai-sdk.dev/elements/components/reasoning#reasoning)

[Installation](https://ai-sdk.dev/elements/components/reasoning#installation)

[Usage](https://ai-sdk.dev/elements/components/reasoning#usage)

[Usage with AI SDK](https://ai-sdk.dev/elements/components/reasoning#usage-with-ai-sdk)

[Features](https://ai-sdk.dev/elements/components/reasoning#features)

[Props](https://ai-sdk.dev/elements/components/reasoning#props)

[<Reasoning />](https://ai-sdk.dev/elements/components/reasoning#reasoning-)

[<ReasoningTrigger />](https://ai-sdk.dev/elements/components/reasoning#reasoningtrigger-)

[<ReasoningContent />](https://ai-sdk.dev/elements/components/reasoning#reasoningcontent-)

Elevate your AI applications with Vercel.

Trusted by OpenAI, Replicate, Suno, Pinecone, and more.

Vercel provides tools and infrastructure to deploy AI apps and features at scale.

[Talk to an expert](https://vercel.com/contact/sales?utm_source=ai_sdk&utm_medium=web&utm_campaign=contact_sales_cta&utm_content=talk_to_an_expert_sdk_docs)