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

# [Code Block](https://ai-sdk.dev/elements/components/code-block\#code-block)

The `CodeBlock` component provides syntax highlighting, line numbers, and copy to clipboard functionality for code blocks.

```font-mono text-sm
function MyComponent(props) {
  return (
    <div>
      <h1>Hello, {props.name}!</h1>
      <p>This is an example React component.</p>
    </div>
  );
}
```

```font-mono text-sm
function MyComponent(props) {
  return (
    <div>
      <h1>Hello, {props.name}!</h1>
      <p>This is an example React component.</p>
    </div>
  );
}
```

## [Installation](https://ai-sdk.dev/elements/components/code-block\#installation)

ai-elementsshadcnManual

```
npx ai-elements@latest add code-block
```

## [Usage](https://ai-sdk.dev/elements/components/code-block\#usage)

```code-block_code__yIKW2

import { CodeBlock, CodeBlockCopyButton } from '@/components/ai-elements/code-block';
```

```code-block_code__yIKW2

<CodeBlock data={"console.log('hello world')"} language="jsx">

  <CodeBlockCopyButton

    onCopy={() => console.log('Copied code to clipboard')}

    onError={() => console.error('Failed to copy code to clipboard')}

  />

</CodeBlock>
```

## [Usage with AI SDK](https://ai-sdk.dev/elements/components/code-block\#usage-with-ai-sdk)

`CodeBlock` will automatically render within
[`Response`](https://ai-sdk.dev/elements/components/response).

Build a simple code generation tool using the [`experimental_useObject`](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-object) hook.

Add the following component to your frontend:

app/page.tsx

```code-block_code__yIKW2

'use client';

import { experimental_useObject as useObject } from '@ai-sdk/react';

import { codeBlockSchema } from '@/app/api/codegen/route';

import {

  Input,

  PromptInputTextarea,

  PromptInputSubmit,

} from '@/components/ai-elements/prompt-input';

import {

  CodeBlock,

  CodeBlockCopyButton,

} from '@/components/ai-elements/code-block';

import { useState } from 'react';

export default function Page() {

  const [input, setInput] = useState('');

  const { object, submit, isLoading } = useObject({

    api: '/api/codegen',

    schema: codeBlockSchema,

  });

  const handleSubmit = (e: React.FormEvent) => {

    e.preventDefault();

    if (input.trim()) {

      submit(input);

    }

  };

  return (

    <div className="max-w-4xl mx-auto p-6 relative size-full rounded-lg border h-[600px]">

      <div className="flex flex-col h-full">

        <div className="flex-1 overflow-auto mb-4">

          {object?.code && object?.language && (

            <CodeBlock

              code={object.code}

              language={object.language}

              showLineNumbers={true}

            >

              <CodeBlockCopyButton />

            </CodeBlock>

          )}

        </div>

        <Input

          onSubmit={handleSubmit}

          className="mt-4 w-full max-w-2xl mx-auto relative"

        >

          <PromptInputTextarea

            value={input}

            placeholder="Generate a React todolist component"

            onChange={(e) => setInput(e.currentTarget.value)}

            className="pr-12"

          />

          <PromptInputSubmit

            status={isLoading ? 'streaming' : 'ready'}

            disabled={!input.trim()}

            className="absolute bottom-1 right-1"

          />

        </Input>

      </div>

    </div>

  );

}
```

Add the following route to your backend:

api/codegen/route.ts

```code-block_code__yIKW2

import { streamObject } from 'ai';

import { z } from 'zod';

export const codeBlockSchema = z.object({

  language: z.string(),

  filename: z.string(),

  code: z.string(),

});

// Allow streaming responses up to 30 seconds

export const maxDuration = 30;

export async function POST(req: Request) {

  const context = await req.json();

  const result = streamObject({

    model: 'openai/gpt-4o',

    schema: codeBlockSchema,

    prompt:

      `You are a helpful coding assitant. Only generate code, no markdown formatting or backticks, or text.` +

      context,

  });

  return result.toTextStreamResponse();

}
```

## [Features](https://ai-sdk.dev/elements/components/code-block\#features)

- Syntax highlighting with react-syntax-highlighter
- Line numbers (optional)
- Copy to clipboard functionality
- Automatic light/dark theme switching
- Customizable styles
- Accessible design

## [Examples](https://ai-sdk.dev/elements/components/code-block\#examples)

### [Dark Mode](https://ai-sdk.dev/elements/components/code-block\#dark-mode)

To use the `CodeBlock` component in dark mode, you can wrap it in a `div` with the `dark` class.

```font-mono text-sm
function MyComponent(props) {
  return (
    <div>
      <h1>Hello, {props.name}!</h1>
      <p>This is an example React component.</p>
    </div>
  );
}
```

```font-mono text-sm
function MyComponent(props) {
  return (
    <div>
      <h1>Hello, {props.name}!</h1>
      <p>This is an example React component.</p>
    </div>
  );
}
```

## [Props](https://ai-sdk.dev/elements/components/code-block\#props)

### [`<CodeBlock />`](https://ai-sdk.dev/elements/components/code-block\#codeblock-)

### code:

string

The code content to display.

### language:

string

The programming language for syntax highlighting.

### showLineNumbers?:

boolean

Whether to show line numbers. Default: false.

### children?:

React.ReactNode

Child elements (like CodeBlockCopyButton) positioned in the top-right corner.

### className?:

string

Additional CSS classes to apply to the root container.

### \[...props\]?:

React.HTMLAttributes<HTMLDivElement>

Any other props are spread to the root div.

### [`<CodeBlockCopyButton />`](https://ai-sdk.dev/elements/components/code-block\#codeblockcopybutton-)

### onCopy?:

() =\> void

Callback fired after a successful copy.

### onError?:

(error: Error) => void

Callback fired if copying fails.

### timeout?:

number

How long to show the copied state (ms). Default: 2000.

### children?:

React.ReactNode

Custom content for the button. Defaults to copy/check icons.

### className?:

string

Additional CSS classes to apply to the button.

### \[...props\]?:

React.ComponentProps<typeof Button>

Any other props are spread to the underlying shadcn/ui Button component.

On this page

[Code Block](https://ai-sdk.dev/elements/components/code-block#code-block)

[Installation](https://ai-sdk.dev/elements/components/code-block#installation)

[Usage](https://ai-sdk.dev/elements/components/code-block#usage)

[Usage with AI SDK](https://ai-sdk.dev/elements/components/code-block#usage-with-ai-sdk)

[Features](https://ai-sdk.dev/elements/components/code-block#features)

[Examples](https://ai-sdk.dev/elements/components/code-block#examples)

[Dark Mode](https://ai-sdk.dev/elements/components/code-block#dark-mode)

[Props](https://ai-sdk.dev/elements/components/code-block#props)

[<CodeBlock />](https://ai-sdk.dev/elements/components/code-block#codeblock-)

[<CodeBlockCopyButton />](https://ai-sdk.dev/elements/components/code-block#codeblockcopybutton-)

Elevate your AI applications with Vercel.

Trusted by OpenAI, Replicate, Suno, Pinecone, and more.

Vercel provides tools and infrastructure to deploy AI apps and features at scale.

[Talk to an expert](https://vercel.com/contact/sales?utm_source=ai_sdk&utm_medium=web&utm_campaign=contact_sales_cta&utm_content=talk_to_an_expert_sdk_docs)