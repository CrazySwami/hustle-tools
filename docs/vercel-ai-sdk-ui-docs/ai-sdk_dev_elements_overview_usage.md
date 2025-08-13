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

# [Usage](https://ai-sdk.dev/elements/overview/usage\#usage)

Once an AI Elements component is installed, you can import it and use it in your application like any other React component. The components are added as part of your codebase (not hidden in a library), so the usage feels very natural.

## [Example](https://ai-sdk.dev/elements/overview/usage\#example)

After installing AI Elements components, you can use them in your application like any other React component. For example:

```code-block_code__yIKW2

'use client';

import {

  Message,

  MessageAvatar,

  MessageContent,

} from '@/components/ai-elements/message';

import { useChat } from '@ai-sdk/react';

import { Response } from '@/components/ai-elements/response';

const Example = () => {

  const { messages } = useChat();

  return (

    <>

      {messages.map(({ role, parts }, index) => (

        <Message from={role} key={index}>

          <MessageContent>

            {parts.map((part, i) => {

              switch (part.type) {

                case 'text':

                  return <Response key={`${role}-${i}`}>{part.text}</Response>;

              }

            })}

          </MessageContent>

        </Message>

      ))}

    </>

  );

};

export default Example;
```

In the example above, we import the `Message` component from our AI Elements directory and include it in our JSX. Then, we compose the component with the `MessageContent` and `Response` subcomponents. You can style or configure the component just as you would if you wrote it yourself – since the code lives in your project, you can even open the component file to see how it works or make custom modifications.

## [Extensibility](https://ai-sdk.dev/elements/overview/usage\#extensibility)

All AI Elements components take as many primitive attributes as possible. For example, the `Message` component extends `HTMLAttributes<HTMLDivElement>`, so you can pass any props that a `div` supports. This makes it easy to extend the component with your own styles or functionality.

## [Customization](https://ai-sdk.dev/elements/overview/usage\#customization)

If you re-install AI Elements by rerunning `npx ai-elements@latest`, the CLI
will ask before overwriting the file so you can save any custom changes you
made.

After installation, no additional setup is needed. The component’s styles (Tailwind CSS classes) and scripts are already integrated. You can start interacting with the component in your app immediately.

For example, if you'd like to remove the rounding on `Message`, you can go to `components/ai-elements/message.tsx` and remove `rounded-lg` as follows:

components/ai-elements/message.tsx

```code-block_code__yIKW2

export const MessageContent = ({

  children,

  className,

  ...props

}: MessageContentProps) => (

  <div

    className={cn(

      'flex flex-col gap-2 text-sm text-foreground',

      'group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground group-[.is-user]:px-4 group-[.is-user]:py-3',

      className,

    )}

    {...props}

  >

    <div className="is-user:dark">{children}</div>

  </div>

);
```

On this page

[Usage](https://ai-sdk.dev/elements/overview/usage#usage)

[Example](https://ai-sdk.dev/elements/overview/usage#example)

[Extensibility](https://ai-sdk.dev/elements/overview/usage#extensibility)

[Customization](https://ai-sdk.dev/elements/overview/usage#customization)

Elevate your AI applications with Vercel.

Trusted by OpenAI, Replicate, Suno, Pinecone, and more.

Vercel provides tools and infrastructure to deploy AI apps and features at scale.

[Talk to an expert](https://vercel.com/contact/sales?utm_source=ai_sdk&utm_medium=web&utm_campaign=contact_sales_cta&utm_content=talk_to_an_expert_sdk_docs)