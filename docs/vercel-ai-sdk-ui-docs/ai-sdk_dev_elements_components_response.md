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

# [Response](https://ai-sdk.dev/elements/components/response\#response)

The `Response` component renders a Markdown response from a large language model.

### Hello World

This is a markdown response from an AI model.

## Tables

| Column 1 | Column 2 | Column 3 |
| --- | --- | --- |
| Row 1, Col 1 |  |  |

## [Installation](https://ai-sdk.dev/elements/components/response\#installation)

ai-elementsshadcnManual

```
npx ai-elements@latest add response
```

## [Usage](https://ai-sdk.dev/elements/components/response\#usage)

```code-block_code__yIKW2

import { Response } from '@/components/ai-elements/response';
```

```code-block_code__yIKW2

<Response>**Hi there.** I am an AI model designed to help you.</Response>
```

## [Usage with AI SDK](https://ai-sdk.dev/elements/components/response\#usage-with-ai-sdk)

Populate a markdown response with messages from [`useChat`](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat).

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

import { useChat } from '@ai-sdk/react';

import { Response } from '@/components/ai-elements/response';

const ResponseDemo = () => {

  const { messages } = useChat();

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

      </div>

    </div>

  );

};

export default ResponseDemo;
```

## [Features](https://ai-sdk.dev/elements/components/response\#features)

- Renders markdown content with support for paragraphs, links, and code blocks
- Supports GFM features like tables, task lists, and strikethrough text via remark-gfm
- Supports rendering Math Equations via rehype-katex
- **Smart streaming support** \- automatically completes incomplete formatting during real-time text streaming
- Code blocks are rendered with syntax highlighting for various programming languages
- Code blocks include a button to easily copy code to clipboard
- Adapts to different screen sizes while maintaining readability
- Seamlessly integrates with both light and dark themes
- Customizable appearance through className props and Tailwind CSS utilities
- Built with accessibility in mind for all users

### [Streaming-Optimized Markdown Parsing](https://ai-sdk.dev/elements/components/response\#streaming-optimized-markdown-parsing)

The Response component includes intelligent parsing that enhances the streaming experience by:

- **Auto-completing incomplete formatting**: Bold ( `**`), italic ( `*`, `_`, `__`), strikethrough ( `~~`), and inline code ( `` ` ``) are automatically completed during streaming
- **Hiding incomplete links**: Unterminated links ( `[text`) and images ( `![alt`) are hidden until complete to prevent broken syntax display\
- **Preserving code blocks**: Triple backtick code blocks ( ```` ``` ````) are protected from inline code completion interference\
- **Real-time formatting**: Users see properly formatted text as it streams, creating a smoother experience\
\
## [Props](https://ai-sdk.dev/elements/components/response\#props)\
\
### [`<Response />`](https://ai-sdk.dev/elements/components/response\#response-)\
\
### children:\
\
string \| React.ReactNode\
\
The markdown content to render.\
\
### options?:\
\
ReactMarkdown\["options"\]\
\
Optional react-markdown options to customize rendering.\
\
### allowedImagePrefixes?:\
\
string\[\]\
\
Allowed image prefixes to render. Defaults to \`\["\*"\]\`.\
\
### allowedLinkPrefixes?:\
\
string\[\]\
\
Allowed link prefixes to render. Defaults to \`\["\*"\]\`.\
\
### defaultOrigin?:\
\
string\
\
Default origin for links and images.\
\
### parseIncompleteMarkdown?:\
\
boolean\
\
Enable intelligent parsing for streaming markdown. Auto-completes incomplete formatting and hides broken links. Defaults to \`true\`.\
\
### \[...props\]?:\
\
React.HTMLAttributes<HTMLDivElement>\
\
Any other props are spread to the root div.\
\
On this page\
\
[Response](https://ai-sdk.dev/elements/components/response#response)\
\
[Installation](https://ai-sdk.dev/elements/components/response#installation)\
\
[Usage](https://ai-sdk.dev/elements/components/response#usage)\
\
[Usage with AI SDK](https://ai-sdk.dev/elements/components/response#usage-with-ai-sdk)\
\
[Features](https://ai-sdk.dev/elements/components/response#features)\
\
[Streaming-Optimized Markdown Parsing](https://ai-sdk.dev/elements/components/response#streaming-optimized-markdown-parsing)\
\
[Props](https://ai-sdk.dev/elements/components/response#props)\
\
[<Response />](https://ai-sdk.dev/elements/components/response#response-)\
\
Elevate your AI applications with Vercel.\
\
Trusted by OpenAI, Replicate, Suno, Pinecone, and more.\
\
Vercel provides tools and infrastructure to deploy AI apps and features at scale.\
\
[Talk to an expert](https://vercel.com/contact/sales?utm_source=ai_sdk&utm_medium=web&utm_campaign=contact_sales_cta&utm_content=talk_to_an_expert_sdk_docs)