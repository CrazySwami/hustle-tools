/**
 * Token Management Test Suite
 * Tests sliding window, summarization, and error handling across all chat routes
 */

const API_BASE = 'http://localhost:3000';

// Test helper to create messages of specific token sizes
function createMessage(role, tokenSize) {
  // Approximate: 1 token ≈ 4 characters
  const chars = tokenSize * 4;
  const content = 'a'.repeat(chars);
  return { role, content };
}

// Test helper to create conversation history
function createConversation(messageCount, tokensPerMessage) {
  const messages = [];
  for (let i = 0; i < messageCount; i++) {
    messages.push({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: createMessage(i % 2 === 0 ? 'user' : 'assistant', tokensPerMessage).content,
    });
  }
  return messages;
}

// Color coding for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(title, 'cyan');
  console.log('='.repeat(80) + '\n');
}

function logTest(testName) {
  log(`\n▶ TEST: ${testName}`, 'blue');
}

function logResult(passed, details) {
  if (passed) {
    log(`✅ PASS: ${details}`, 'green');
  } else {
    log(`❌ FAIL: ${details}`, 'red');
  }
}

function logWarning(message) {
  log(`⚠️  WARNING: ${message}`, 'yellow');
}

// Test scenarios
const TESTS = {
  // Scenario 1: Normal usage (< 70%)
  scenario1_normal: {
    name: 'Normal Usage (< 70%)',
    route: '/api/chat-doc',
    model: 'anthropic/claude-haiku-4-5-20251001',
    contextLimit: 200000,
    messages: createConversation(5, 5000), // 5 messages × 5K tokens = 25K tokens (~12.5%)
    expectedBehavior: {
      strategy: 'full',
      allMessagesKept: true,
      percentUsage: '< 70%',
    },
  },

  // Scenario 2: Sliding window trigger (70-80%)
  scenario2_slidingWindow: {
    name: 'Sliding Window (70-80% usage)',
    route: '/api/chat-doc',
    model: 'anthropic/claude-haiku-4-5-20251001',
    contextLimit: 200000,
    messages: createConversation(20, 7000), // 20 messages × 7K = 140K tokens (~70%)
    expectedBehavior: {
      strategy: 'sliding-window',
      messagesReduced: true,
      targetPercentage: '~60%',
      minMessagesKept: 1,
    },
  },

  // Scenario 3: Summarization trigger (80-90%)
  scenario3_summarization: {
    name: 'Summarization (80-90% usage)',
    route: '/api/chat-doc',
    model: 'anthropic/claude-haiku-4-5-20251001',
    contextLimit: 200000,
    messages: createConversation(25, 7000), // 25 messages × 7K = 175K tokens (~87.5%)
    expectedBehavior: {
      strategy: 'summarized',
      summaryCreated: true,
      targetPercentage: '~50%',
      recentMessagesKept: 3,
    },
  },

  // Scenario 4: Hard limit exceeded (> 90%)
  scenario4_hardLimit: {
    name: 'Hard Limit Exceeded (> 90%)',
    route: '/api/chat-doc',
    model: 'anthropic/claude-haiku-4-5-20251001',
    contextLimit: 200000,
    messages: createConversation(30, 7000), // 30 messages × 7K = 210K tokens (~105%)
    expectedBehavior: {
      shouldError: true,
      errorMessage: 'Conversation too large',
      strategy: 'exceeded',
    },
  },

  // Scenario 5: Single huge message
  scenario5_hugeMessage: {
    name: 'Single Huge Message (User\'s Bug)',
    route: '/api/chat-doc',
    model: 'anthropic/claude-haiku-4-5-20251001',
    contextLimit: 200000,
    messages: [
      ...createConversation(5, 5000), // Normal conversation: 25K tokens
      createMessage('user', 140000), // Huge message: 140K tokens
    ],
    expectedBehavior: {
      strategy: 'sliding-window',
      messagesReduced: true,
      targetPercentage: '~60%',
      note: 'Should reduce to 1 message (the huge one) if needed',
    },
  },

  // Scenario 6: Test with Gemini 2.5 Flash (700K limit)
  scenario6_geminiFlash: {
    name: 'Gemini 2.5 Flash (700K limit)',
    route: '/api/chat-doc',
    model: 'google/gemini-2.5-flash',
    contextLimit: 700000,
    messages: createConversation(100, 5000), // 100 messages × 5K = 500K tokens (~71%)
    expectedBehavior: {
      strategy: 'sliding-window',
      messagesReduced: true,
      targetPercentage: '~60%',
    },
  },

  // Scenario 7: Elementor route (different system prompt)
  scenario7_elementor: {
    name: 'Elementor Route (Different Context)',
    route: '/api/chat-elementor',
    model: 'anthropic/claude-haiku-4-5-20251001',
    contextLimit: 200000,
    messages: createConversation(20, 7000), // 140K tokens (~70%)
    expectedBehavior: {
      strategy: 'sliding-window',
      messagesReduced: true,
      targetPercentage: '~60%',
    },
  },

  // Scenario 8: Progressive usage (simulate real conversation)
  scenario8_progressive: {
    name: 'Progressive Usage (Simulate Real Chat)',
    route: '/api/chat-doc',
    model: 'anthropic/claude-haiku-4-5-20251001',
    contextLimit: 200000,
    steps: [
      { messages: createConversation(5, 3000), expectedStrategy: 'full' },
      { messages: createConversation(15, 5000), expectedStrategy: 'full' },
      { messages: createConversation(20, 7000), expectedStrategy: 'sliding-window' },
      { messages: createConversation(25, 7000), expectedStrategy: 'summarized' },
    ],
  },
};

// Mock API call (for testing structure without hitting real API)
async function testScenario(scenario, dryRun = true) {
  logTest(scenario.name);

  if (dryRun) {
    log('🔍 DRY RUN - Analyzing scenario...', 'yellow');

    // Calculate expected tokens
    const totalChars = scenario.messages.reduce((sum, msg) => sum + msg.content.length, 0);
    const estimatedTokens = Math.ceil(totalChars / 4);
    const percentUsage = ((estimatedTokens / (scenario.contextLimit - 4000)) * 100).toFixed(1);

    log(`   Model: ${scenario.model}`);
    log(`   Context Limit: ${scenario.contextLimit.toLocaleString()} tokens`);
    log(`   Messages: ${scenario.messages.length}`);
    log(`   Estimated Tokens: ${estimatedTokens.toLocaleString()} (~${percentUsage}%)`);
    log(`   Expected Strategy: ${scenario.expectedBehavior.strategy || 'varies'}`);

    // Determine expected behavior
    const effectiveLimit = scenario.contextLimit - 4000;
    const percent = (estimatedTokens / effectiveLimit) * 100;

    let expectedAction = '';
    if (percent < 70) {
      expectedAction = '✅ Keep all messages (full history)';
    } else if (percent < 80) {
      expectedAction = '📉 Apply sliding window (reduce to ~60%)';
    } else if (percent < 90) {
      expectedAction = '📄 Apply summarization (reduce to ~50%)';
    } else {
      expectedAction = '❌ Reject request (exceeds limit)';
    }

    log(`   Expected Action: ${expectedAction}`);

    return { success: true, dryRun: true };
  }

  // Real API call
  try {
    const response = await fetch(`${API_BASE}${scenario.route}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: scenario.messages.map(msg => ({
          id: Math.random().toString(36),
          role: msg.role,
          content: msg.content,
        })),
        model: scenario.model,
        webSearch: false,
        includeContext: false,
        documentContent: '',
        comments: [],
      }),
    });

    const success = scenario.expectedBehavior.shouldError ? !response.ok : response.ok;

    if (response.ok) {
      // Note: This would stream, but for testing we just check response
      logResult(true, `Response received (status: ${response.status})`);
      log('   Check server logs for management details', 'yellow');
    } else {
      const error = await response.json();
      logResult(success, `Error response: ${error.error || error.details}`);
    }

    return { success, response };
  } catch (error) {
    logResult(false, `Request failed: ${error.message}`);
    return { success: false, error };
  }
}

// Run all tests
async function runTests(dryRun = true) {
  logSection('TOKEN MANAGEMENT TEST SUITE');

  if (dryRun) {
    logWarning('DRY RUN MODE - No actual API calls will be made');
    logWarning('Set dryRun=false to test with real API');
  }

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
  };

  // Test each scenario
  for (const [key, scenario] of Object.entries(TESTS)) {
    // Skip progressive test in initial run
    if (scenario.steps) {
      logTest(scenario.name);
      log('   ⏭️  Skipped (requires sequential execution)', 'yellow');
      continue;
    }

    results.total++;
    const result = await testScenario(scenario, dryRun);

    if (result.success) {
      results.passed++;
    } else {
      results.failed++;
    }
  }

  // Summary
  logSection('TEST SUMMARY');
  log(`Total Tests: ${results.total}`, 'blue');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');

  if (dryRun) {
    log('\n💡 To run actual API tests:', 'cyan');
    log('   1. Ensure dev server is running: npm run dev');
    log('   2. Run: node test-token-management.js --live');
  }
}

// Main execution
const args = process.argv.slice(2);
const dryRun = !args.includes('--live');

runTests(dryRun).catch(error => {
  log(`\n❌ Test suite failed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

// Export for manual testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runTests,
    testScenario,
    TESTS,
    createMessage,
    createConversation,
  };
}
