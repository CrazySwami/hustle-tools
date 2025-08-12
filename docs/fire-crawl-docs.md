# Technical Documentation: Firecrawl Integration

This document provides a technical overview of the Firecrawl API integration within the Hustle Tools application.

## Overview

The integration is designed to provide a user-friendly interface for two main Firecrawl features:

1.  **Site Mapping**: Discovering all accessible URLs on a given website.
2.  **Batch Scraping**: Extracting content from multiple URLs in Markdown format efficiently.

To avoid hitting API rate limits on Firecrawl's free tier, the application uses the batch scraping endpoint, which processes multiple URLs in a single asynchronous job.

## Backend API Routes

The Next.js backend uses API routes to securely handle communication with the Firecrawl API. The Firecrawl API key is stored as an environment variable (`FIRECRAWL_API_KEY`) on the server and is never exposed to the client.

### 1. `POST /api/map`

This route acts as a proxy to Firecrawl's `/v1/map` endpoint.

-   **Purpose**: To get a list of all URLs on a given website.
-   **Request Body**: `{ "url": "<string>", "includeSubdomains": <boolean>, "limit": <number> }`
-   **Response**: On success, returns a JSON object `{ success: true, links: ["<url1>", "<url2>"] }`.

### 2. `POST /api/batch-scrape/start`

This route initiates a batch scraping job with Firecrawl.

-   **Purpose**: To start a new job for scraping multiple URLs.
-   **Request Body**: `{ "urls": ["<url1>", "<url2>"] }` or a newline-separated string of URLs.
-   **Response**: On success, returns the response from Firecrawl, which includes a `jobId` for the newly created job: `{ success: true, id: "<jobId>" }`.

### 3. `GET /api/batch-scrape/status/[jobId]`

This dynamic route checks the status of an ongoing batch scrape job.

-   **Purpose**: To poll for the progress and results of a batch job.
-   **URL Parameter**: `jobId` - The ID of the batch job to check.
-   **Response**: Returns the status object from Firecrawl, which includes the job's `status` (`pending`, `completed`, `failed`), progress (`completed` vs. `total`), and the resulting `data` when the job is complete.

## Frontend Implementation (`/firecrawl`)

The client-side application, built with React and TypeScript, manages the user interaction and data flow.

-   **State Management**: Uses React's `useState` hook to manage UI state, including user inputs, job status, polling, and results.
-   **Workflow**:
    1.  The user submits a list of URLs to be scraped.
    2.  The `handleBatchScrape` function is called, which sends a request to `/api/batch-scrape/start`.
    3.  Upon receiving a `jobId`, the application begins polling the `/api/batch-scrape/status/[jobId]` endpoint.
    4.  The polling interval is set to 15 seconds to stay within Firecrawl's API rate limits.
    5.  The UI is updated in real-time to show the job's status and progress.
    6.  When the job is `completed`, the results are processed and displayed, with options to download the scraped Markdown content.

This architecture ensures a robust and efficient scraping process that respects API limits while providing a good user experience.
