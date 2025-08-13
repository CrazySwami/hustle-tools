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

# [Branch](https://ai-sdk.dev/elements/components/branch\#branch)

The `Branch` component manages multiple versions of AI messages, allowing users to navigate between different response branches. It provides a clean, modern interface with customizable themes and keyboard-accessible navigation buttons.

What are the key strategies for optimizing React performance?

![](https://github.com/haydenbleasel.png)

How can I improve the performance of my React application?

![](https://github.com/haydenbleasel.png)

What performance optimization techniques should I use in React?

![](https://github.com/haydenbleasel.png)

1 of 3

Here's the first response to your question. This approach focuses on performance optimization.

![](https://github.com/openai.png)

Here's an alternative response. This approach emphasizes code readability and maintainability over pure performance.

![](https://github.com/openai.png)

And here's a third option. This balanced approach considers both performance and maintainability, making it suitable for most use cases.

![](https://github.com/openai.png)

1 of 3

## [Installation](https://ai-sdk.dev/elements/components/branch\#installation)

ai-elementsshadcnManual

```
npx ai-elements@latest add branch
```

## [Usage](https://ai-sdk.dev/elements/components/branch\#usage)

```code-block_code__yIKW2

import {

  Branch,

  BranchMessages,

  BranchNext,

  BranchPage,

  BranchPrevious,

  BranchSelector,

} from '@/components/ai-elements/branch';
```

```code-block_code__yIKW2

<Branch defaultBranch={0}>

  <BranchMessages>

    <Message from="user">

      <MessageContent>Hello</MessageContent>

    </Message>

    <Message from="user">

      <MessageContent>Hi!</MessageContent>

    </Message>

  </BranchMessages>

  <BranchSelector from="user">

    <BranchPrevious />

    <BranchPage />

    <BranchNext />

  </BranchSelector>

</Branch>
```

## [Usage with AI SDK](https://ai-sdk.dev/elements/components/branch\#usage-with-ai-sdk)

Branching is an advanced use case that you can implement yourself to suit your
application's needs. While the AI SDK does not provide built-in support for
branching, you have full flexibility to design and manage multiple response
paths as required.

## [Features](https://ai-sdk.dev/elements/components/branch\#features)

- Context-based state management for multiple message branches
- Navigation controls for moving between branches (previous/next)
- Uses CSS to prevent re-rendering of branches when switching
- Branch counter showing current position (e.g., "1 of 3")
- Automatic branch tracking and synchronization
- Callbacks for branch change and navigation using `onBranchChange`
- Support for custom branch change callbacks
- Responsive design with mobile-friendly controls
- Clean, modern styling with customizable themes
- Keyboard-accessible navigation buttons

## [Props](https://ai-sdk.dev/elements/components/branch\#props)

### [`<Branch />`](https://ai-sdk.dev/elements/components/branch\#branch-)

### defaultBranch?:

number

The index of the branch to show by default (default: 0).

### onBranchChange?:

(branchIndex: number) => void

Callback fired when the branch changes.

### \[...props\]:

React.HTMLAttributes<HTMLDivElement>

Any other props are spread to the root div.

### [`<BranchMessages />`](https://ai-sdk.dev/elements/components/branch\#branchmessages-)

### \[...props\]:

React.HTMLAttributes<HTMLDivElement>

Any other props are spread to the root div.

### [`<BranchSelector />`](https://ai-sdk.dev/elements/components/branch\#branchselector-)

### from:

UIMessage\["role"\]

Aligns the selector for user, assistant or system messages.

### \[...props\]:

React.HTMLAttributes<HTMLDivElement>

Any other props are spread to the selector container.

### [`<BranchPrevious />`](https://ai-sdk.dev/elements/components/branch\#branchprevious-)

### \[...props\]:

React.ComponentProps<typeof Button>

Any other props are spread to the underlying shadcn/ui Button component.

### [`<BranchNext />`](https://ai-sdk.dev/elements/components/branch\#branchnext-)

### \[...props\]:

React.ComponentProps<typeof Button>

Any other props are spread to the underlying shadcn/ui Button component.

### [`<BranchPage />`](https://ai-sdk.dev/elements/components/branch\#branchpage-)

### \[...props\]:

React.HTMLAttributes<HTMLSpanElement>

Any other props are spread to the underlying span element.

On this page

[Branch](https://ai-sdk.dev/elements/components/branch#branch)

[Installation](https://ai-sdk.dev/elements/components/branch#installation)

[Usage](https://ai-sdk.dev/elements/components/branch#usage)

[Usage with AI SDK](https://ai-sdk.dev/elements/components/branch#usage-with-ai-sdk)

[Features](https://ai-sdk.dev/elements/components/branch#features)

[Props](https://ai-sdk.dev/elements/components/branch#props)

[<Branch />](https://ai-sdk.dev/elements/components/branch#branch-)

[<BranchMessages />](https://ai-sdk.dev/elements/components/branch#branchmessages-)

[<BranchSelector />](https://ai-sdk.dev/elements/components/branch#branchselector-)

[<BranchPrevious />](https://ai-sdk.dev/elements/components/branch#branchprevious-)

[<BranchNext />](https://ai-sdk.dev/elements/components/branch#branchnext-)

[<BranchPage />](https://ai-sdk.dev/elements/components/branch#branchpage-)

Elevate your AI applications with Vercel.

Trusted by OpenAI, Replicate, Suno, Pinecone, and more.

Vercel provides tools and infrastructure to deploy AI apps and features at scale.

[Talk to an expert](https://vercel.com/contact/sales?utm_source=ai_sdk&utm_medium=web&utm_campaign=contact_sales_cta&utm_content=talk_to_an_expert_sdk_docs)