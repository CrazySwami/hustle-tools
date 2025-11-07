/**
 * /api/chat - Proxy Route
 *
 * This route acts as a proxy to route requests to the correct endpoint based on
 * which page is making the request. This works around Vercel AI SDK v5 issue
 * where the `api` parameter in useChat() is sometimes ignored and defaults to /api/chat.
 *
 * Routing logic:
 * - If from /chat-doc or /chat-doc-editor → forward to /api/chat-doc
 * - Otherwise (elementor editor) → forward to /api/chat-elementor
 *
 * This is a temporary workaround until the SDK issue is resolved.
 * See: https://github.com/vercel/ai/issues/6866
 */

import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  // Determine target endpoint based on referer
  const referer = req.headers.get('referer') || '';
  let targetEndpoint = '/api/chat-elementor'; // Default to elementor
  
  // Check if request is from doc editor pages
  if (referer.includes('/chat-doc') || referer.includes('/chat-doc-editor')) {
    targetEndpoint = '/api/chat-doc';
    console.log('⚠️ /api/chat proxy hit - forwarding to /api/chat-doc (doc editor)');
  } else {
    console.log('⚠️ /api/chat proxy hit - forwarding to /api/chat-elementor (elementor editor)');
  }

  try {
    // Get the origin from the request
    const origin = req.headers.get('origin') || `${req.nextUrl.protocol}//${req.nextUrl.host}`;

    // Forward the request to the correct endpoint
    const targetUrl = new URL(targetEndpoint, origin);

    // Clone the request body
    const body = await req.text();

    // Create headers object, excluding host-related headers
    const headers = new Headers();
    req.headers.forEach((value, key) => {
      // Skip headers that shouldn't be forwarded
      if (!['host', 'connection', 'content-length'].includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });

    // Forward to the appropriate endpoint
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body,
    });

    console.log(`✅ Proxy forwarded successfully to ${targetEndpoint}`);

    // Return the response from the target endpoint
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (error) {
    console.error('❌ Proxy error:', error);
    return new Response(
      JSON.stringify({
        error: 'Proxy error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
