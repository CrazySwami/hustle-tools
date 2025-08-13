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

# [Actions](https://ai-sdk.dev/elements/components/actions\#actions)

The `Actions` component provides a flexible row of action buttons for AI responses with common actions like retry, like, dislike, copy, and share.

Hello, how are you?

I am fine, thank you!

RetryLikeDislikeCopyShare

## [Installation](https://ai-sdk.dev/elements/components/actions\#installation)

ai-elementsshadcnManual

```
npx ai-elements@latest add actions
```

## [Usage](https://ai-sdk.dev/elements/components/actions\#usage)

```code-block_code__yIKW2

import { Actions, Action } from '@/components/ai-elements/actions';

import { ThumbsUpIcon } from 'lucide-react';
```

```code-block_code__yIKW2

<Actions className="mt-2">

  <Action label="Like">

    <ThumbsUpIcon className="size-4" />

  </Action>

</Actions>
```

## [Usage with AI SDK](https://ai-sdk.dev/elements/components/actions\#usage-with-ai-sdk)

Build a simple chat UI where the user can copy or regenerate the most recent message.

Add the following component to your frontend:

app/page.tsx

```code-block_code__yIKW2

'use client';

import { useState } from 'react';

import { Actions, Action } from '@/components/ai-elements/actions';

import { Message, MessageContent } from '@/components/ai-elements/message';

import {

  Conversation,

  ConversationContent,

  ConversationScrollButton,

} from '@/components/ai-elements/conversation';

import {

  Input,

  PromptInputTextarea,

  PromptInputSubmit,

} from '@/components/ai-elements/prompt-input';

import { Response } from '@/components/ai-elements/response';

import { RefreshCcwIcon, CopyIcon } from 'lucide-react';

import { useChat } from '@ai-sdk/react';

const ActionsDemo = () => {

  const [input, setInput] = useState('');

  const { messages, sendMessage, status, regenerate } = useChat();

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

            {messages.map((message, messageIndex) => (

              <Message from={message.role} key={message.id}>

                <MessageContent>

                  {message.parts.map((part, i) => {

                    switch (part.type) {

                      case 'text':

                        const isLastMessage =

                          messageIndex === messages.length - 1;

                        return (

                          <div key={`${message.id}-${i}`}>

                            <Response>{part.text}</Response>

                            {message.role === 'assistant' && isLastMessage && (

                              <Actions className="mt-2">

                                <Action

                                  onClick={() => regenerate()}

                                  label="Retry"

                                >

                                  <RefreshCcwIcon className="size-3" />

                                </Action>

                                <Action

                                  onClick={() =>

                                    navigator.clipboard.writeText(part.text)

                                  }

                                  label="Copy"

                                >

                                  <CopyIcon className="size-3" />

                                </Action>

                              </Actions>

                            )}

                          </div>

                        );

                      default:

                        return null;

                    }

                  })}

                </MessageContent>

              </Message>

            ))}

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

export default ActionsDemo;
```

Add the following route to your backend:

api/chat/route.ts

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

## [Features](https://ai-sdk.dev/elements/components/actions\#features)

- Row of composable action buttons with consistent styling
- Support for custom actions with tooltips
- Hover-to-show behavior by default (configurable)
- State management for toggle actions (like, dislike, favorite)
- Keyboard accessible with proper ARIA labels
- Clipboard and Web Share API integration
- TypeScript support with proper type definitions
- Consistent with design system styling

## [Examples](https://ai-sdk.dev/elements/components/actions\#examples)

This is a response from an assistant.

Try hovering over this message to see the actions appear!

RetryLikeDislikeCopyShareFavorite

## [Props](https://ai-sdk.dev/elements/components/actions\#props)

### [`<Actions />`](https://ai-sdk.dev/elements/components/actions\#actions-)

### \[...props\]:

React.HTMLAttributes<HTMLDivElement>

HTML attributes to spread to the root div.

### [`<Action />`](https://ai-sdk.dev/elements/components/actions\#action-)

### tooltip?:

string

Optional tooltip text shown on hover.

### label?:

string

Accessible label for screen readers. Also used as fallback if tooltip is not provided.

### \[...props\]:

React.ComponentProps<typeof Button>

Any other props are spread to the underlying shadcn/ui Button component.

On this page

[Actions](https://ai-sdk.dev/elements/components/actions#actions)

[Installation](https://ai-sdk.dev/elements/components/actions#installation)

[Usage](https://ai-sdk.dev/elements/components/actions#usage)

[Usage with AI SDK](https://ai-sdk.dev/elements/components/actions#usage-with-ai-sdk)

[Features](https://ai-sdk.dev/elements/components/actions#features)

[Examples](https://ai-sdk.dev/elements/components/actions#examples)

[Props](https://ai-sdk.dev/elements/components/actions#props)

[<Actions />](https://ai-sdk.dev/elements/components/actions#actions-)

[<Action />](https://ai-sdk.dev/elements/components/actions#action-)

Elevate your AI applications with Vercel.

Trusted by OpenAI, Replicate, Suno, Pinecone, and more.

Vercel provides tools and infrastructure to deploy AI apps and features at scale.

[Talk to an expert](https://vercel.com/contact/sales?utm_source=ai_sdk&utm_medium=web&utm_campaign=contact_sales_cta&utm_content=talk_to_an_expert_sdk_docs)