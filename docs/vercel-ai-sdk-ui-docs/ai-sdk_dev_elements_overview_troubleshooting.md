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

# [Troubleshooting](https://ai-sdk.dev/elements/overview/troubleshooting\#troubleshooting)

## [Why are my components not styled?](https://ai-sdk.dev/elements/overview/troubleshooting\#why-are-my-components-not-styled)

Make sure your project is configured correctly for shadcn/ui in Tailwind 4 - this means having a `globals.css` file that imports Tailwind and includes the shadcn/ui base styles.

## [I ran the AI Elements CLI but nothing was added to my project](https://ai-sdk.dev/elements/overview/troubleshooting\#i-ran-the-ai-elements-cli-but-nothing-was-added-to-my-project)

Double-check that:

- Your current working directory is the root of your project (where `package.json` lives).
- Your components.json file (if using shadcn-style config) is set up correctly.
- You’re using the latest version of the AI Elements CLI:

```code-block_code__yIKW2

npx ai-elements@latest
```

If all else fails, feel free to open an [issue on GitHub](https://github.com/vercel/ai/issues).

## [Theme switching doesn’t work — my app stays in light mode](https://ai-sdk.dev/elements/overview/troubleshooting\#theme-switching-doesnt-work--my-app-stays-in-light-mode)

Ensure your app is using the same data-theme system that shadcn/ui and AI Elements expect. The default implementation toggles a data-theme attribute on the `<html>` element. Make sure your tailwind.config.js is using class or data- selectors accordingly:

## [The component imports fail with “module not found”](https://ai-sdk.dev/elements/overview/troubleshooting\#the-component-imports-fail-with-module-not-found)

Check the file exists. If it does, make sure your `tsconfig.json` has a proper paths alias for `@/` i.e.

```code-block_code__yIKW2

{

  "compilerOptions": {

    "baseUrl": ".",

    "paths": {

      "@/*": ["./*"]

    }

  }

}
```

## [My AI coding assistant can't access AI Elements components](https://ai-sdk.dev/elements/overview/troubleshooting\#my-ai-coding-assistant-cant-access-ai-elements-components)

1. Verify your config file syntax is valid JSON.
2. Check that the file path is correct for your AI tool.
3. Restart your coding assistant after making changes.
4. Ensure you have a stable internet connection.

## [Still stuck?](https://ai-sdk.dev/elements/overview/troubleshooting\#still-stuck)

If none of these answers help, open an [issue on GitHub](https://github.com/vercel/ai/issues) and someone will be happy to assist.

On this page

[Troubleshooting](https://ai-sdk.dev/elements/overview/troubleshooting#troubleshooting)

[Why are my components not styled?](https://ai-sdk.dev/elements/overview/troubleshooting#why-are-my-components-not-styled)

[I ran the AI Elements CLI but nothing was added to my project](https://ai-sdk.dev/elements/overview/troubleshooting#i-ran-the-ai-elements-cli-but-nothing-was-added-to-my-project)

[Theme switching doesn’t work — my app stays in light mode](https://ai-sdk.dev/elements/overview/troubleshooting#theme-switching-doesnt-work--my-app-stays-in-light-mode)

[The component imports fail with “module not found”](https://ai-sdk.dev/elements/overview/troubleshooting#the-component-imports-fail-with-module-not-found)

[My AI coding assistant can't access AI Elements components](https://ai-sdk.dev/elements/overview/troubleshooting#my-ai-coding-assistant-cant-access-ai-elements-components)

[Still stuck?](https://ai-sdk.dev/elements/overview/troubleshooting#still-stuck)

Elevate your AI applications with Vercel.

Trusted by OpenAI, Replicate, Suno, Pinecone, and more.

Vercel provides tools and infrastructure to deploy AI apps and features at scale.

[Talk to an expert](https://vercel.com/contact/sales?utm_source=ai_sdk&utm_medium=web&utm_campaign=contact_sales_cta&utm_content=talk_to_an_expert_sdk_docs)