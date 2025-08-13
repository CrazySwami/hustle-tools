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

# [Conversation](https://ai-sdk.dev/elements/components/conversation\#conversation)

The `Conversation` component wraps messages and automatically scrolls to the bottom. Also includes a scroll button that appears when not at the bottom.

Hello, how are you?

![](https://github.com/haydenbleasel.png)

I'm good, thank you! How can I assist you today?

![](https://github.com/openai.png)

I'm looking for information about your services.

![](https://github.com/haydenbleasel.png)

Sure! We offer a variety of AI solutions. What are you interested in?

![](https://github.com/openai.png)

## [Installation](https://ai-sdk.dev/elements/components/conversation\#installation)

ai-elementsshadcnManual

```
npx ai-elements@latest add conversation
```

## [Usage](https://ai-sdk.dev/elements/components/conversation\#usage)

```code-block_code__yIKW2

import {

  Conversation,

  ConversationContent,

  ConversationScrollButton,

} from '@/components/ai-elements/conversation';
```

```code-block_code__yIKW2

<Conversation className="relative w-full" style={{ height: '500px' }}>

  <ConversationContent>

    <Message from={'user'}>

      <MessageContent>Hi there!</MessageContent>

    </Message>

  </ConversationContent>

  <ConversationScrollButton />

</Conversation>
```

## [Usage with AI SDK](https://ai-sdk.dev/elements/components/conversation\#usage-with-ai-sdk)

Build a simple conversational UI with `Conversation` and [`PromptInput`](https://ai-sdk.dev/elements/components/prompt-input):

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

import { useState } from 'react';

import { useChat } from '@ai-sdk/react';

import { Response } from '@/components/ai-elements/response';

const ConversationDemo = () => {

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

                      case 'text': // we don't use any reasoning or tool calls in this example

                        return (

                          <Response key={`${message.id}-${i}`}>

                            {part.text}

                          </Response>

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

export default ConversationDemo;
```

Add the following route to your backend:

api/chat/route.ts

```code-block_code__yIKW2

import { streamText, UIMessage, convertToModelMessages } from 'ai';

// Allow streaming responses up to 30 seconds

export const maxDuration = 30;

export async function POST(req: Request) {

  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({

    model: 'openai/gpt-4o',

    messages: convertToModelMessages(messages),

  });

  return result.toUIMessageStreamResponse();

}
```

## [Features](https://ai-sdk.dev/elements/components/conversation\#features)

- Automatic scrolling to the bottom when new messages are added
- Smooth scrolling behavior with configurable animation
- Scroll button that appears when not at the bottom
- Responsive design with customizable padding and spacing
- Flexible content layout with consistent message spacing
- Accessible with proper ARIA roles for screen readers
- Customizable styling through className prop
- Support for any number of child message components

## [Props](https://ai-sdk.dev/elements/components/conversation\#props)

### [`<Conversation />`](https://ai-sdk.dev/elements/components/conversation\#conversation-)

### contextRef:

React.Ref<StickToBottomContext>

Optional ref to access the StickToBottom context object.

### instance:

StickToBottomInstance

Optional instance for controlling the StickToBottom component.

### children:

((context: StickToBottomContext) => ReactNode) \| ReactNode

Render prop or ReactNode for custom rendering with context.

### \[...props\]:

Omit<React.HTMLAttributes<HTMLDivElement>, "children">

Any other props are spread to the root div.

### [`<ConversationContent />`](https://ai-sdk.dev/elements/components/conversation\#conversationcontent-)

### children:

((context: StickToBottomContext) => ReactNode) \| ReactNode

Render prop or ReactNode for custom rendering with context.

### \[...props\]:

Omit<React.HTMLAttributes<HTMLDivElement>, "children">

Any other props are spread to the root div.

### [`<ConversationScrollButton />`](https://ai-sdk.dev/elements/components/conversation\#conversationscrollbutton-)

### \[...props\]:

ComponentProps<typeof Button>

Any other props are spread to the underlying shadcn/ui Button component.

On this page

[Conversation](https://ai-sdk.dev/elements/components/conversation#conversation)

[Installation](https://ai-sdk.dev/elements/components/conversation#installation)

[Usage](https://ai-sdk.dev/elements/components/conversation#usage)

[Usage with AI SDK](https://ai-sdk.dev/elements/components/conversation#usage-with-ai-sdk)

[Features](https://ai-sdk.dev/elements/components/conversation#features)

[Props](https://ai-sdk.dev/elements/components/conversation#props)

[<Conversation />](https://ai-sdk.dev/elements/components/conversation#conversation-)

[<ConversationContent />](https://ai-sdk.dev/elements/components/conversation#conversationcontent-)

[<ConversationScrollButton />](https://ai-sdk.dev/elements/components/conversation#conversationscrollbutton-)

Elevate your AI applications with Vercel.

Trusted by OpenAI, Replicate, Suno, Pinecone, and more.

Vercel provides tools and infrastructure to deploy AI apps and features at scale.

[Talk to an expert](https://vercel.com/contact/sales?utm_source=ai_sdk&utm_medium=web&utm_campaign=contact_sales_cta&utm_content=talk_to_an_expert_sdk_docs)