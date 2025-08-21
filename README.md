# Chat Application Architecture Guide

This document provides a comprehensive overview of the chat application's architecture, focusing on how to extend its capabilities by adding new tools and models. The system is built using the Vercel AI SDK, leveraging its powerful features for streaming, tool usage, and UI rendering.

## Core Components

- **Backend API (`src/app/api/chat/route.ts`)**: A serverless function that handles chat requests, communicates with the AI models via the AI Gateway, and manages tool execution.
- **Frontend Chat UI (`src/app/chat/page.tsx`)**: The main chat interface where users interact with the AI. It uses the Vercel AI SDK's `useChat` hook to manage state and render the conversation.
- **Tool Definitions (`src/lib/tools.ts`)**: A centralized file where all tools available to the AI are defined.
- **Tool Result Renderer (`src/components/tool-ui/tool-result-renderer.tsx`)**: A component that renders the output of a tool call. It can be extended to provide rich, custom UI for different tools.

---

## Backend: `src/app/api/chat/route.ts`

The backend is the brain of the operation. It receives messages from the client, processes them, and streams the AI's response back.

### Key Responsibilities:

1.  **Receiving Requests**: The `POST` handler extracts messages, the selected model, and other settings (like `enableTools`) from the request body.
2.  **Using the AI Gateway**: It uses `streamText` from the Vercel AI SDK to send the request to the appropriate AI model. The AI Gateway (`gateway` from `@ai-sdk/gateway`) handles the actual API calls to different model providers (OpenAI, Anthropic, etc.), which simplifies multi-provider support.
3.  **Tool Management**: It imports tools from `src/lib/tools.ts` and passes them to the `streamText` function. This makes the tools available for the AI to use.
4.  **Streaming Responses**: It uses `result.toUIMessageStreamResponse()` to stream the complete response—including text, tool calls, and tool results—back to the frontend.

### How to Add a New Tool

1.  **Define the Tool in `src/lib/tools.ts`**:
    Use the `tool` helper from the AI SDK. Define a `description`, an `inputSchema` using Zod, and an `execute` function.

    ```typescript
    // src/lib/tools.ts
    import { tool } from 'ai';
    import { z } from 'zod';

    export const tools = {
      // ... existing tools
      getStockPrice: tool({
        description: 'Get the current stock price for a given symbol.',
        inputSchema: z.object({ symbol: z.string() }),
        execute: async ({ symbol }) => {
          // Your logic to fetch the stock price
          const price = await fetchStockPrice(symbol);
          return { price };
        },
      }),
    };
    ```

2.  **(Optional) Create a Custom UI Widget**:
    If you want a rich UI for your tool's result (instead of raw JSON), you can create a new component (e.g., `stock-widget.tsx`).

3.  **Update the Renderer**:
    In `src/components/tool-ui/tool-result-renderer.tsx`, add a new `case` to the `switch` statement to render your new widget.

    ```tsx
    // src/components/tool-ui/tool-result-renderer.tsx
    import { StockWidget } from './stock-widget'; // Your new widget

    // ...
    switch (toolName) {
      // ... other cases
      case 'getStockPrice':
        return <StockWidget data={result} />;
      default:
        // ... fallback
    }
    ```

---

## Frontend: `src/app/chat/page.tsx`

The frontend provides the user interface and manages the conversation state.

### Key Features:

1.  **`useChat` Hook**: This hook from `@ai-sdk/react` is the core of the frontend. It handles:
    -   The list of messages.
    -   The user's input.
    -   Sending messages to the backend API.
    -   The streaming connection status (`status`).
2.  **Rendering Messages**: The component maps over the `messages` array. For each message, it then maps over the `parts` of that message.
3.  **Rendering Message Parts**: A `switch` statement checks the `type` of each part:
    -   `'text'`: Renders standard text content.
    -   `'tool-call'`: Renders the AI's request to use a tool, showing the tool name and parameters.
    -   `'tool-result'`: Renders the output from the tool. This is where the `<ToolResultRenderer>` is used to display either a custom widget or the raw JSON.

### How to Add a New Chat Model

Adding a new model is simple and doesn't require backend changes, thanks to the AI Gateway.

1.  **Add the Model to the List**:
    In `src/app/chat/page.tsx`, find the `modelGroups` array and add your new model to the appropriate provider group.

    ```tsx
    // src/app/chat/page.tsx

    const modelGroups: ModelGroup[] = [
      {
        provider: 'OpenAI',
        models: [
          // ... existing models
          { name: 'My New Model', value: 'openai/my-new-model' },
        ]
      },
      // ... other providers
    ];
    ```

The `value` should be the model identifier that the Vercel AI Gateway recognizes. The new model will automatically appear in the model selection dropdown in the UI.

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm, yarn, or pnpm
- A Firecrawl API key (get one from [firecrawl.dev](https://firecrawl.dev))
- Vercel AI Gateway API key (for AI chat functionality)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd hustle-tools
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up your environment variables:**

    Create a file named `.env.local` in the root of the project and add your API keys:

    ```
    FIRECRAWL_API_KEY=your_firecrawl_api_key_here
    AI_GATEWAY_API_KEY=your_vercel_ai_gateway_key_here
    ```

4.  **Run the development server:**

    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## How to Use

1.  Navigate to the **Firecrawl App** from the homepage.
2.  **Map a Site**: Enter a URL to get a list of all discoverable pages on that site.
3.  **Scrape Pages**: Use the list of mapped URLs (or paste your own) to scrape the content. The app uses Firecrawl's batch scraping API to efficiently process multiple URLs.
4.  **Download**: Once the scraping is complete, you can download the content as individual Markdown files or as a single combined document.

## Features and Tools

### Firecrawl Site Crawler

A tool for mapping and scraping website content:

1.  **Map a Site**: Enter a URL to get a list of all discoverable pages on that site.
2.  **Scrape Pages**: Use the list of mapped URLs (or paste your own) to scrape the content.
3.  **Download**: Once the scraping is complete, you can download the content as individual Markdown files or as a single combined document.

### AI Chat Interface

An interactive chat interface powered by the Vercel AI SDK:

1.  **Multiple Models**: Choose from various AI models including OpenAI, Anthropic, Google, and Perplexity.
2.  **Web Search**: Enable web search capabilities with Perplexity models.
3.  **Source Citations**: View source citations for responses when using web search.
4.  **Markdown Support**: Rich text formatting with code highlighting.

### Image Alterations

A tool for image manipulation and generation:

1.  **Upload Images**: Upload your own images for alteration.
2.  **Apply Effects**: Choose from various image processing options.
3.  **Download Results**: Save the altered images.

## Technical Documentation

The project includes comprehensive documentation for all major components:

### Core Documentation

- [**UI Stack Documentation**](./docs/ui-stack.md) - Overview of UI libraries, components, and layout guidelines used in the project.
- [**Firecrawl Documentation**](./docs/fire-crawl-docs.md) - Technical details of the Firecrawl integration, API routes, and frontend implementation.
- [**AI Chat Integration Guide**](./docs/ai-chat-integration.md) - Comprehensive guide to the AI chat implementation, including backend API, frontend components, and integration with the Vercel AI SDK.
- [**Models Reference**](./docs/models.md) - List of supported AI models and their configurations.

### Vercel AI SDK Documentation

The `/docs/vercel-ai-sdk-ui-docs/` directory contains detailed documentation for the Vercel AI SDK Elements:

- [**Overview**](./docs/vercel-ai-sdk-ui-docs/ai-sdk_dev_elements_overview.md) - Introduction to the AI SDK Elements.
- [**Components**](./docs/vercel-ai-sdk-ui-docs/ai-sdk_dev_elements_components.md) - Reference for all UI components.
- [**Examples**](./docs/vercel-ai-sdk-ui-docs/ai-sdk_dev_elements_examples.md) - Example implementations including chatbots.
- [**Setup Guide**](./docs/vercel-ai-sdk-ui-docs/ai-sdk_dev_elements_overview_setup.md) - How to set up the AI SDK.
- [**Troubleshooting**](./docs/vercel-ai-sdk-ui-docs/ai-sdk_dev_elements_overview_troubleshooting.md) - Common issues and solutions.

## Project Structure

- `/src/app/` - Next.js app router pages
  - `/chat/` - AI chat interface
  - `/firecrawl/` - Site crawler interface
  - `/image-alterations/` - Image processing tools
- `/src/components/` - Reusable React components
  - `/ai-elements/` - Custom AI UI components
  - `/ui/` - Shadcn UI components
- `/docs/` - Project documentation
- `/public/` - Static assets

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
