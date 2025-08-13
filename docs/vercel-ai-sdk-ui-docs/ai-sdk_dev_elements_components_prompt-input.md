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

# [Prompt Input](https://ai-sdk.dev/elements/components/prompt-input\#prompt-input)

The `PromptInput` component allows a user to send a message to a large language model. It includes a textarea, a submit button, and a dropdown for selecting the model.

SearchGPT-4GPT-4GPT-3.5 TurboClaude 2Claude InstantPaLM 2Llama 2 70BLlama 2 13BCommandMistral 7B

## [Installation](https://ai-sdk.dev/elements/components/prompt-input\#installation)

ai-elementsshadcnManual

```
npx ai-elements@latest add prompt-input
```

## [Usage](https://ai-sdk.dev/elements/components/prompt-input\#usage)

```code-block_code__yIKW2

import {

  PromptInput,

  PromptInputSubmit,

  PromptInputTextarea,

  PromptInputToolbar,

} from '@/components/ai-elements/prompt-input';
```

```code-block_code__yIKW2

<PromptInput onSubmit={() => {}} className="mt-4 relative">

  <PromptInputTextarea onChange={(e) => {}} value={''} />

  <PromptInputToolbar>

    <PromptInputSubmit

      className="absolute right-1 bottom-1"

      disabled={false}

      status={'ready'}

    />

  </PromptInputToolbar>

</PromptInput>
```

## [Usage with AI SDK](https://ai-sdk.dev/elements/components/prompt-input\#usage-with-ai-sdk)

Built a fully functional chat app using `PromptInput`, [`Conversation`](https://ai-sdk.dev/elements/components/conversation) with a model picker:

Add the following component to your frontend:

app/page.tsx

```code-block_code__yIKW2

'use client';

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

import { GlobeIcon, MicIcon } from 'lucide-react';

import { useState } from 'react';

import { useChat } from '@ai-sdk/react';

import {

  Conversation,

  ConversationContent,

  ConversationScrollButton,

} from '@/components/ai-elements/conversation';

import { Message, MessageContent } from '@/components/ai-elements/message';

import { Response } from '@/components/ai-elements/response';

const models = [\
\
  { id: 'gpt-4o', name: 'GPT-4o' },\
\
  { id: 'claude-opus-4-20250514', name: 'Claude 4 Opus' },\
\
];

const InputDemo = () => {

  const [text, setText] = useState<string>('');

  const [model, setModel] = useState<string>(models[0].id);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {

    e.preventDefault();

    sendMessage(

      { text: text },

      {

        body: {

          model: model,

        },

      },

    );

    setText('');

  };

  const { messages, status, sendMessage } = useChat();

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

            ))}

          </ConversationContent>

          <ConversationScrollButton />

        </Conversation>

        <PromptInput onSubmit={handleSubmit} className="mt-4">

          <PromptInputTextarea

            onChange={(e) => setText(e.target.value)}

            value={text}

          />

          <PromptInputToolbar>

            <PromptInputTools>

              <PromptInputButton>

                <MicIcon size={16} />

              </PromptInputButton>

              <PromptInputButton>

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

                    <PromptInputModelSelectItem key={model.id} value={model.id}>

                      {model.name}

                    </PromptInputModelSelectItem>

                  ))}

                </PromptInputModelSelectContent>

              </PromptInputModelSelect>

            </PromptInputTools>

            <PromptInputSubmit disabled={!text} status={status} />

          </PromptInputToolbar>

        </PromptInput>

      </div>

    </div>

  );

};

export default InputDemo;
```

Add the following route to your backend:

app/api/chat/route.ts

```code-block_code__yIKW2

import { streamText, UIMessage, convertToModelMessages } from 'ai';

// Allow streaming responses up to 30 seconds

export const maxDuration = 30;

export async function POST(req: Request) {

  const { model, messages }: { messages: UIMessage[]; model: string } =

    await req.json();

  const result = streamText({

    model: model,

    messages: convertToModelMessages(messages),

  });

  return result.toUIMessageStreamResponse();

}
```

## [Features](https://ai-sdk.dev/elements/components/prompt-input\#features)

- Auto-resizing textarea that adjusts height based on content
- Automatic submit button icons based on status
- Support for keyboard shortcuts (Cmd/Ctrl + Enter to submit)
- Customizable min/max height for the textarea
- Flexible toolbar with support for custom actions and tools
- Built-in model selection dropdown
- Responsive design with mobile-friendly controls
- Clean, modern styling with customizable themes
- Form-based submission handling

## [Props](https://ai-sdk.dev/elements/components/prompt-input\#props)

### [`<PromptInput />`](https://ai-sdk.dev/elements/components/prompt-input\#promptinput-)

### \[...props\]?:

React.HTMLAttributes<HTMLFormElement>

Any other props are spread to the root form element.

### [`<PromptInputTextarea />`](https://ai-sdk.dev/elements/components/prompt-input\#promptinputtextarea-)

### \[...props\]?:

React.ComponentProps<typeof Textarea>

Any other props are spread to the underlying Textarea component.

### [`<PromptInputToolbar />`](https://ai-sdk.dev/elements/components/prompt-input\#promptinputtoolbar-)

### \[...props\]?:

React.HTMLAttributes<HTMLDivElement>

Any other props are spread to the toolbar div.

### [`<PromptInputTools />`](https://ai-sdk.dev/elements/components/prompt-input\#promptinputtools-)

### \[...props\]?:

React.HTMLAttributes<HTMLDivElement>

Any other props are spread to the tools div.

### [`<PromptInputButton />`](https://ai-sdk.dev/elements/components/prompt-input\#promptinputbutton-)

### \[...props\]?:

React.ComponentProps<typeof Button>

Any other props are spread to the underlying shadcn/ui Button component.

### [`<PromptInputSubmit />`](https://ai-sdk.dev/elements/components/prompt-input\#promptinputsubmit-)

### \[...props\]?:

React.ComponentProps<typeof Button>

Any other props are spread to the underlying shadcn/ui Button component.

### [`<PromptInputModelSelect />`](https://ai-sdk.dev/elements/components/prompt-input\#promptinputmodelselect-)

### \[...props\]?:

React.ComponentProps<typeof Select>

Any other props are spread to the underlying Select component.

### [`<PromptInputModelSelectTrigger />`](https://ai-sdk.dev/elements/components/prompt-input\#promptinputmodelselecttrigger-)

### \[...props\]?:

React.ComponentProps<typeof SelectTrigger>

Any other props are spread to the underlying SelectTrigger component.

### [`<PromptInputModelSelectContent />`](https://ai-sdk.dev/elements/components/prompt-input\#promptinputmodelselectcontent-)

### \[...props\]?:

React.ComponentProps<typeof SelectContent>

Any other props are spread to the underlying SelectContent component.

### [`<PromptInputModelSelectItem />`](https://ai-sdk.dev/elements/components/prompt-input\#promptinputmodelselectitem-)

### \[...props\]?:

React.ComponentProps<typeof SelectItem>

Any other props are spread to the underlying SelectItem component.

### [`<PromptInputModelSelectValue />`](https://ai-sdk.dev/elements/components/prompt-input\#promptinputmodelselectvalue-)

### \[...props\]?:

React.ComponentProps<typeof SelectValue>

Any other props are spread to the underlying SelectValue component.

On this page

[Prompt Input](https://ai-sdk.dev/elements/components/prompt-input#prompt-input)

[Installation](https://ai-sdk.dev/elements/components/prompt-input#installation)

[Usage](https://ai-sdk.dev/elements/components/prompt-input#usage)

[Usage with AI SDK](https://ai-sdk.dev/elements/components/prompt-input#usage-with-ai-sdk)

[Features](https://ai-sdk.dev/elements/components/prompt-input#features)

[Props](https://ai-sdk.dev/elements/components/prompt-input#props)

[<PromptInput />](https://ai-sdk.dev/elements/components/prompt-input#promptinput-)

[<PromptInputTextarea />](https://ai-sdk.dev/elements/components/prompt-input#promptinputtextarea-)

[<PromptInputToolbar />](https://ai-sdk.dev/elements/components/prompt-input#promptinputtoolbar-)

[<PromptInputTools />](https://ai-sdk.dev/elements/components/prompt-input#promptinputtools-)

[<PromptInputButton />](https://ai-sdk.dev/elements/components/prompt-input#promptinputbutton-)

[<PromptInputSubmit />](https://ai-sdk.dev/elements/components/prompt-input#promptinputsubmit-)

[<PromptInputModelSelect />](https://ai-sdk.dev/elements/components/prompt-input#promptinputmodelselect-)

[<PromptInputModelSelectTrigger />](https://ai-sdk.dev/elements/components/prompt-input#promptinputmodelselecttrigger-)

[<PromptInputModelSelectContent />](https://ai-sdk.dev/elements/components/prompt-input#promptinputmodelselectcontent-)

[<PromptInputModelSelectItem />](https://ai-sdk.dev/elements/components/prompt-input#promptinputmodelselectitem-)

[<PromptInputModelSelectValue />](https://ai-sdk.dev/elements/components/prompt-input#promptinputmodelselectvalue-)

Elevate your AI applications with Vercel.

Trusted by OpenAI, Replicate, Suno, Pinecone, and more.

Vercel provides tools and infrastructure to deploy AI apps and features at scale.

[Talk to an expert](https://vercel.com/contact/sales?utm_source=ai_sdk&utm_medium=web&utm_campaign=contact_sales_cta&utm_content=talk_to_an_expert_sdk_docs)