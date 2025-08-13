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

# [Loader](https://ai-sdk.dev/elements/components/loader\#loader)

The `Loader` component provides a spinning animation to indicate loading states in your AI applications. It includes both a customizable wrapper component and the underlying icon for flexible usage.

## [Installation](https://ai-sdk.dev/elements/components/loader\#installation)

ai-elementsshadcnManual

```
npx ai-elements@latest add loader
```

## [Usage](https://ai-sdk.dev/elements/components/loader\#usage)

```code-block_code__yIKW2

import { Loader } from '@/components/ai-elements/loader';
```

```code-block_code__yIKW2

<Loader />
```

## [Usage with AI SDK](https://ai-sdk.dev/elements/components/loader\#usage-with-ai-sdk)

Build a simple chat app that displays a loader before it the response streans by using `status === "submitted"`.

Add the following component to your frontend:

app/page.tsx

```code-block_code__yIKW2

'use client';

import {

  Conversation,

  ConversationContent,

  ConversationScrollButton,

} from '@/components/ai-elements/conversation';

import { Message, MessageContent } from '@/components/ai-elements/message';

import {

  Input,

  PromptInputTextarea,

  PromptInputSubmit,

} from '@/components/ai-elements/prompt-input';

import { Loader } from '@/components/ai-elements/loader';

import { useState } from 'react';

import { useChat } from '@ai-sdk/react';

const LoaderDemo = () => {

  const [input, setInput] = useState('');

  const { messages, sendMessage, status } = useChat();

  const handleSubmit = (e: React.FormEvent) => {

    e.preventDefault();

    if (input.trim()) {

      sendMessage({ text: input });

      setInput('');

    }

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

                          <div key={`${message.id}-${i}`}>{part.text}</div>

                        );

                      default:

                        return null;

                    }

                  })}

                </MessageContent>

              </Message>

            ))}

            {status === 'submitted' && <Loader />}

          </ConversationContent>

          <ConversationScrollButton />

        </Conversation>

        <Input

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

        </Input>

      </div>

    </div>

  );

};

export default LoaderDemo;
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

    model: 'openai/gpt-4o',

    messages: convertToModelMessages(messages),

  });

  return result.toUIMessageStreamResponse();

}
```

## [Features](https://ai-sdk.dev/elements/components/loader\#features)

- Clean, modern spinning animation using CSS animations
- Configurable size with the `size` prop
- Customizable styling with CSS classes
- Built-in `animate-spin` animation with proper centering
- Exports both `AILoader` wrapper and `LoaderIcon` for flexible usage
- Supports all standard HTML div attributes
- TypeScript support with proper type definitions
- Optimized SVG icon with multiple opacity levels for smooth animation
- Uses `currentColor` for proper theme integration
- Responsive and accessible design

## [Examples](https://ai-sdk.dev/elements/components/loader\#examples)

### [Different Sizes](https://ai-sdk.dev/elements/components/loader\#different-sizes)

Small (16px)

Medium (24px)

Large (32px)

Extra Large (48px)

### [Custom Styling](https://ai-sdk.dev/elements/components/loader\#custom-styling)

Blue

Green

Purple

Orange

Slow Animation

Fast Animation

With Background

Dark Background

## [Props](https://ai-sdk.dev/elements/components/loader\#props)

### [`<Loader />`](https://ai-sdk.dev/elements/components/loader\#loader-)

### size?:

number

The size (width and height) of the loader in pixels. Defaults to 16.

### \[...props\]?:

React.HTMLAttributes<HTMLDivElement>

Any other props are spread to the root div.

On this page

[Loader](https://ai-sdk.dev/elements/components/loader#loader)

[Installation](https://ai-sdk.dev/elements/components/loader#installation)

[Usage](https://ai-sdk.dev/elements/components/loader#usage)

[Usage with AI SDK](https://ai-sdk.dev/elements/components/loader#usage-with-ai-sdk)

[Features](https://ai-sdk.dev/elements/components/loader#features)

[Examples](https://ai-sdk.dev/elements/components/loader#examples)

[Different Sizes](https://ai-sdk.dev/elements/components/loader#different-sizes)

[Custom Styling](https://ai-sdk.dev/elements/components/loader#custom-styling)

[Props](https://ai-sdk.dev/elements/components/loader#props)

[<Loader />](https://ai-sdk.dev/elements/components/loader#loader-)

Elevate your AI applications with Vercel.

Trusted by OpenAI, Replicate, Suno, Pinecone, and more.

Vercel provides tools and infrastructure to deploy AI apps and features at scale.

[Talk to an expert](https://vercel.com/contact/sales?utm_source=ai_sdk&utm_medium=web&utm_campaign=contact_sales_cta&utm_content=talk_to_an_expert_sdk_docs)