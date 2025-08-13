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

# [Chatbot](https://ai-sdk.dev/elements/examples/chatbot\#chatbot)

An example of how to use the AI Elements to build a chatbot.

Can you explain how to use React hooks effectively?

![](https://github.com/haydenbleasel.png)

Used 2 sources

# React Hooks Best Practices

React hooks are a powerful feature that let you use state and other React features without writing classes. Here are some tips for using them effectively:

## Rules of Hooks

1. Only call hooks at the top level of your component or custom hooks
2. Don't call hooks inside loops, conditions, or nested functions

## Common Hooks

- useState: For local component state
- useEffect: For side effects like data fetching
- useContext: For consuming context
- useReducer: For complex state logic
- useCallback: For memoizing functions
- useMemo: For memoizing values

## Example of useState and useEffect

```font-mono text-sm
function ProfilePage({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // This runs after render and when userId changes
    fetchUser(userId).then(userData => {
      setUser(userData);
    });
  }, [userId]);

  return user ? <Profile user={user} /> : <Loading />;
}

```

```font-mono text-sm
function ProfilePage({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // This runs after render and when userId changes
    fetchUser(userId).then(userData => {
      setUser(userData);
    });
  }, [userId]);

  return user ? <Profile user={user} /> : <Loading />;
}

```

Would you like me to explain any specific hook in more detail?

![](https://github.com/openai.png)

Yes, could you explain useCallback and useMemo in more detail? When should I use one over the other?

![](https://github.com/haydenbleasel.png)

I'm particularly interested in understanding the performance implications of useCallback and useMemo. Could you break down when each is most appropriate?

![](https://github.com/haydenbleasel.png)

Thanks for the overview! Could you dive deeper into the specific use cases where useCallback and useMemo make the biggest difference in React applications?

![](https://github.com/haydenbleasel.png)

1 of 3

Thought for 10 seconds

## useCallback vs useMemo

Both hooks help with performance optimization, but they serve different purposes:

### useCallback

`useCallback` memoizes functions to prevent unnecessary re-renders of child components that receive functions as props.

```font-mono text-sm
// Without useCallback - a new function is created on every render
const handleClick = () => {
  console.log(count);
};

// With useCallback - the function is only recreated when dependencies change
const handleClick = useCallback(() => {
  console.log(count);
}, [count]);

```

```font-mono text-sm
// Without useCallback - a new function is created on every render
const handleClick = () => {
  console.log(count);
};

// With useCallback - the function is only recreated when dependencies change
const handleClick = useCallback(() => {
  console.log(count);
}, [count]);

```

### useMemo

`useMemo` memoizes values to avoid expensive recalculations on every render.

```font-mono text-sm
// Without useMemo - expensive calculation runs on every render
const sortedList = expensiveSort(items);

// With useMemo - calculation only runs when items change
const sortedList = useMemo(() => expensiveSort(items), [items]);

```

```font-mono text-sm
// Without useMemo - expensive calculation runs on every render
const sortedList = expensiveSort(items);

// With useMemo - calculation only runs when items change
const sortedList = useMemo(() => expensiveSort(items), [items]);

```

### When to use which?

- Use useCallback when:
  - Passing callbacks to optimized child components that rely on reference equality
  - Working with event handlers that you pass to child components
- Use useMemo when:
  - You have computationally expensive calculations
  - You want to avoid recreating objects that are used as dependencies for other hooks

### Performance Note

Don't overuse these hooks! They come with their own overhead. Only use them when you have identified a genuine performance issue.

![](https://github.com/openai.png)

What are the latest trends in AI?How does machine learning work?Explain quantum computingBest practices for React developmentTell me about TypeScript benefitsHow to optimize database queries?What is the difference between SQL and NoSQL?Explain cloud computing basics

Add attachmentMicrophoneSearchGPT-4GPT-4GPT-3.5 TurboClaude 2Claude InstantPaLM 2Llama 2 70BLlama 2 13BCommandMistral 7B

## [Tutorial](https://ai-sdk.dev/elements/examples/chatbot\#tutorial)

Let's walk through how to build a chatbot using AI Elements and AI SDK. Our example will include reasoning, web search with citations, and a model picker.

### [Setup](https://ai-sdk.dev/elements/examples/chatbot\#setup)

First, set up a new Next.js repo and cd into it by running the following command (make sure you choose to use Tailwind the project setup):

Terminal

```code-block_code__yIKW2

npx create-next-app@latest ai-chatbot && cd ai-chatbot
```

Run the following command to install AI Elements. This will also set up shadcn/ui if you haven't already configured it:

Terminal

```code-block_code__yIKW2

npx ai-elements@latest
```

Now, install the AI SDK dependencies:

pnpm

npm

yarn

```
pnpm add ai @ai-sdk/react zod
```

In order to use the providers, let's configure an AI Gateway API key. Create a `.env.local` in your root directory and navigate [here](https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%2Fapi-keys&title=Get%20your%20AI%20Gateway%20key) to create a token, then paste it in your `.env.local`.

We're now ready to start building our app!

### [Client](https://ai-sdk.dev/elements/examples/chatbot\#client)

In your `app/page.tsx`, replace the code with the file below.

Here, we use the `Input` component in order to build an input component with a model picker, with a few models from the AI Gateway [model list](https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%2Fmodel-list) already configured.

The whole chat lives in a `Conversation`. We switch on `message.parts` and render the respective part within `Message`, `Reasoning`, and `Sources`. We also use `status` from `useChat` to stream reasoning tokens, as well as render `Loader`.

```code-block_code__yIKW2

'use client';

import {

  Conversation,

  ConversationContent,

  ConversationScrollButton,

} from '@/components/ai-elements/conversation';

import { Message, MessageContent } from '@/components/ai-elements/message';

import {

  PromptInput,

  PromptInputButton,

  PromptInputModelSelect,

  PromptInputModelSelectContent,

  PromptInputModelSelectItem,

  PromptInputModelSelectTrigger,

  PromptInputModelSelectValue,

  PromptInputSubmit,

  PromptInputTextarea,

  PromptInputToolbar,

  PromptInputTools,

} from '@/components/ai-elements/prompt-input';

import { useState } from 'react';

import { useChat } from '@ai-sdk/react';

import { Response } from '@/components/ai-elements/response';

import { GlobeIcon } from 'lucide-react';

import {

  Source,

  Sources,

  SourcesContent,

  SourcesTrigger,

} from '@/components/ai-elements/source';

import {

  Reasoning,

  ReasoningContent,

  ReasoningTrigger,

} from '@/components/ai-elements/reasoning';

import { Loader } from '@/components/ai-elements/loader';

const models = [\
\
  {\
\
    name: 'GPT 4o',\
\
    value: 'openai/gpt-4o',\
\
  },\
\
  {\
\
    name: 'Deepseek R1',\
\
    value: 'deepseek/deepseek-r1',\
\
  },\
\
];

const ChatBotDemo = () => {

  const [input, setInput] = useState('');

  const [model, setModel] = useState<string>(models[0].value);

  const [webSearch, setWebSearch] = useState(false);

  const { messages, sendMessage, status } = useChat();

  const handleSubmit = (e: React.FormEvent) => {

    e.preventDefault();

    if (input.trim()) {

      sendMessage(

        { text: input },

        {

          body: {

            model: model,

            webSearch: webSearch,

          },

        },

      );

      setInput('');

    }

  };

  return (

    <div className="max-w-4xl mx-auto p-6 relative size-full h-screen">

      <div className="flex flex-col h-full">

        <Conversation className="h-full">

          <ConversationContent>

            {messages.map((message) => (

              <div key={message.id}>

                {message.role === 'assistant' && (

                  <Sources>

                    {message.parts.map((part, i) => {

                      switch (part.type) {

                        case 'source-url':

                          return (

                            <>

                              <SourcesTrigger

                                count={

                                  message.parts.filter(

                                    (part) => part.type === 'source-url',

                                  ).length

                                }

                              />

                              <SourcesContent key={`${message.id}-${i}`}>

                                <Source

                                  key={`${message.id}-${i}`}

                                  href={part.url}

                                  title={part.url}

                                />

                              </SourcesContent>

                            </>

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

                        default:

                          return null;

                      }

                    })}

                  </MessageContent>

                </Message>

              </div>

            ))}

            {status === 'submitted' && <Loader />}

          </ConversationContent>

          <ConversationScrollButton />

        </Conversation>

        <PromptInput onSubmit={handleSubmit} className="mt-4">

          <PromptInputTextarea

            onChange={(e) => setInput(e.target.value)}

            value={input}

          />

          <PromptInputToolbar>

            <PromptInputTools>

              <PromptInputButton

                variant={webSearch ? 'default' : 'ghost'}

                onClick={() => setWebSearch(!webSearch)}

              >

                <GlobeIcon size={16} />

                <span>Search</span>

              </PromptInputButton>

              <PromptInputModelSelect

                onValueChange={(value) => {

                  setModel(value);

                }}

                value={model}

              >

                <PromptInputModelSelectTrigger>

                  <PromptInputModelSelectValue />

                </PromptInputModelSelectTrigger>

                <PromptInputModelSelectContent>

                  {models.map((model) => (

                    <PromptInputModelSelectItem key={model.value} value={model.value}>

                      {model.name}

                    </PromptInputModelSelectItem>

                  ))}

                </PromptInputModelSelectContent>

              </PromptInputModelSelect>

            </PromptInputTools>

            <PromptInputSubmit disabled={!input} status={status} />

          </PromptInputToolbar>

        </PromptInput>

      </div>

    </div>

  );

};

export default ChatBotDemo;
```

### [Server](https://ai-sdk.dev/elements/examples/chatbot\#server)

Create a new route handler `app/api/chat/route.ts` and paste in the following code. We're using `perplexity/sonar` for web search because by default the model returns search results. We also pass `sendSources` and `sendReasoning` to `toUIMessageStreamResponse` in order to receive as parts on the frontend.

app/api/chat/route.ts

```code-block_code__yIKW2

import { streamText, UIMessage, convertToModelMessages } from 'ai';

// Allow streaming responses up to 30 seconds

export const maxDuration = 30;

export async function POST(req: Request) {

  const {

    messages,

    model,

    webSearch,

  }: { messages: UIMessage[]; model: string; webSearch: boolean } =

    await req.json();

  const result = streamText({

    model: webSearch ? 'perplexity/sonar' : model,

    messages: convertToModelMessages(messages),

    system:

      'You are a helpful assistant that can answer questions and help with tasks',

  });

  // send sources and reasoning back to the client

  return result.toUIMessageStreamResponse({

    sendSources: true,

    sendReasoning: true,

  });

}
```

You now have a working chatbot app you can build off of! Feel free to explore other components like [`Tool`](https://ai-sdk.dev/elements/components/tool) or [`Task`](https://ai-sdk.dev/elements/components/task) to extend your app, or view the other examples.

On this page

[Chatbot](https://ai-sdk.dev/elements/examples/chatbot#chatbot)

[Tutorial](https://ai-sdk.dev/elements/examples/chatbot#tutorial)

[Setup](https://ai-sdk.dev/elements/examples/chatbot#setup)

[Client](https://ai-sdk.dev/elements/examples/chatbot#client)

[Server](https://ai-sdk.dev/elements/examples/chatbot#server)

Elevate your AI applications with Vercel.

Trusted by OpenAI, Replicate, Suno, Pinecone, and more.

Vercel provides tools and infrastructure to deploy AI apps and features at scale.

[Talk to an expert](https://vercel.com/contact/sales?utm_source=ai_sdk&utm_medium=web&utm_campaign=contact_sales_cta&utm_content=talk_to_an_expert_sdk_docs)