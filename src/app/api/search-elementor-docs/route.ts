// Vector Store Search API for Elementor Documentation
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return Response.json({ error: 'No query provided' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const vectorStoreId = 'vs_68e7e1eac024819185c1a822d78d19f4';

    // Create a thread for this search
    console.log('🔍 Creating thread for vector store search...');
    const threadResponse = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({}),
    });

    if (!threadResponse.ok) {
      const error = await threadResponse.json();
      console.error('Failed to create thread:', error);
      return Response.json({ error: 'Failed to create thread' }, { status: 500 });
    }

    const thread = await threadResponse.json();
    console.log(`✅ Thread created: ${thread.id}`);

    // Add message to thread
    console.log('💬 Adding search query to thread...');
    const messageResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        role: 'user',
        content: `Search the Elementor documentation for: ${query}\n\nProvide detailed information about widgets, properties, settings, and examples. Be very thorough and verbose.`,
      }),
    });

    if (!messageResponse.ok) {
      const error = await messageResponse.json();
      console.error('Failed to add message:', error);
      return Response.json({ error: 'Failed to add message' }, { status: 500 });
    }

    console.log('✅ Query added to thread');

    // Run assistant with vector store
    console.log('🤖 Running assistant with vector store...');
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        assistant_id: 'asst_cNXLjNGQpF5dr3fIt57EfHIA',
        model: 'gpt-4o',
        tools: [{ type: 'file_search' }],
        tool_resources: {
          file_search: {
            vector_store_ids: [vectorStoreId],
          },
        },
      }),
    });

    if (!runResponse.ok) {
      const error = await runResponse.json();
      console.error('Failed to run assistant:', error);
      return Response.json({ error: 'Failed to run assistant' }, { status: 500 });
    }

    const run = await runResponse.json();
    console.log(`✅ Run started: ${run.id}`);

    // Poll for completion
    let runStatus = run.status;
    let attempts = 0;
    const maxAttempts = 60;

    while (runStatus !== 'completed' && runStatus !== 'failed' && attempts < maxAttempts) {
      console.log(`⏳ Run status: ${runStatus} (attempt ${attempts + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 1000));

      const statusResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs/${run.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'OpenAI-Beta': 'assistants=v2',
        },
      });

      if (!statusResponse.ok) {
        console.error('Failed to check status');
        break;
      }

      const statusData = await statusResponse.json();
      runStatus = statusData.status;
      attempts++;
    }

    if (runStatus !== 'completed') {
      console.error(`❌ Run failed with status: ${runStatus}`);
      return Response.json({ error: `Search timed out or failed: ${runStatus}` }, { status: 500 });
    }

    console.log('✅ Run completed successfully');

    // Get messages from thread
    console.log('📨 Retrieving search results...');
    const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'OpenAI-Beta': 'assistants=v2',
      },
    });

    if (!messagesResponse.ok) {
      const error = await messagesResponse.json();
      console.error('Failed to get messages:', error);
      return Response.json({ error: 'Failed to retrieve results' }, { status: 500 });
    }

    const messagesData = await messagesResponse.json();
    const assistantMessages = messagesData.data.filter((m: any) => m.role === 'assistant');

    if (assistantMessages.length === 0) {
      return Response.json({ error: 'No results found' }, { status: 404 });
    }

    // Extract text content from the latest assistant message
    const latestMessage = assistantMessages[0];
    const textContent = latestMessage.content
      .filter((c: any) => c.type === 'text')
      .map((c: any) => c.text.value)
      .join('\n\n');

    console.log('✅ Search results retrieved successfully');

    return Response.json({
      success: true,
      results: textContent,
      threadId: thread.id,
      runId: run.id,
    });

  } catch (error: any) {
    console.error('❌ Vector store search error:', error);
    return Response.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
