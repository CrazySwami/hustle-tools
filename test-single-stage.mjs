import fetch from 'node-fetch';

console.log('🧪 Testing Stage 1 (Colors) generation\n');

const payload = {
  model: 'gpt-5',
  brandfetchData: {
    colors: ['#0066CC', '#FF6B35', '#28A745'],
    fonts: ['Inter', 'Roboto']
  },
  stylePreferences: 'Modern tech design',
  industry: 'Technology',
  stage: 1  // Only generate Stage 1 (Colors)
};

console.log('📤 Request payload:');
console.log(JSON.stringify(payload, null, 2));
console.log('\n⏳ Calling API...\n');

try {
  const response = await fetch('http://localhost:3000/api/generate-stylekit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ API Error:', error);
    process.exit(1);
  }

  // Read the SSE stream
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finalData = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));

        if (data.error) {
          console.error('❌ Error:', data.error);
          process.exit(1);
        }

        if (data.message) {
          console.log(`📊 Progress: Stage ${data.stage} - ${data.message}`);
        }

        if (data.styleKit) {
          finalData = data.styleKit;
        }
      }
    }
  }

  if (finalData) {
    console.log('\n✅ Generation complete!\n');
    console.log('📦 Generated StyleKit structure:');
    console.log('=====================================\n');

    // Show the complete structure
    console.log('Full JSON:');
    console.log(JSON.stringify(finalData, null, 2));

    console.log('\n=====================================\n');
    console.log('📊 Field breakdown:');
    console.log('- title:', finalData.title || 'NOT SET');
    console.log('- system_colors:', finalData.system_colors?.length || 0, 'colors');
    if (finalData.system_colors?.length > 0) {
      finalData.system_colors.forEach((color, i) => {
        console.log('  ' + (i + 1) + '. ' + color._id + ': ' + color.color);
      });
    }
    console.log('- custom_colors:', finalData.custom_colors?.length || 0, 'colors');
    console.log('- system_typography:', finalData.system_typography?.length || 0, 'presets');
    console.log('- custom_typography:', finalData.custom_typography?.length || 0, 'presets');

    console.log('\n🎯 Expected by StyleKit Editor:');
    console.log('- system_colors[].color (hex value)');
    console.log('- system_colors[]._id (primary, secondary, text, accent)');
    console.log('- title (string)');

    console.log('\n✨ Test complete!');
  } else {
    console.log('❌ No data received from API');
  }
} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error(error);
  process.exit(1);
}
