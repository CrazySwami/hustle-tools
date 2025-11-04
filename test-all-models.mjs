import fetch from 'node-fetch';

const testModels = ['gpt-5', 'gemini-2.5-flash', 'claude-haiku-4.5'];

async function testModel(model) {
  console.log(`\n🧪 Testing ${model}...`);
  
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
    const response = await fetch('http://localhost:3002/api/generate-stylekit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ ${model} failed:`, error);
      return false;
    }

    const data = await response.json();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    // Count fields
    const countFields = (obj, prefix = '') => {
      let count = 0;
      for (const key in obj) {
        const val = obj[key];
        if (val && typeof val === 'object' && !Array.isArray(val)) {
          count += countFields(val, `${prefix}${key}.`);
        } else if (Array.isArray(val)) {
          val.forEach((item, i) => {
            if (item && typeof item === 'object') {
              count += countFields(item, `${prefix}${key}.${i}.`);
            } else {
              count++;
            }
          });
        } else {
          count++;
        }
      }
      return count;
    };
    
    const fieldCount = countFields(data);
    console.log(`✅ ${model}: ${fieldCount} fields in ${duration}s`);
    return true;
  } catch (error) {
    console.error(`❌ ${model} error:`, error.message);
    return false;
  }
}

console.log('🚀 Testing all models for Style Kit generation\n');

for (const model of testModels) {
  await testModel(model);
}

console.log('\n✅ All model tests complete!');
