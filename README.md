# Hustle Tools - Firecrawl Site Crawler

This is a Next.js application that provides a simple interface to interact with the Firecrawl API. It allows you to map all the pages on a given website and then scrape the content of those pages into Markdown format.

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
