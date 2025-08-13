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

# [Image](https://ai-sdk.dev/elements/components/image\#image)

The `Image` component displays AI-generated images from the AI SDK. It accepts a [`Experimental_GeneratedImage`](https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-image) object from the AI SDK's `generateImage` function and automatically renders it as an image.

![Example generated image](<Base64-Image-Removed>)

## [Installation](https://ai-sdk.dev/elements/components/image\#installation)

ai-elementsshadcnManual

```
npx ai-elements@latest add image
```

## [Usage](https://ai-sdk.dev/elements/components/image\#usage)

```code-block_code__yIKW2

import { Image } from '@/components/ai-elements/image';
```

```code-block_code__yIKW2

<Image

  base64="valid base64 string"

  mediaType: 'image/jpeg',

  uint8Array: new Uint8Array([]),

  alt="Example generated image"

  className="h-[150px] aspect-square border"

/>
```

## [Usage with AI SDK](https://ai-sdk.dev/elements/components/image\#usage-with-ai-sdk)

Build a simple app allowing a user to generate an image given a prompt.

Install the `@ai-sdk/openai` package:

pnpm

npm

yarn

```
pnpm add @ai-sdk/openai
```

Add the following component to your frontend:

app/page.tsx

```code-block_code__yIKW2

'use client';

import { Image } from '@/components/ai-elements/image';

import {

  Input,

  PromptInputTextarea,

  PromptInputSubmit,

} from '@/components/ai-elements/prompt-input';

import { useState } from 'react';

import { Loader } from '@/components/ai-elements/loader';

const ImageDemo = () => {

  const [prompt, setPrompt] = useState('A futuristic cityscape at sunset');

  const [imageData, setImageData] = useState<any>(null);

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();

    if (!prompt.trim()) return;

    setPrompt('');

    setIsLoading(true);

    try {

      const response = await fetch('/api/image', {

        method: 'POST',

        body: JSON.stringify({ prompt: prompt.trim() }),

      });

      const data = await response.json();

      setImageData(data);

    } catch (error) {

      console.error('Error generating image:', error);

    } finally {

      setIsLoading(false);

    }

  };

  return (

    <div className="max-w-4xl mx-auto p-6 relative size-full rounded-lg border h-[600px]">

      <div className="flex flex-col h-full">

        <div className="flex-1 overflow-y-auto p-4">

          {imageData && (

            <div className="flex justify-center">

              <Image

                {...imageData}

                alt="Generated image"

                className="h-[300px] aspect-square border rounded-lg"

              />

            </div>

          )}

          {isLoading && <Loader />}

        </div>

        <Input

          onSubmit={handleSubmit}

          className="mt-4 w-full max-w-2xl mx-auto relative"

        >

          <PromptInputTextarea

            value={prompt}

            placeholder="Describe the image you want to generate..."

            onChange={(e) => setPrompt(e.currentTarget.value)}

            className="pr-12"

          />

          <PromptInputSubmit

            status={isLoading ? 'submitted' : 'ready'}

            disabled={!prompt.trim()}

            className="absolute bottom-1 right-1"

          />

        </Input>

      </div>

    </div>

  );

};

export default ImageDemo;
```

Add the following route to your backend:

app/api/image/route.ts

```code-block_code__yIKW2

import { openai } from '@ai-sdk/openai';

import { experimental_generateImage } from 'ai';

export async function POST(req: Request) {

  const { prompt }: { prompt: string } = await req.json();

  const { image } = await experimental_generateImage({

    model: openai.image('dall-e-3'),

    prompt: prompt,

    size: '1024x1024',

  });

  return Response.json({

    base64: image.base64,

    uint8Array: image.uint8Array,

    mediaType: image.mediaType,

  });

}
```

## [Features](https://ai-sdk.dev/elements/components/image\#features)

- Accepts `Experimental_GeneratedImage` objects directly from the AI SDK
- Automatically creates proper data URLs from base64-encoded image data
- Supports all standard HTML image attributes
- Responsive by default with `max-w-full h-auto` styling
- Customizable with additional CSS classes
- Includes proper TypeScript types for AI SDK compatibility

## [Props](https://ai-sdk.dev/elements/components/image\#props)

### [`<Image />`](https://ai-sdk.dev/elements/components/image\#image-)

### alt?:

string

Alternative text for the image.

### className?:

string

Additional CSS classes to apply to the image.

### \[...props\]?:

Experimental\_GeneratedImage

The image data to display, as returned by the AI SDK.

On this page

[Image](https://ai-sdk.dev/elements/components/image#image)

[Installation](https://ai-sdk.dev/elements/components/image#installation)

[Usage](https://ai-sdk.dev/elements/components/image#usage)

[Usage with AI SDK](https://ai-sdk.dev/elements/components/image#usage-with-ai-sdk)

[Features](https://ai-sdk.dev/elements/components/image#features)

[Props](https://ai-sdk.dev/elements/components/image#props)

[<Image />](https://ai-sdk.dev/elements/components/image#image-)

Elevate your AI applications with Vercel.

Trusted by OpenAI, Replicate, Suno, Pinecone, and more.

Vercel provides tools and infrastructure to deploy AI apps and features at scale.

[Talk to an expert](https://vercel.com/contact/sales?utm_source=ai_sdk&utm_medium=web&utm_campaign=contact_sales_cta&utm_content=talk_to_an_expert_sdk_docs)