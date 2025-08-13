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

# [Inline Citation](https://ai-sdk.dev/elements/components/inline-citation\#inline-citation)

The `InlineCitation` component provides a way to display citations inline with text content, similar to academic papers or research documents. It consists of a citation pill that shows detailed source information on hover, making it perfect for AI-generated content that needs to reference sources.

According to recent studies, artificial intelligence has shown remarkable progress in natural language processing.The technology continues to evolve rapidly, with new breakthroughs being announced regularlyexample.com+5.

## [Installation](https://ai-sdk.dev/elements/components/inline-citation\#installation)

ai-elementsshadcnManual

```
npx ai-elements@latest add inline-citation
```

## [Usage](https://ai-sdk.dev/elements/components/inline-citation\#usage)

```code-block_code__yIKW2

import {

  InlineCitation,

  InlineCitationCard,

  InlineCitationCardBody,

  InlineCitationCardTrigger,

  InlineCitationCarousel,

  InlineCitationCarouselContent,

  InlineCitationCarouselItem,

  InlineCitationCarouselHeader,

  InlineCitationCarouselIndex,

  InlineCitationSource,

  InlineCitationText,

} from '@/components/ai-elements/inline-citation';
```

```code-block_code__yIKW2

<InlineCitation>

  <InlineCitationText>{citation.text}</InlineCitationText>

  <InlineCitationCard>

    <InlineCitationCardTrigger

      sources={citation.sources.map((source) => source.url)}

    />

    <InlineCitationCardBody>

      <InlineCitationCarousel>

        <InlineCitationCarouselHeader>

          <InlineCitationCarouselIndex />

        </InlineCitationCarouselHeader>

        <InlineCitationCarouselContent>

          <InlineCitationCarouselItem>

            <InlineCitationSource

              title="AI SDK"

              url="https://ai-sdk.dev"

              description="The AI Toolkit for TypeScript"

            />

          </InlineCitationCarouselItem>

        </InlineCitationCarouselContent>

      </InlineCitationCarousel>

    </InlineCitationCardBody>

  </InlineCitationCard>

</InlineCitation>
```

## [Usage with AI SDK](https://ai-sdk.dev/elements/components/inline-citation\#usage-with-ai-sdk)

Build citations for AI-generated content using [`experimental_generateObject`](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-object).

Add the following component to your frontend:

app/page.tsx

```code-block_code__yIKW2

'use client';

import { experimental_useObject as useObject } from '@ai-sdk/react';

import {

  InlineCitation,

  InlineCitationText,

  InlineCitationCard,

  InlineCitationCardTrigger,

  InlineCitationCardBody,

  InlineCitationCarousel,

  InlineCitationCarouselContent,

  InlineCitationCarouselItem,

  InlineCitationCarouselHeader,

  InlineCitationCarouselIndex,

  InlineCitationCarouselPrev,

  InlineCitationCarouselNext,

  InlineCitationSource,

  InlineCitationQuote,

} from '@/components/ai-elements/inline-citation';

import { Button } from '@/components/ui/button';

import { citationSchema } from '@/app/api/citation/route';

const CitationDemo = () => {

  const { object, submit, isLoading } = useObject({

    api: '/api/citation',

    schema: citationSchema,

  });

  const handleSubmit = (topic: string) => {

    submit({ prompt: topic });

  };

  return (

    <div className="max-w-4xl mx-auto p-6 space-y-6">

      <div className="flex gap-2 mb-6">

        <Button

          onClick={() => handleSubmit('artificial intelligence')}

          disabled={isLoading}

          variant="outline"

        >

          Generate AI Content

        </Button>

        <Button

          onClick={() => handleSubmit('climate change')}

          disabled={isLoading}

          variant="outline"

        >

          Generate Climate Content

        </Button>

      </div>

      {isLoading && !object && (

        <div className="text-muted-foreground">

          Generating content with citations...

        </div>

      )}

      {object?.content && (

        <div className="prose prose-sm max-w-none">

          <p className="leading-relaxed">

            {object.content.split(/(\[\d+\])/).map((part, index) => {

              const citationMatch = part.match(/\[(\d+)\]/);

              if (citationMatch) {

                const citationNumber = citationMatch[1];

                const citation = object.citations?.find(

                  (c: any) => c.number === citationNumber,

                );

                if (citation) {

                  return (

                    <InlineCitation key={index}>

                      <InlineCitationCard>

                        <InlineCitationCardTrigger sources={[citation.url]} />

                        <InlineCitationCardBody>

                          <InlineCitationCarousel>

                            <InlineCitationCarouselHeader>

                              <InlineCitationCarouselPrev />

                              <InlineCitationCarouselNext />

                              <InlineCitationCarouselIndex />

                            </InlineCitationCarouselHeader>

                            <InlineCitationCarouselContent>

                              <InlineCitationCarouselItem>

                                <InlineCitationSource

                                  title={citation.title}

                                  url={citation.url}

                                  description={citation.description}

                                />

                                {citation.quote && (

                                  <InlineCitationQuote>

                                    {citation.quote}

                                  </InlineCitationQuote>

                                )}

                              </InlineCitationCarouselItem>

                            </InlineCitationCarouselContent>

                          </InlineCitationCarousel>

                        </InlineCitationCardBody>

                      </InlineCitationCard>

                    </InlineCitation>

                  );

                }

              }

              return part;

            })}

          </p>

        </div>

      )}

    </div>

  );

};

export default CitationDemo;
```

Add the following route to your backend:

app/api/citation/route.ts

```code-block_code__yIKW2

import { streamObject } from 'ai';

import { z } from 'zod';

export const citationSchema = z.object({

  content: z.string(),

  citations: z.array(

    z.object({

      number: z.string(),

      title: z.string(),

      url: z.string(),

      description: z.string().optional(),

      quote: z.string().optional(),

    }),

  ),

});

// Allow streaming responses up to 30 seconds

export const maxDuration = 30;

export async function POST(req: Request) {

  const { prompt } = await req.json();

  const result = streamObject({

    model: 'openai/gpt-4o',

    schema: citationSchema,

    prompt: `Generate a well-researched paragraph about ${prompt} with proper citations.



    Include:

    - A comprehensive paragraph with inline citations marked as [1], [2], etc.

    - 2-3 citations with realistic source information

    - Each citation should have a title, URL, and optional description/quote

    - Make the content informative and the sources credible



    Format citations as numbered references within the text.`,

  });

  return result.toTextStreamResponse();

}
```

## [Features](https://ai-sdk.dev/elements/components/inline-citation\#features)

- Hover interaction to reveal detailed citation information
- **Carousel navigation** for multiple citations with prev/next controls
- **Live index tracking** showing current slide position (e.g., "1/5")
- Support for source titles, URLs, and descriptions
- Optional quote blocks for relevant excerpts
- Composable architecture for flexible citation formats
- Accessible design with proper keyboard navigation
- Seamless integration with AI-generated content
- Clean visual design that doesn't disrupt reading flow
- Smart badge display showing source hostname and count

## [Props](https://ai-sdk.dev/elements/components/inline-citation\#props)

### [`<InlineCitation />`](https://ai-sdk.dev/elements/components/inline-citation\#inlinecitation-)

### \[...props\]?:

React.ComponentProps<"span">

Any other props are spread to the root span element.

### [`<InlineCitationText />`](https://ai-sdk.dev/elements/components/inline-citation\#inlinecitationtext-)

### \[...props\]?:

React.ComponentProps<"span">

Any other props are spread to the underlying span element.

### [`<InlineCitationCard />`](https://ai-sdk.dev/elements/components/inline-citation\#inlinecitationcard-)

### \[...props\]?:

React.ComponentProps<"span">

Any other props are spread to the HoverCard component.

### [`<InlineCitationCardTrigger />`](https://ai-sdk.dev/elements/components/inline-citation\#inlinecitationcardtrigger-)

### sources:

string\[\]

Array of source URLs. The length determines the number displayed in the badge.

### \[...props\]?:

React.ComponentProps<"button">

Any other props are spread to the underlying button element.

### [`<InlineCitationCardBody />`](https://ai-sdk.dev/elements/components/inline-citation\#inlinecitationcardbody-)

### \[...props\]?:

React.ComponentProps<"div">

Any other props are spread to the underlying div.

### [`<InlineCitationCarousel />`](https://ai-sdk.dev/elements/components/inline-citation\#inlinecitationcarousel-)

### \[...props\]?:

React.ComponentProps<typeof Carousel>

Any other props are spread to the underlying Carousel component.

### [`<InlineCitationCarouselContent />`](https://ai-sdk.dev/elements/components/inline-citation\#inlinecitationcarouselcontent-)

### \[...props\]?:

React.ComponentProps<"div">

Any other props are spread to the underlying CarouselContent component.

### [`<InlineCitationCarouselItem />`](https://ai-sdk.dev/elements/components/inline-citation\#inlinecitationcarouselitem-)

### \[...props\]?:

React.ComponentProps<"div">

Any other props are spread to the underlying div.

### [`<InlineCitationCarouselHeader />`](https://ai-sdk.dev/elements/components/inline-citation\#inlinecitationcarouselheader-)

### \[...props\]?:

React.ComponentProps<"div">

Any other props are spread to the underlying div.

### [`<InlineCitationCarouselIndex />`](https://ai-sdk.dev/elements/components/inline-citation\#inlinecitationcarouselindex-)

### \[...props\]?:

React.ComponentProps<"div">

Any other props are spread to the underlying div. Children will override the default index display.

### [`<InlineCitationCarouselPrev />`](https://ai-sdk.dev/elements/components/inline-citation\#inlinecitationcarouselprev-)

### \[...props\]?:

React.ComponentProps<typeof CarouselPrevious>

Any other props are spread to the underlying CarouselPrevious component.

### [`<InlineCitationCarouselNext />`](https://ai-sdk.dev/elements/components/inline-citation\#inlinecitationcarouselnext-)

### \[...props\]?:

React.ComponentProps<typeof CarouselNext>

Any other props are spread to the underlying CarouselNext component.

### [`<InlineCitationSource />`](https://ai-sdk.dev/elements/components/inline-citation\#inlinecitationsource-)

### title?:

string

The title of the source.

### url?:

string

The URL of the source.

### description?:

string

A brief description of the source.

### \[...props\]?:

React.ComponentProps<"div">

Any other props are spread to the underlying div.

### [`<InlineCitationQuote />`](https://ai-sdk.dev/elements/components/inline-citation\#inlinecitationquote-)

### \[...props\]?:

React.ComponentProps<"blockquote">

Any other props are spread to the underlying blockquote element.

On this page

[Inline Citation](https://ai-sdk.dev/elements/components/inline-citation#inline-citation)

[Installation](https://ai-sdk.dev/elements/components/inline-citation#installation)

[Usage](https://ai-sdk.dev/elements/components/inline-citation#usage)

[Usage with AI SDK](https://ai-sdk.dev/elements/components/inline-citation#usage-with-ai-sdk)

[Features](https://ai-sdk.dev/elements/components/inline-citation#features)

[Props](https://ai-sdk.dev/elements/components/inline-citation#props)

[<InlineCitation />](https://ai-sdk.dev/elements/components/inline-citation#inlinecitation-)

[<InlineCitationText />](https://ai-sdk.dev/elements/components/inline-citation#inlinecitationtext-)

[<InlineCitationCard />](https://ai-sdk.dev/elements/components/inline-citation#inlinecitationcard-)

[<InlineCitationCardTrigger />](https://ai-sdk.dev/elements/components/inline-citation#inlinecitationcardtrigger-)

[<InlineCitationCardBody />](https://ai-sdk.dev/elements/components/inline-citation#inlinecitationcardbody-)

[<InlineCitationCarousel />](https://ai-sdk.dev/elements/components/inline-citation#inlinecitationcarousel-)

[<InlineCitationCarouselContent />](https://ai-sdk.dev/elements/components/inline-citation#inlinecitationcarouselcontent-)

[<InlineCitationCarouselItem />](https://ai-sdk.dev/elements/components/inline-citation#inlinecitationcarouselitem-)

[<InlineCitationCarouselHeader />](https://ai-sdk.dev/elements/components/inline-citation#inlinecitationcarouselheader-)

[<InlineCitationCarouselIndex />](https://ai-sdk.dev/elements/components/inline-citation#inlinecitationcarouselindex-)

[<InlineCitationCarouselPrev />](https://ai-sdk.dev/elements/components/inline-citation#inlinecitationcarouselprev-)

[<InlineCitationCarouselNext />](https://ai-sdk.dev/elements/components/inline-citation#inlinecitationcarouselnext-)

[<InlineCitationSource />](https://ai-sdk.dev/elements/components/inline-citation#inlinecitationsource-)

[<InlineCitationQuote />](https://ai-sdk.dev/elements/components/inline-citation#inlinecitationquote-)

Elevate your AI applications with Vercel.

Trusted by OpenAI, Replicate, Suno, Pinecone, and more.

Vercel provides tools and infrastructure to deploy AI apps and features at scale.

[Talk to an expert](https://vercel.com/contact/sales?utm_source=ai_sdk&utm_medium=web&utm_campaign=contact_sales_cta&utm_content=talk_to_an_expert_sdk_docs)