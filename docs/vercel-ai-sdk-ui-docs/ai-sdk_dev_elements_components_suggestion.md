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

# [Suggestion](https://ai-sdk.dev/elements/components/suggestion\#suggestion)

The `Suggestion` component displays a horizontal row of clickable suggestions for user interaction.

What are the latest trends in AI?How does machine learning work?Explain quantum computingBest practices for React developmentTell me about TypeScript benefitsHow to optimize database queries?What is the difference between SQL and NoSQL?Explain cloud computing basics

## [Installation](https://ai-sdk.dev/elements/components/suggestion\#installation)

ai-elementsshadcnManual

```
npx ai-elements@latest add suggestion
```

## [Usage](https://ai-sdk.dev/elements/components/suggestion\#usage)

```code-block_code__yIKW2

import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion';
```

```code-block_code__yIKW2

<Suggestions>

  <Suggestion suggestion="What are the latest trends in AI?" />

</Suggestions>
```

## [Usage with AI SDK](https://ai-sdk.dev/elements/components/suggestion\#usage-with-ai-sdk)

Build a simple input with suggestions users can click to send a message to the LLM.

Add the following component to your frontend:

app/page.tsx

```code-block_code__yIKW2

'use client';

import {

  Input,

  PromptInputTextarea,

  PromptInputSubmit,

} from '@/components/ai-elements/prompt-input';

import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion';

import { useState } from 'react';

import { useChat } from '@ai-sdk/react';

const suggestions = [\
\
  'Can you explain how to play tennis?',\
\
  'What is the weather in Tokyo?',\
\
  'How do I make a really good fish taco?',\
\
];

const SuggestionDemo = () => {

  const [input, setInput] = useState('');

  const { sendMessage, status } = useChat();

  const handleSubmit = (e: React.FormEvent) => {

    e.preventDefault();

    if (input.trim()) {

      sendMessage({ text: input });

      setInput('');

    }

  };

  const handleSuggestionClick = (suggestion: string) => {

    sendMessage({ text: suggestion });

  };

  return (

    <div className="max-w-4xl mx-auto p-6 relative size-full rounded-lg border h-[600px]">

      <div className="flex flex-col h-full">

        <div className="flex flex-col gap-4">

          <Suggestions>

            {suggestions.map((suggestion) => (

              <Suggestion

                key={suggestion}

                onClick={handleSuggestionClick}

                suggestion={suggestion}

              />

            ))}

          </Suggestions>

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

    </div>

  );

};

export default SuggestionDemo;
```

## [Features](https://ai-sdk.dev/elements/components/suggestion\#features)

- Horizontal row of clickable suggestion buttons
- Customizable styling with variant and size options
- Flexible layout that wraps suggestions on smaller screens
- onClick callback that emits the selected suggestion string
- Support for both individual suggestions and suggestion lists
- Clean, modern styling with hover effects
- Responsive design with mobile-friendly touch targets
- TypeScript support with proper type definitions

## [Examples](https://ai-sdk.dev/elements/components/suggestion\#examples)

### [Usage with AI Input](https://ai-sdk.dev/elements/components/suggestion\#usage-with-ai-input)

What are the latest trends in AI?How does machine learning work?Explain quantum computingBest practices for React developmentTell me about TypeScript benefitsHow to optimize database queries?What is the difference between SQL and NoSQL?Explain cloud computing basics

SearchGPT-4GPT-4GPT-3.5 TurboClaude 2Claude InstantPaLM 2Llama 2 70BLlama 2 13BCommandMistral 7B

## [Props](https://ai-sdk.dev/elements/components/suggestion\#props)

### [`<Suggestions />`](https://ai-sdk.dev/elements/components/suggestion\#suggestions-)

### \[...props\]?:

React.ComponentProps<typeof ScrollArea>

Any other props are spread to the underlying ScrollArea component.

### [`<Suggestion />`](https://ai-sdk.dev/elements/components/suggestion\#suggestion-)

### suggestion:

string

The suggestion string to display and emit on click.

### onClick?:

(suggestion: string) => void

Callback fired when the suggestion is clicked.

### \[...props\]?:

Omit<React.ComponentProps<typeof Button>, "onClick">

Any other props are spread to the underlying shadcn/ui Button component.

On this page

[Suggestion](https://ai-sdk.dev/elements/components/suggestion#suggestion)

[Installation](https://ai-sdk.dev/elements/components/suggestion#installation)

[Usage](https://ai-sdk.dev/elements/components/suggestion#usage)

[Usage with AI SDK](https://ai-sdk.dev/elements/components/suggestion#usage-with-ai-sdk)

[Features](https://ai-sdk.dev/elements/components/suggestion#features)

[Examples](https://ai-sdk.dev/elements/components/suggestion#examples)

[Usage with AI Input](https://ai-sdk.dev/elements/components/suggestion#usage-with-ai-input)

[Props](https://ai-sdk.dev/elements/components/suggestion#props)

[<Suggestions />](https://ai-sdk.dev/elements/components/suggestion#suggestions-)

[<Suggestion />](https://ai-sdk.dev/elements/components/suggestion#suggestion-)

Elevate your AI applications with Vercel.

Trusted by OpenAI, Replicate, Suno, Pinecone, and more.

Vercel provides tools and infrastructure to deploy AI apps and features at scale.

[Talk to an expert](https://vercel.com/contact/sales?utm_source=ai_sdk&utm_medium=web&utm_campaign=contact_sales_cta&utm_content=talk_to_an_expert_sdk_docs)