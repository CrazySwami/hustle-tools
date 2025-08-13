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

# [Sources](https://ai-sdk.dev/elements/components/sources\#sources)

The `Sources` component allows a user to view the sources or citations used to generate a response.

Used 3 sources

## [Installation](https://ai-sdk.dev/elements/components/sources\#installation)

ai-elementsshadcnManual

```
npx ai-elements@latest add sources
```

## [Usage](https://ai-sdk.dev/elements/components/sources\#usage)

```code-block_code__yIKW2

import {

  Source,

  Sources,

  SourcesContent,

  SourcesTrigger,

} from '@/components/ai-elements/source';
```

```code-block_code__yIKW2

<Sources>

  <SourcesTrigger count={1} />

  <SourcesContent>

    <Source href="https://ai-sdk.dev" title="AI SDK" />

  </SourcesContent>

</Sources>
```

## [Usage with AI SDK](https://ai-sdk.dev/elements/components/sources\#usage-with-ai-sdk)

Build a simple web search agent with Perplexity Sonar.

Add the following component to your frontend:

app/page.tsx

```code-block_code__yIKW2

'use client';

import { useChat } from '@ai-sdk/react';

import {

  Source,

  Sources,

  SourcesContent,

  SourcesTrigger,

} from '@/components/ai-elements/source';

import {

  Input,

  PromptInputTextarea,

  PromptInputSubmit,

} from '@/components/ai-elements/prompt-input';

import {

  Conversation,

  ConversationContent,

  ConversationScrollButton,

} from '@/components/ai-elements/conversation';

import { Message, MessageContent } from '@/components/ai-elements/message';

import { Response } from '@/components/ai-elements/response';

import { useState } from 'react';

import { DefaultChatTransport } from 'ai';

const SourceDemo = () => {

  const [input, setInput] = useState('');

  const { messages, sendMessage, status } = useChat({

    transport: new DefaultChatTransport({

      api: '/api/sources',

    }),

  });

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

        <div className="flex-1 overflow-auto mb-4">

          <Conversation>

            <ConversationContent>

              {messages.map((message) => (

                <div key={message.id}>

                  {message.role === 'assistant' && (

                    <Sources>

                      <SourcesTrigger

                        count={

                          message.parts.filter(

                            (part) => part.type === 'source-url',

                          ).length

                        }

                      />

                      {message.parts.map((part, i) => {

                        switch (part.type) {

                          case 'source-url':

                            return (

                              <SourcesContent key={`${message.id}-${i}`}>

                                <Source

                                  key={`${message.id}-${i}`}

                                  href={part.url}

                                  title={part.url}

                                />

                              </SourcesContent>

                            );

                        }

                      })}

                    </Sources>

                  )}

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

                          default:

                            return null;

                        }

                      })}

                    </MessageContent>

                  </Message>

                </div>

              ))}

            </ConversationContent>

            <ConversationScrollButton />

          </Conversation>

        </div>

        <Input

          onSubmit={handleSubmit}

          className="mt-4 w-full max-w-2xl mx-auto relative"

        >

          <PromptInputTextarea

            value={input}

            placeholder="Ask a question and search the..."

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

export default SourceDemo;
```

Add the following route to your backend:

api/chat/route.ts

```code-block_code__yIKW2

import { convertToModelMessages, streamText, UIMessage } from 'ai';

import { perplexity } from '@ai-sdk/perplexity';

// Allow streaming responses up to 30 seconds

export const maxDuration = 30;

export async function POST(req: Request) {

  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({

    model: 'perplexity/sonar',

    system:

      'You are a helpful assistant. Keep your responses short (< 100 words) unless you are asked for more details. ALWAYS USE SEARCH.',

    messages: convertToModelMessages(messages),

  });

  return result.toUIMessageStreamResponse({

    sendSources: true,

  });

}
```

## [Features](https://ai-sdk.dev/elements/components/sources\#features)

- Collapsible component that allows a user to view the sources or citations used to generate a response
- Customizable trigger and content components
- Support for custom sources or citations
- Responsive design with mobile-friendly controls
- Clean, modern styling with customizable themes

## [Examples](https://ai-sdk.dev/elements/components/sources\#examples)

### [Custom rendering](https://ai-sdk.dev/elements/components/sources\#custom-rendering)

Using 3 citations

## [Props](https://ai-sdk.dev/elements/components/sources\#props)

### [`<Sources />`](https://ai-sdk.dev/elements/components/sources\#sources-)

### \[...props\]?:

React.HTMLAttributes<HTMLDivElement>

Any other props are spread to the root div.

### [`<SourcesTrigger />`](https://ai-sdk.dev/elements/components/sources\#sourcestrigger-)

### count?:

number

The number of sources to display in the trigger.

### \[...props\]?:

React.ButtonHTMLAttributes<HTMLButtonElement>

Any other props are spread to the trigger button.

### [`<SourcesContent />`](https://ai-sdk.dev/elements/components/sources\#sourcescontent-)

### \[...props\]?:

React.HTMLAttributes<HTMLDivElement>

Any other props are spread to the content container.

### [`<Source />`](https://ai-sdk.dev/elements/components/sources\#source-)

### \[...props\]?:

React.AnchorHTMLAttributes<HTMLAnchorElement>

Any other props are spread to the anchor element.

On this page

[Sources](https://ai-sdk.dev/elements/components/sources#sources)

[Installation](https://ai-sdk.dev/elements/components/sources#installation)

[Usage](https://ai-sdk.dev/elements/components/sources#usage)

[Usage with AI SDK](https://ai-sdk.dev/elements/components/sources#usage-with-ai-sdk)

[Features](https://ai-sdk.dev/elements/components/sources#features)

[Examples](https://ai-sdk.dev/elements/components/sources#examples)

[Custom rendering](https://ai-sdk.dev/elements/components/sources#custom-rendering)

[Props](https://ai-sdk.dev/elements/components/sources#props)

[<Sources />](https://ai-sdk.dev/elements/components/sources#sources-)

[<SourcesTrigger />](https://ai-sdk.dev/elements/components/sources#sourcestrigger-)

[<SourcesContent />](https://ai-sdk.dev/elements/components/sources#sourcescontent-)

[<Source />](https://ai-sdk.dev/elements/components/sources#source-)

Elevate your AI applications with Vercel.

Trusted by OpenAI, Replicate, Suno, Pinecone, and more.

Vercel provides tools and infrastructure to deploy AI apps and features at scale.

[Talk to an expert](https://vercel.com/contact/sales?utm_source=ai_sdk&utm_medium=web&utm_campaign=contact_sales_cta&utm_content=talk_to_an_expert_sdk_docs)