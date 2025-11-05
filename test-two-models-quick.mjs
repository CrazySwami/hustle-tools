import fetch from 'node-fetch';

const testModels = ['gemini-2.5-flash', 'claude-haiku-4.5'];

async function testModelQuick(model) {
  console.log(`\n🧪 Testing ${model} (Stage 1 only)...`);
  
  const payload = {
    model,
    brandfetchData: {
      colors: ['#0066CC', '#FF6B35'],
      fonts: ['Inter', 'Roboto']
    },
    stylePreferences: 'Modern tech design',
    industry: 'Technology'
  };

  try {
    const startTime = Date.now();
    const response = await fetch('http://localhost:3000/api/generate-stylekit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ ${model} failed after ${duration}s:`, error.substring(0, 200));
      return false;
    }

    const data = await response.json();
    
    // Quick field count
    const fieldCount = JSON.stringify(data).split('"').length;
    console.log(`✅ ${model}: Success in ${duration}s (~${fieldCount} fields)`);
    
    // Show color generation worked
    if (data.system_colors) {
      console.log(`   Colors generated: ${data.system_colors.length} colors`);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ ${model} error:`, error.message);
    return false;
  }
}

console.log('🚀 Quick test: Gemini & Claude (Stage 1 color generation)\n');

for (const model of testModels) {
  await testModelQuick(model);
}

console.log('\n✅ Quick test complete!');
