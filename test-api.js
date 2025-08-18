// Test script to debug tool calling API
const testWeatherAPI = async () => {
  console.log('🧪 Testing weather API call...');
  
  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            id: 'test-1',
            role: 'user',
            parts: [
              {
                type: 'text',
                text: 'What\'s the weather in Miami?'
              }
            ]
          }
        ],
        model: 'openai/gpt-4o',
        webSearch: false,
        enableReasoning: false,
        enableTools: true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ HTTP Error:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('✅ Response received, processing stream...');
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      
      // Process complete lines
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep incomplete line in buffer
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            console.log('🏁 Stream completed');
            continue;
          }
          
          try {
            const parsed = JSON.parse(data);
            console.log('📦 Received chunk:', JSON.stringify(parsed, null, 2));
          } catch (e) {
            console.log('📝 Raw data:', data);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

// Run the test
testWeatherAPI();
