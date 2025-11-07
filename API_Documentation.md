# API Documentation: Generate, Morph, and Edit Routes

This document provides an overview of the key API routes related to content generation, code morphing, and editing.

---

## 1. `/api/generate-project`

*   **Purpose**: Acts as a unified endpoint for generating various project types, such as HTML sections, Elementor widgets, and HubSpot modules.
*   **Vercel AI SDK**: It leverages the `streamText` function from the `ai` package to handle streaming responses from the language model.
*   **Streaming**: The route uses `result.toTextStreamResponse()` to efficiently stream the generated content back to the client, which is the recommended method for handling backpressure and streaming.
*   **LLM Interaction**: It calls the LLM via the `@ai-sdk/gateway`. The model is configurable in the request, with `anthropic/claude-sonnet-4-5-20250929` as the default. It dynamically retrieves the correct system prompt for the requested project type using a centralized `getProjectConfig` function.
*   **Multimodality**: The API supports vision capabilities by allowing image data to be passed along with the text description, which are then included in the message to the LLM.

---

## 2. `/api/generate-stylekit`

*   **Purpose**: A sophisticated, multi-stage API for generating comprehensive website style kits. The process is broken down into six sequential stages: Colors, Fonts, Headings, Components, Images/Layout, and Interactive States.
*   **Vercel AI SDK**: This route uses the `generateText` function from the `ai` package. It makes separate, non-streaming calls to the LLM at each of the six stages to get structured JSON data.
*   **Streaming**: It implements a custom streaming solution using a `ReadableStream` to send Server-Sent Events (SSE) back to the client. This provides real-time progress updates (e.g., "Stage 1: Generating colors...") rather than streaming the AI's raw output. The final result is delivered as a complete JSON object.
*   **LLM Interaction**: The route makes multiple calls to the LLM—one for each generation stage. It uses highly detailed and structured prompts for each stage, a strong example of advanced prompt engineering, to ensure the LLM returns valid JSON that conforms to a specific schema. It also maps user-friendly model names to their proper IDs for the AI Gateway.
*   **Workflow**: It can run all six stages for a full generation or run a single, specific stage if requested. The results from each stage are progressively merged into a final, complete style kit JSON object.

---

## 3. `/api/chat`

*   **Purpose**: This route functions as a **proxy** or a router. It does not contain any chat logic itself. Its sole responsibility is to forward incoming requests to the appropriate specialized chat endpoint (`/api/chat-doc` or `/api/chat-elementor`).
*   **Vercel AI SDK**: It does not directly use the Vercel AI SDK. It simply forwards the raw request, which was initiated by a `useChat` hook on the client.
*   **Streaming**: It fully supports streaming by piping the response body from the target endpoint directly back to the client without buffering.
*   **LLM Interaction**: It does not call any LLMs. This is handled by the downstream endpoints.
*   **Routing Logic**: It determines the origin of the request by inspecting the `referer` header and forwards it to the correct endpoint. The code comments note this is a workaround for a bug in the Vercel AI SDK where requests sometimes incorrectly default to `/api/chat`.

---

## 4. `/api/chat-elementor`

*   **Purpose**: This is the primary AI endpoint for the Elementor Editor, acting as the central "brain" for all code generation, editing, and analysis within that interface.
*   **Vercel AI SDK**: It makes extensive use of the Vercel AI SDK. It uses `streamText` for streaming AI responses and defines a suite of `tools` the AI can use, such as `editCodeWithMorph` and `validateWidget`. It returns data using `toUIMessageStreamResponse`, which allows it to stream rich UI data, including tool calls, reasoning steps, and custom metadata, back to the client.
*   **Streaming**: Yes, it streams responses. The use of `toUIMessageStreamResponse` is crucial for handling the complex, multi-part nature of the AI's output (text, tool calls, etc.).
*   **LLM Interaction**: It constructs a highly dynamic and detailed system prompt before calling the LLM. This prompt includes the user's current code, strict rules for generating Elementor widgets (like CSS scoping), and a decision tree guiding the AI on which tool to use. It also dynamically makes certain tools (like `validateWidget`) available only when relevant (e.g., when a PHP file is being edited).
*   **Token Management**: This route features an advanced token management system. It calculates the total prompt size before making the API call. If the size exceeds a certain threshold, it automatically triggers a conversation summarization or windowing strategy to fit within the model's context limit, preventing errors.

---

## 5. `/api/morph-apply`

*   **Purpose**: This route serves as the backend implementation for the `editCodeWithMorph` tool. It takes the original code and a "lazy edit" (a partial code snippet with markers) and merges them to produce a complete, updated file.
*   **Vercel AI SDK**: It does **not** use the Vercel AI SDK. It is a standard API route that is called by the `editCodeWithMorph` tool, which is in turn executed by the Vercel AI SDK in the `chat-elementor` endpoint.
*   **Streaming**: This is a standard, non-streaming API. It receives a request and returns a single JSON object containing the final merged code.
*   **LLM Interaction**: This route makes a direct, authenticated call to the external **Morph API** (`https://api.morphllm.com`). It uses the `morph-v3-fast` model, sending it the original code and the lazy edit within a specially formatted prompt. The Morph API is responsible for intelligently merging the changes.
*   **Functionality**: It acts as the bridge between the main chat AI (which generates the lazy edit) and the specialized Morph service (which performs the high-speed code merging). It also calculates and logs detailed performance and cost metrics for each Morph API call.

---

## 6. `/api/edit-code-stream`

*   **Purpose**: A direct, streaming API for AI-powered code modifications. This endpoint can either generate new code from scratch or, more importantly, create a standard **unified diff patch** to modify existing code based on a user's instruction.
*   **Vercel AI SDK**: It uses `streamText` and the `@ai-sdk/gateway` to stream the AI's response.
*   **Streaming**: Yes, this route streams its response. It also adds a custom validation layer by wrapping the AI's output in another `ReadableStream`. This allows it to validate the response in real-time and inject error or warning comments directly into the stream if the AI produces an empty or invalid output (e.g., a non-diff response in edit mode).
*   **LLM Interaction**: It dynamically selects the most appropriate AI model for a given task based on its complexity. It also employs a sophisticated caching strategy by sending the prompt in distinct, cacheable layers (system prompt, context files, current code), which significantly reduces token consumption on subsequent edits. The prompts are highly detailed and instruct the AI to output a unified diff for existing code.
*   **Functionality**: This route represents an alternative code editing strategy to the `morph-apply` endpoint. Instead of relying on a specialized merging API, it uses the LLM's ability to generate standard diff patches, which can then be applied to the original code on the client side.

---

## 7. `/api/edit-image-gemini`

*   **Purpose**: This route is dedicated to performing image-to-image editing tasks. It takes a reference image URL and a text prompt, and uses a Google Gemini model to generate a new, edited image.
*   **Vercel AI SDK**: It uses the `generateText` function and the `@ai-sdk/gateway` to call the Gemini model.
*   **Streaming**: This is a non-streaming API. It waits for the image generation to complete and then returns a single JSON response.
*   **LLM Interaction**: It specifically calls the `google/gemini-2.5-flash-image-preview` model. It sends a multimodal message containing both the reference image (as a base64 string) and the text-based editing instructions. It also uses `providerOptions` to inform the Google provider that it expects an image in the response.
*   **Functionality**: It handles fetching the reference image, converting it to base64, sending it to the AI, and then extracting the newly generated image from the AI's response. The final edited image is returned as a data URL.

---

## 8. `/api/generate-blog-plan`

*   **Purpose**: This route generates a monthly blog post content plan. It takes details about the blog's niche, target audience, and brand voice, and produces a specified number of post ideas.
*   **Vercel AI SDK**: It uses `streamText` and the `@ai-sdk/gateway` to stream the AI-generated content plan.
*   **Streaming**: Yes, this route streams the response directly to the client using `result.toTextStreamResponse()`.
*   **LLM Interaction**: It constructs a single, detailed prompt instructing the AI to generate a list of topics. It specifically asks the model to format each topic as a JSON object on a new line, a technique used to receive structured data over a stream without formal tool use. It uses a higher temperature (0.8) to encourage more creative and diverse topic ideas.
*   **Functionality**: It can be given a list of existing topics to avoid generating duplicate ideas. The route is also configured to run on the edge, which can improve performance.

---

## 9. `/api/generate-blog-post`

*   **Purpose**: This route generates a full-length blog post from a given topic and set of instructions. It's designed to produce structured, long-form content in Markdown format.
*   **Vercel AI SDK**: It uses `streamText` and the `@ai-sdk/gateway` to stream the generated article content.
*   **Streaming**: Yes, this route streams the response using `result.toTextStreamResponse()`, which is ideal for long-form content as the user can see the article being written in real-time.
*   **LLM Interaction**: It builds a comprehensive and dynamic prompt for the LLM, including the title, keywords, brand voice, target word count, and a structural outline based on the article's `contentType` (e.g., "how-to", "listicle"). It can also incorporate a research summary and sources into the prompt. It sets a high `maxTokens` limit and has a 5-minute timeout to allow for lengthy article generation.
*   **Functionality**: This endpoint acts as the second stage in a content creation pipeline, taking a plan (likely from `/api/generate-blog-plan`) and executing it to create a complete piece of content.

---

## 10. `/api/generate-css`

*   **Purpose**: A simple, non-streaming endpoint for generating a block of CSS code based on a user prompt and current style settings (fonts, colors).
*   **Vercel AI SDK**: It uses the `generateText` function to get a complete CSS code block from the AI model.
*   **Streaming**: No, this route is non-streaming. It waits for the full CSS to be generated and then returns it within a single JSON response.
*   **LLM Interaction**: It explicitly calls the `google/gemini-2.5-flash` model. The prompt provides the AI with the user's request and contextual style information, and includes specific requirements for the output, such as using CSS variables and returning only valid CSS code.
*   **Functionality**: This is a direct and simple implementation of using an LLM for a targeted code generation task.

---

## 11. `/api/generate-html-direct`

*   **Purpose**: A powerful "vision-to-code" endpoint that generates HTML, CSS, and JS from image mockups. It is designed to take visual designs for desktop, tablet, and mobile and translate them into functional code.
*   **Vercel AI SDK**: This route does **not** use the Vercel AI SDK. It makes a direct, manual `fetch` call to the OpenAI API endpoint.
*   **Streaming**: Yes, this route streams the response. It manually configures the OpenAI API call with `stream: true` and then forwards the raw `response.body` to the client.
*   **LLM Interaction**: It calls the OpenAI API directly, defaulting to the `gpt-5` model. It sends a multimodal message containing the image mockups and the user's text prompt. The system prompt is heavily engineered to force the model to return a single, raw JSON object with `html`, `css`, and `js` keys.
*   **Functionality**: This is a prime example of a direct, streaming, vision-to-code integration that bypasses helper libraries for a manual implementation.

---

## 12. `/api/generate-html-stream`

*   **Purpose**: A highly versatile, multi-modal code generation endpoint that can generate HTML, CSS, JS, or complete Elementor PHP widgets.
*   **Vercel AI SDK**: It uses `streamText` and the `@ai-sdk/gateway` for all AI interactions.
*   **Streaming**: Yes, this route streams its responses. It also uses a custom `ReadableStream` to append a final JSON object containing token usage data to the end of the stream, separated by a unique delimiter.
*   **LLM Interaction & Logic**: This route has multiple modes that change its behavior:
    *   **Section Mode**: Generates HTML, CSS, or JS. When generating CSS or JS, it intelligently includes the previously generated code in the prompt to provide context to the AI.
    *   **Widget Mode**: When generating a widget, it uses a massive, exceptionally detailed system prompt to guide the AI in creating a complete, production-ready Elementor widget PHP class, specifying everything from class structure to the exact UI controls required.
    *   **Quick-Widget Mode**: A hybrid approach where the AI generates the creative code (HTML/CSS/JS), which is then passed to a local, programmatic function (`convertToWidgetProgrammatic`) that reliably wraps it in the necessary PHP boilerplate. This is faster and more consistent than asking the AI to generate the full PHP class.
*   **Functionality**: This is a powerful, multi-purpose generator that intelligently switches between different generation strategies (full AI vs. hybrid) based on the user's selected mode.

---

## 13. `/api/generate-html`

*   **Purpose**: A "vision-to-code" generator that creates the structural and layout code (HTML/CSS/JS) from image mockups and a prompt. It is designed to work as part of a system where a separate "style kit" will be applied later.
*   **Vercel AI SDK**: It uses `streamText` and the `@ai-sdk/gateway` to stream the AI's response.
*   **Streaming**: Yes, this route streams a JSON object containing the `html`, `css`, and `js` keys.
*   **LLM Interaction**: It sends a multimodal message (images and text) to the AI. The system prompt is specifically engineered to instruct the model to **avoid** generating decorative styles like colors and fonts. Instead, it focuses on creating a clean, responsive layout and structure, using CSS variables as placeholders for stylistic values that will be provided by a style kit.
*   **Functionality**: This represents a more modular approach to code generation, separating the task of creating the code's structure from the task of applying a visual brand or style.

---

## 14. `/api/generate-image-gemini`

*   **Purpose**: A text-to-image generation endpoint that creates an image based on a user's text prompt using a Google Gemini model.
*   **Vercel AI SDK**: It uses the `generateText` function and the `@ai-sdk/gateway`.
*   **Streaming**: No, this is a non-streaming API. It waits for the image generation to complete and returns a single JSON response.
*   **LLM Interaction**: It calls a Gemini model capable of image generation (e.g., `gemini-2.5-flash-image-preview`). It uses a special `providerOptions` configuration to tell the Google provider that it expects an `IMAGE` in the response, in addition to text. The Vercel AI SDK then conveniently provides the generated image in the `result.files` array.
*   **Functionality**: This is a clear example of using the Vercel AI SDK for text-to-image generation. It receives a prompt, calls the AI, and returns the resulting image as a data URL.

---

## 15. `/api/generate-image-openai`

*   **Purpose**: A text-to-image generation endpoint that uses OpenAI models like DALL-E 3 to create an image from a user's text prompt.
*   **Vercel AI SDK**: It uses the experimental `generateImage` function from the `ai` package, which is specifically designed for image generation, along with the `@ai-sdk/openai` provider.
*   **Streaming**: No, this is a non-streaming API that returns a single JSON response after the image has been generated.
*   **LLM Interaction**: It calls an OpenAI image model (e.g., `dall-e-3`) and passes model-specific parameters like `quality` and `style` using the `providerOptions` object.
*   **Functionality**: This route demonstrates the use of the SDK's dedicated `generateImage` function. It takes a prompt, calls the OpenAI API, and returns the resulting image as a data URL.

---

## 16. `/api/generate-site-config`

*   **Purpose**: Generates a complete WordPress site configuration, including global settings (site title, tagline, timezone, etc.) and content for multiple pages (Home, About, Contact).
*   **Vercel AI SDK**: This route does **not** use the Vercel AI SDK. It uses the official `openai` npm package to make a direct call to the OpenAI API.
*   **Streaming**: No, this is a non-streaming API. It waits for the entire site configuration to be generated and returns it as a single JSON object.
*   **LLM Interaction**: It calls an OpenAI model (defaulting to `gpt-5`) and uses the `response_format: { type: 'json_object' }` parameter. This is OpenAI's "JSON Mode," which forces the model to output a syntactically correct JSON object, making it highly reliable for generating structured data.
*   **Functionality**: This is a powerful configuration generator that leverages a specific LLM feature (JSON Mode) to create a complex, nested JSON object containing a full site setup.

---

## 17. `/api/generate-tagline`

*   **Purpose**: A simple, focused endpoint for generating a short, catchy tagline for a company based on its name and description.
*   **Vercel AI SDK**: It uses the `generateText` function to get a short text response from the AI.
*   **Streaming**: No, this is a non-streaming API that returns a single JSON object containing the generated tagline.
*   **LLM Interaction**: It calls the `google/gemini-2.5-flash` model with a direct prompt asking for a tagline that meets specific constraints (e.g., concise, memorable, professional). It uses a higher temperature to encourage creativity.
*   **Functionality**: This is a clear example of using an LLM for a small, creative "micro-task."

---
