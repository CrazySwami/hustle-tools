# Hustle Tools - Firecrawl Site Crawler

This is a Next.js application that provides a simple interface to interact with the Firecrawl API. It allows you to map all the pages on a given website and then scrape the content of those pages into Markdown format.

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm, yarn, or pnpm
- A Firecrawl API key (get one from [firecrawl.dev](https://firecrawl.dev))

### Installation

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd site-crawler
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up your environment variables:**

    Create a file named `.env.local` in the root of the project and add your Firecrawl API key:

    ```
    FIRECRAWL_API_KEY=your_firecrawl_api_key_here
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

## Technical Documentation

For a detailed technical overview of the Firecrawl integration, including information about the API routes and frontend implementation, please see the [technical documentation](./docs/fire-crawl-docs.md).

For an overview of the UI libraries and key components used in this project, see the [UI Stack documentation](./docs/ui-stack.md).

