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

# [v0 clone](https://ai-sdk.dev/elements/examples/v0\#v0-clone)

An example of how to use the AI Elements to build a v0 clone.

## [Tutorial](https://ai-sdk.dev/elements/examples/v0\#tutorial)

Let's walk through how to build a v0 clone using AI Elements and the [v0 Platform API](https://v0.dev/docs/api/platform).

### [Setup](https://ai-sdk.dev/elements/examples/v0\#setup)

First, set up a new Next.js repo and cd into it by running the following command (make sure you choose to use Tailwind the project setup):

Terminal

```code-block_code__yIKW2

npx create-next-app@latest v0-clone && cd v0-clone
```

Run the following command to install shadcn/ui and AI Elements.

Terminal

```code-block_code__yIKW2

npx shadcn@latest init && npx ai-elements@latest
```

Now, install the v0 sdk:

pnpm

npm

yarn

```
pnpm add v0-sdk
```

In order to use the providers, let's configure a v0 API key. Create a `.env.local` in your root directory and navigate to your [v0 account settings](https://v0.dev/chat/settings/keys) to create a token, then paste it in your `.env.local` as `V0_API_KEY`.

We're now ready to start building our app!

### [Client](https://ai-sdk.dev/elements/examples/v0\#client)

In your `app/page.tsx`, replace the code with the file below.

Here, we use `Conversation` to wrap the conversation code, and the `WebPreview` component to render the URL returned from the v0 API.

app/page.tsx

```code-block_code__yIKW2

'use client';

import { useState } from 'react';

import {

  PromptInput,

  PromptInputSubmit,

  PromptInputTextarea,

} from '@/components/ai-elements/prompt-input';

import { Message, MessageContent } from '@/components/ai-elements/message';

import {

  Conversation,

  ConversationContent,

} from '@/components/ai-elements/conversation';

import {

  WebPreview,

  WebPreviewNavigation,

  WebPreviewUrl,

  WebPreviewBody,

} from '@/components/ai-elements/web-preview';

import { Loader } from '@/components/ai-elements/loader';

import { Suggestions, Suggestion } from '@/components/ai-elements/suggestion';

interface Chat {

  id: string;

  demo: string;

}

export default function Home() {

  const [message, setMessage] = useState('');

  const [currentChat, setCurrentChat] = useState<Chat | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  const [chatHistory, setChatHistory] = useState<

    Array<{

      type: 'user' | 'assistant';

      content: string;

    }>

  >([]);

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {

    e.preventDefault();

    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();

    setMessage('');

    setIsLoading(true);

    setChatHistory((prev) => [...prev, { type: 'user', content: userMessage }]);

    try {

      const response = await fetch('/api/chat', {

        method: 'POST',

        headers: {

          'Content-Type': 'application/json',

        },

        body: JSON.stringify({

          message: userMessage,

          chatId: currentChat?.id,

        }),

      });

      if (!response.ok) {

        throw new Error('Failed to create chat');

      }

      const chat: Chat = await response.json();

      setCurrentChat(chat);

      setChatHistory((prev) => [\
\
        ...prev,\
\
        {\
\
          type: 'assistant',\
\
          content: 'Generated new app preview. Check the preview panel!',\
\
        },\
\
      ]);

    } catch (error) {

      console.error('Error:', error);

      setChatHistory((prev) => [\
\
        ...prev,\
\
        {\
\
          type: 'assistant',\
\
          content:\
\
            'Sorry, there was an error creating your app. Please try again.',\
\
        },\
\
      ]);

    } finally {

      setIsLoading(false);

    }

  };

  return (

    <div className="h-screen flex">

      {/* Chat Panel */}

      <div className="w-1/2 flex flex-col border-r">

        {/* Header */}

        <div className="border-b p-3 h-14 flex items-center justify-between">

          <h1 className="text-lg font-semibold">v0 Clone</h1>

        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {chatHistory.length === 0 ? (

            <div className="text-center font-semibold mt-8">

              <p className="text-3xl mt-4">What can we build together?</p>

            </div>

          ) : (

            <>

              <Conversation>

                <ConversationContent>

                  {chatHistory.map((msg, index) => (

                    <Message from={msg.type} key={index}>

                      <MessageContent>{msg.content}</MessageContent>

                    </Message>

                  ))}

                </ConversationContent>

              </Conversation>

              {isLoading && (

                <Message from="assistant">

                  <MessageContent>

                    <div className="flex items-center gap-2">

                      <Loader />

                      Creating your app...

                    </div>

                  </MessageContent>

                </Message>

              )}

            </>

          )}

        </div>

        {/* Input */}

        <div className="border-t p-4">

          {!currentChat && (

            <Suggestions>

              <Suggestion

                onClick={() =>

                  setMessage('Create a responsive navbar with Tailwind CSS')

                }

                suggestion="Create a responsive navbar with Tailwind CSS"

              />

              <Suggestion

                onClick={() => setMessage('Build a todo app with React')}

                suggestion="Build a todo app with React"

              />

              <Suggestion

                onClick={() =>

                  setMessage('Make a landing page for a coffee shop')

                }

                suggestion="Make a landing page for a coffee shop"

              />

            </Suggestions>

          )}

          <div className="flex gap-2">

            <PromptInput

              onSubmit={handleSendMessage}

              className="mt-4 w-full max-w-2xl mx-auto relative"

            >

              <PromptInputTextarea

                onChange={(e) => setMessage(e.target.value)}

                value={message}

                className="pr-12 min-h-[60px]"

              />

              <PromptInputSubmit

                className="absolute bottom-1 right-1"

                disabled={!message}

                status={isLoading ? 'streaming' : 'ready'}

              />

            </PromptInput>

          </div>

        </div>

      </div>

      {/* Preview Panel */}

      <div className="w-1/2 flex flex-col">

        <WebPreview>

          <WebPreviewNavigation>

            <WebPreviewUrl

              readOnly

              placeholder="Your app here..."

              value={currentChat?.demo}

            />

          </WebPreviewNavigation>

          <WebPreviewBody src={currentChat?.demo} />

        </WebPreview>

      </div>

    </div>

  );

}
```

In this case, we'll also edit the base component `components/ai-elements/web-preview.tsx` in order to best match with our theme.

components/ai-elements/web-preview.tsx

```code-block_code__yIKW2

return (

    <WebPreviewContext.Provider value={contextValue}>

      <div

        className={cn(

          'flex size-full flex-col bg-card', // remove rounded-lg border

          className,

        )}

        {...props}

      >

        {children}

      </div>

    </WebPreviewContext.Provider>

  );

};

export type WebPreviewNavigationProps = ComponentProps<'div'>;

export const WebPreviewNavigation = ({

  className,

  children,

  ...props

}: WebPreviewNavigationProps) => (

  <div

    className={cn('flex items-center gap-1 border-b p-2 h-14', className)} // add h-14

    {...props}

  >

    {children}

  </div>

);
```

### [Server](https://ai-sdk.dev/elements/examples/v0\#server)

Create a new route handler `app/api/chat/route.ts` and paste in the following code. We use the v0 SDK to manage chats.

app/api/chat/route.ts

```code-block_code__yIKW2

import { NextRequest, NextResponse } from 'next/server';

import { v0 } from 'v0-sdk';

export async function POST(request: NextRequest) {

  try {

    const { message, chatId } = await request.json();

    if (!message) {

      return NextResponse.json(

        { error: 'Message is required' },

        { status: 400 },

      );

    }

    let chat;

    if (chatId) {

      // continue existing chat

      chat = await v0.chats.sendMessage({

        chatId: chatId,

        message,

      });

    } else {

      // create new chat

      chat = await v0.chats.create({

        message,

      });

    }

    return NextResponse.json({

      id: chat.id,

      demo: chat.demo,

    });

  } catch (error) {

    console.error('V0 API Error:', error);

    return NextResponse.json(

      { error: 'Failed to process request' },

      { status: 500 },

    );

  }

}
```

To start your server, run `pnpm dev`, navigate to `localhost:3000` and try building an app!

You now have a working v0 clone you can build off of! Feel free to explore the [v0 Platform API](https://v0.dev/docs/api/platform) and components like [`Reasoning`](https://ai-sdk.dev/elements/components/reasoning) and [`Task`](https://ai-sdk.dev/elements/components/task) to extend your app, or view the other examples.

On this page

[v0 clone](https://ai-sdk.dev/elements/examples/v0#v0-clone)

[Tutorial](https://ai-sdk.dev/elements/examples/v0#tutorial)

[Setup](https://ai-sdk.dev/elements/examples/v0#setup)

[Client](https://ai-sdk.dev/elements/examples/v0#client)

[Server](https://ai-sdk.dev/elements/examples/v0#server)

Elevate your AI applications with Vercel.

Trusted by OpenAI, Replicate, Suno, Pinecone, and more.

Vercel provides tools and infrastructure to deploy AI apps and features at scale.

[Talk to an expert](https://vercel.com/contact/sales?utm_source=ai_sdk&utm_medium=web&utm_campaign=contact_sales_cta&utm_content=talk_to_an_expert_sdk_docs)