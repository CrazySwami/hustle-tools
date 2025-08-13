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

# [WebPreview](https://ai-sdk.dev/elements/components/web-preview\#webpreview)

The `WebPreview` component provides a flexible way to showcase the result of a generated UI component, along with its source code. It is designed for documentation and demo purposes, allowing users to interact with live examples and view the underlying implementation.

v0

Console

## [Installation](https://ai-sdk.dev/elements/components/web-preview\#installation)

ai-elementsshadcnManual

```
npx ai-elements@latest add web-preview
```

## [Usage](https://ai-sdk.dev/elements/components/web-preview\#usage)

```code-block_code__yIKW2

import {

  WebPreview,

  WebPreviewNavigation,

  WebPreviewUrl,

  WebPreviewBody,

} from '@/components/ai-elements/web-preview';
```

```code-block_code__yIKW2

<WebPreview defaultUrl="https://ai-sdk.dev" style={{ height: '400px' }}>

  <WebPreviewNavigation>

    <WebPreviewUrl src="https://ai-sdk.dev" />

  </WebPreviewNavigation>

  <WebPreviewBody src="https://ai-sdk.dev" />

</WebPreview>
```

## [Usage with AI SDK](https://ai-sdk.dev/elements/components/web-preview\#usage-with-ai-sdk)

Build a simple v0 clone using the [v0 Platform API](https://v0.dev/docs/api/platform).

Install the `v0-sdk` package:

pnpm

npm

yarn

```
pnpm add v0-sdk
```

Add the following component to your frontend:

app/page.tsx

```code-block_code__yIKW2

'use client';

import {

  WebPreview,

  WebPreviewBody,

  WebPreviewNavigation,

  WebPreviewUrl,

} from '@/components/ai-elements/web-preview';

import { useState } from 'react';

import {

  Input,

  PromptInputTextarea,

  PromptInputSubmit,

} from '@/components/ai-elements/prompt-input';

import { Loader } from '../ai-elements/loader';

const WebPreviewDemo = () => {

  const [previewUrl, setPreviewUrl] = useState('');

  const [prompt, setPrompt] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();

    if (!prompt.trim()) return;

    setPrompt('');

    setIsGenerating(true);

    try {

      const response = await fetch('/api/v0', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ prompt }),

      });

      const data = await response.json();

      setPreviewUrl(data.demo || '/');

      console.log('Generation finished:', data);

    } catch (error) {

      console.error('Generation failed:', error);

    } finally {

      setIsGenerating(false);

    }

  };

  return (

    <div className="max-w-4xl mx-auto p-6 relative size-full rounded-lg border h-[600px]">

      <div className="flex flex-col h-full">

        <div className="flex-1 mb-4">

          {isGenerating ? (

            <div className="flex flex-col items-center justify-center h-full">

              <Loader />

              <p className="mt-4 text-muted-foreground">

                Generating app, this may take a few seconds...

              </p>

            </div>

          ) : previewUrl ? (

            <WebPreview defaultUrl={previewUrl}>

              <WebPreviewNavigation>

                <WebPreviewUrl />

              </WebPreviewNavigation>

              <WebPreviewBody src={previewUrl} />

            </WebPreview>

          ) : (

            <div className="flex items-center justify-center h-full text-muted-foreground">

              Your generated app will appear here

            </div>

          )}

        </div>

        <Input

          onSubmit={handleSubmit}

          className="w-full max-w-2xl mx-auto relative"

        >

          <PromptInputTextarea

            value={prompt}

            placeholder="Describe the app you want to build..."

            onChange={(e) => setPrompt(e.currentTarget.value)}

            className="pr-12 min-h-[60px]"

          />

          <PromptInputSubmit

            status={isGenerating ? 'streaming' : 'ready'}

            disabled={!prompt.trim()}

            className="absolute bottom-1 right-1"

          />

        </Input>

      </div>

    </div>

  );

};

export default WebPreviewDemo;
```

Add the following route to your backend:

app/api/v0/route.ts

```code-block_code__yIKW2

import { v0 } from 'v0-sdk';

export async function POST(req: Request) {

  const { prompt }: { prompt: string } = await req.json();

  const result = await v0.chats.create({

    system: 'You are an expert coder',

    message: prompt,

    modelConfiguration: {

      modelId: 'v0-1.5-sm',

      imageGenerations: false,

      thinking: false,

    },

  });

  return Response.json({

    demo: result.demo,

    webUrl: result.webUrl,

  });

}
```

## [Features](https://ai-sdk.dev/elements/components/web-preview\#features)

- Live preview of UI components
- Composable architecture with dedicated sub-components
- Responsive design modes (Desktop, Tablet, Mobile)
- Navigation controls with back/forward functionality
- URL input and example selector
- Full screen mode support
- Console logging with timestamps
- Context-based state management
- Consistent styling with the design system
- Easy integration into documentation pages

## [Props](https://ai-sdk.dev/elements/components/web-preview\#props)

### [`<WebPreview />`](https://ai-sdk.dev/elements/components/web-preview\#webpreview-)

### defaultUrl?:

string

The initial URL to load in the preview (default: empty string).

### onUrlChange?:

(url: string) => void

Callback fired when the URL changes.

### \[...props\]?:

React.HTMLAttributes<HTMLDivElement>

Any other props are spread to the root div.

### [`<WebPreviewNavigation />`](https://ai-sdk.dev/elements/components/web-preview\#webpreviewnavigation-)

### \[...props\]?:

React.HTMLAttributes<HTMLDivElement>

Any other props are spread to the navigation container.

### [`<WebPreviewNavigationButton />`](https://ai-sdk.dev/elements/components/web-preview\#webpreviewnavigationbutton-)

### tooltip?:

string

Tooltip text to display on hover.

### \[...props\]?:

React.ComponentProps<typeof Button>

Any other props are spread to the underlying shadcn/ui Button component.

### [`<WebPreviewUrl />`](https://ai-sdk.dev/elements/components/web-preview\#webpreviewurl-)

### \[...props\]?:

React.ComponentProps<typeof Input>

Any other props are spread to the underlying shadcn/ui Input component.

### [`<WebPreviewBody />`](https://ai-sdk.dev/elements/components/web-preview\#webpreviewbody-)

### loading?:

React.ReactNode

Optional loading indicator to display over the preview.

### \[...props\]?:

React.IframeHTMLAttributes<HTMLIFrameElement>

Any other props are spread to the underlying iframe.

### [`<WebPreviewConsole />`](https://ai-sdk.dev/elements/components/web-preview\#webpreviewconsole-)

### logs?:

Array<{ level: "log" \| "warn" \| "error"; message: string; timestamp: Date }>

Console log entries to display in the console panel.

### \[...props\]?:

React.HTMLAttributes<HTMLDivElement>

Any other props are spread to the root div.

On this page

[WebPreview](https://ai-sdk.dev/elements/components/web-preview#webpreview)

[Installation](https://ai-sdk.dev/elements/components/web-preview#installation)

[Usage](https://ai-sdk.dev/elements/components/web-preview#usage)

[Usage with AI SDK](https://ai-sdk.dev/elements/components/web-preview#usage-with-ai-sdk)

[Features](https://ai-sdk.dev/elements/components/web-preview#features)

[Props](https://ai-sdk.dev/elements/components/web-preview#props)

[<WebPreview />](https://ai-sdk.dev/elements/components/web-preview#webpreview-)

[<WebPreviewNavigation />](https://ai-sdk.dev/elements/components/web-preview#webpreviewnavigation-)

[<WebPreviewNavigationButton />](https://ai-sdk.dev/elements/components/web-preview#webpreviewnavigationbutton-)

[<WebPreviewUrl />](https://ai-sdk.dev/elements/components/web-preview#webpreviewurl-)

[<WebPreviewBody />](https://ai-sdk.dev/elements/components/web-preview#webpreviewbody-)

[<WebPreviewConsole />](https://ai-sdk.dev/elements/components/web-preview#webpreviewconsole-)

Elevate your AI applications with Vercel.

Trusted by OpenAI, Replicate, Suno, Pinecone, and more.

Vercel provides tools and infrastructure to deploy AI apps and features at scale.

[Talk to an expert](https://vercel.com/contact/sales?utm_source=ai_sdk&utm_medium=web&utm_campaign=contact_sales_cta&utm_content=talk_to_an_expert_sdk_docs)