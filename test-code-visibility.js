/**
 * Test Script: Verify AI Can See Code in System Prompt
 *
 * This script tests if the AI can see code files when Context toggle is enabled.
 * It simulates sending a chat message with currentSection data.
 */

const AI_GATEWAY_API_KEY = process.env.AI_GATEWAY_API_KEY;

if (!AI_GATEWAY_API_KEY) {
  console.error('❌ ERROR: AI_GATEWAY_API_KEY not found in environment variables');
  console.error('Please set AI_GATEWAY_API_KEY in your .env.local file');
  process.exit(1);
}

// Test data: currentSection with HTML/CSS/JS/PHP
const testSection = {
  name: 'Test Hero Section',
  html: '<section class="hero">\n  <h1>Welcome to Our Site</h1>\n  <p>This is a test section</p>\n</section>',
  css: '.hero {\n  padding: 100px 20px;\n  text-align: center;\n  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n  color: white;\n}\n\n.hero h1 {\n  font-size: 48px;\n  margin-bottom: 20px;\n}',
  js: 'console.log("Hero section loaded");\n\ndocument.querySelector(".hero h1").addEventListener("click", () => {\n  alert("Title clicked!");\n});',
  php: '<?php\n// WordPress integration code\nfunction register_hero_section() {\n  // Registration logic\n}\nadd_action("init", "register_hero_section");\n?>'
};

async function testCodeVisibility() {
  console.log('🧪 Testing Code Visibility in AI System Prompt\n');
  console.log('═'.repeat(60));

  // Test 1: With Context Enabled
  console.log('\n📋 TEST 1: Context Toggle ENABLED (includeContext = true)');
  console.log('─'.repeat(60));

  const testWithContext = await fetch('http://localhost:3000/api/get-system-prompt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4-5-20250929',
      webSearch: false,
      includeContext: true,  // ✅ ENABLED
      currentSection: testSection,
    }),
  });

  const resultWithContext = await testWithContext.json();

  console.log('\n✅ Results:');
  console.log(`   Total Characters: ${resultWithContext.stats.totalChars.toLocaleString()}`);
  console.log(`   Estimated Tokens: ~${resultWithContext.stats.estimatedTokens.toLocaleString()}`);
  console.log(`   HTML Size: ${resultWithContext.stats.htmlChars} chars`);
  console.log(`   CSS Size: ${resultWithContext.stats.cssChars} chars`);
  console.log(`   JS Size: ${resultWithContext.stats.jsChars} chars`);
  console.log(`   PHP Size: ${resultWithContext.stats.phpChars} chars`);

  // Check if code is visible in prompt
  const hasHtml = resultWithContext.systemPrompt.includes('<section class="hero">');
  const hasCss = resultWithContext.systemPrompt.includes('.hero {');
  const hasJs = resultWithContext.systemPrompt.includes('console.log("Hero section loaded")');
  const hasPhp = resultWithContext.systemPrompt.includes('<?php');
  const hasCheckmark = resultWithContext.systemPrompt.includes('✅ **YES - You have full access');

  console.log('\n🔍 Code Visibility Check:');
  console.log(`   ${hasCheckmark ? '✅' : '❌'} System prompt shows "YES - You have full access"`);
  console.log(`   ${hasHtml ? '✅' : '❌'} HTML code is visible`);
  console.log(`   ${hasCss ? '✅' : '❌'} CSS code is visible`);
  console.log(`   ${hasJs ? '✅' : '❌'} JS code is visible`);
  console.log(`   ${hasPhp ? '✅' : '❌'} PHP code is visible`);

  // Test 2: With Context Disabled
  console.log('\n\n📋 TEST 2: Context Toggle DISABLED (includeContext = false)');
  console.log('─'.repeat(60));

  const testWithoutContext = await fetch('http://localhost:3000/api/get-system-prompt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4-5-20250929',
      webSearch: false,
      includeContext: false,  // ❌ DISABLED
      currentSection: testSection,
    }),
  });

  const resultWithoutContext = await testWithoutContext.json();

  console.log('\n✅ Results:');
  console.log(`   Total Characters: ${resultWithoutContext.stats.totalChars.toLocaleString()}`);
  console.log(`   Estimated Tokens: ~${resultWithoutContext.stats.estimatedTokens.toLocaleString()}`);
  console.log(`   HTML Size: ${resultWithoutContext.stats.htmlChars} chars (should be 0)`);
  console.log(`   CSS Size: ${resultWithoutContext.stats.cssChars} chars (should be 0)`);
  console.log(`   JS Size: ${resultWithoutContext.stats.jsChars} chars (should be 0)`);
  console.log(`   PHP Size: ${resultWithoutContext.stats.phpChars} chars (should be 0)`);

  const hasNoCode = !resultWithoutContext.systemPrompt.includes('<section class="hero">');
  const hasXMark = resultWithoutContext.systemPrompt.includes('❌ NO - No section currently loaded');

  console.log('\n🔍 Code Visibility Check:');
  console.log(`   ${hasXMark ? '✅' : '❌'} System prompt shows "NO - No section currently loaded"`);
  console.log(`   ${hasNoCode ? '✅' : '❌'} Code is NOT visible (as expected)`);

  // Test 3: Real Chat Request Simulation
  console.log('\n\n📋 TEST 3: Simulating Real Chat Message');
  console.log('─'.repeat(60));
  console.log('Sending: "can you see my code"');

  const chatTest = await fetch('http://localhost:3000/api/chat-elementor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { id: '1', role: 'user', content: 'can you see my code' }
      ],
      model: 'anthropic/claude-haiku-4-5-20251001', // Use Haiku for speed
      includeContext: true,
      currentSection: testSection,
    }),
  });

  console.log('\n✅ Chat Request Status:', chatTest.status, chatTest.statusText);

  if (chatTest.ok) {
    console.log('✅ Chat API is working!');
    console.log('\n📝 Expected AI Response:');
    console.log('   "Yes, I can see your HTML/CSS/JS/PHP code"');
    console.log('   Should reference specific content from files');
  } else {
    console.log('❌ Chat API failed');
  }

  // Final Summary
  console.log('\n\n' + '═'.repeat(60));
  console.log('📊 SUMMARY');
  console.log('═'.repeat(60));

  const allTestsPassed =
    hasCheckmark && hasHtml && hasCss && hasJs && hasPhp && // Test 1
    hasXMark && hasNoCode && // Test 2
    chatTest.ok; // Test 3

  if (allTestsPassed) {
    console.log('✅ ALL TESTS PASSED! The AI CAN see code when Context is enabled.');
  } else {
    console.log('❌ SOME TESTS FAILED. Check the details above.');
  }

  console.log('\n💡 To test in browser:');
  console.log('   1. Open: http://localhost:3000/elementor-editor');
  console.log('   2. Type code in Monaco editor (HTML/CSS/JS/PHP tabs)');
  console.log('   3. Ask in chat: "can you see my code"');
  console.log('   4. AI should say "Yes" and reference your code');
  console.log('   5. Click "Prompt" button to view full system prompt');
  console.log('\n');
}

// Run the test
testCodeVisibility().catch((error) => {
  console.error('\n❌ TEST FAILED WITH ERROR:');
  console.error(error);
  process.exit(1);
});
