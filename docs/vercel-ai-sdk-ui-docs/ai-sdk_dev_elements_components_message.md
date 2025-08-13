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

# [Message](https://ai-sdk.dev/elements/components/message\#message)

The `Message` component displays a chat interface message from either a user or an AI. It includes an avatar, a name, and a message content.

Hello, how are you?

![](https://github.com/haydenbleasel.png)

## [Installation](https://ai-sdk.dev/elements/components/message\#installation)

ai-elementsshadcnManual

```
npx ai-elements@latest add message
```

## [Usage](https://ai-sdk.dev/elements/components/message\#usage)

```code-block_code__yIKW2

import { Message, MessageContent } from '@/components/ai-elements/message';
```

```code-block_code__yIKW2

<Message from="user">

  <MessageContent>Hi there!</MessageContent>

</Message>
```

## [Usage with AI SDK](https://ai-sdk.dev/elements/components/message\#usage-with-ai-sdk)

Render messages in a list with `useChat`.

Add the following component to your frontend:

app/page.tsx

```code-block_code__yIKW2

'use client';

import { Message, MessageContent } from '@/components/ai-elements/message';

import { useChat } from '@ai-sdk/react';

import { Response } from '@/components/ai-elements/response';

const MessageDemo = () => {

  const { messages } = useChat();

  return (

    <div className="max-w-4xl mx-auto p-6 relative size-full rounded-lg border h-[600px]">

      <div className="flex flex-col h-full">

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

      </div>

    </div>

  );

};

export default MessageDemo;
```

## [Features](https://ai-sdk.dev/elements/components/message\#features)

- Displays messages from both the user and AI assistant with distinct styling.
- Includes avatar images for message senders with fallback initials.
- Shows the sender's name through avatar fallbacks.
- Automatically aligns user and assistant messages on opposite sides.
- Uses different background colors for user and assistant messages.
- Accepts any React node as message content.

## [Notes](https://ai-sdk.dev/elements/components/message\#notes)

Always render the `AIMessageContent` first, then the `AIMessageAvatar`. The `AIMessage` component is a wrapper that determines the alignment of the message.

## [Examples](https://ai-sdk.dev/elements/components/message\#examples)

### [Render Markdown](https://ai-sdk.dev/elements/components/message\#render-markdown)

We can use the [`Response`](https://ai-sdk.dev/elements/components/response) component to render markdown content.

What is the weather in Tokyo?

![](https://github.com/haydenbleasel.png)

To get the weather in Tokyo using an API call, you can use the

![](https://github.com/openai.png)

## [Props](https://ai-sdk.dev/elements/components/message\#props)

### [`<Message />`](https://ai-sdk.dev/elements/components/message\#message-)

### from:

UIMessage\["role"\]

The role of the message sender ("user", "assistant", or "system").

### \[...props\]?:

React.HTMLAttributes<HTMLDivElement>

Any other props are spread to the root div.

### [`<MessageContent />`](https://ai-sdk.dev/elements/components/message\#messagecontent-)

### \[...props\]?:

React.HTMLAttributes<HTMLDivElement>

Any other props are spread to the content div.

### [`<MessageAvatar />`](https://ai-sdk.dev/elements/components/message\#messageavatar-)

### src:

string

The URL of the avatar image.

### name?:

string

The name to use for the avatar fallback (first 2 letters shown if image is missing).

### \[...props\]?:

React.ComponentProps<typeof Avatar>

Any other props are spread to the underlying Avatar component.

On this page

[Message](https://ai-sdk.dev/elements/components/message#message)

[Installation](https://ai-sdk.dev/elements/components/message#installation)

[Usage](https://ai-sdk.dev/elements/components/message#usage)

[Usage with AI SDK](https://ai-sdk.dev/elements/components/message#usage-with-ai-sdk)

[Features](https://ai-sdk.dev/elements/components/message#features)

[Notes](https://ai-sdk.dev/elements/components/message#notes)

[Examples](https://ai-sdk.dev/elements/components/message#examples)

[Render Markdown](https://ai-sdk.dev/elements/components/message#render-markdown)

[Props](https://ai-sdk.dev/elements/components/message#props)

[<Message />](https://ai-sdk.dev/elements/components/message#message-)

[<MessageContent />](https://ai-sdk.dev/elements/components/message#messagecontent-)

[<MessageAvatar />](https://ai-sdk.dev/elements/components/message#messageavatar-)

Elevate your AI applications with Vercel.

Trusted by OpenAI, Replicate, Suno, Pinecone, and more.

Vercel provides tools and infrastructure to deploy AI apps and features at scale.

[Talk to an expert](https://vercel.com/contact/sales?utm_source=ai_sdk&utm_medium=web&utm_campaign=contact_sales_cta&utm_content=talk_to_an_expert_sdk_docs)