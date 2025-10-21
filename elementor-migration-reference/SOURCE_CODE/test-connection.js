#!/usr/bin/env node

/**
 * Test script to verify connection to OpenAI Assistant API and Vector Store
 *
 * Usage:
 *   node test-connection.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load API key from .env or environment
let API_KEY = process.env.OPENAI_API_KEY;

if (!API_KEY) {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/OPENAI_API_KEY\s*=\s*(.+)/);
        if (match) {
            API_KEY = match[1].trim();
        }
    }
}

if (!API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY not found\n');
    console.log('Set your API key:');
    console.log('  export OPENAI_API_KEY=sk-...');
    console.log('  or create a .env file\n');
    process.exit(1);
}

// Load assistant config
let assistantId, vectorStoreId;
const configPath = path.join(__dirname, 'assistant-config.json');

if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    assistantId = config.assistant_id;
    vectorStoreId = config.vector_store_id;
    console.log('📄 Loaded IDs from assistant-config.json\n');
} else {
    console.log('⚠️  assistant-config.json not found. Using manual input...\n');
}

// Helper function for API requests
function apiRequest(method, endpoint, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.openai.com',
            path: endpoint,
            method: method,
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
                'OpenAI-Beta': 'assistants=v2',
                ...headers
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(JSON.parse(data));
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', reject);

        if (body) {
            req.write(JSON.stringify(body));
        }

        req.end();
    });
}

async function runTests() {
    console.log('🧪 Testing OpenAI API Connection...\n');
    console.log('═'.repeat(60));

    try {
        // Test 1: API Key Validation
        console.log('\n📝 Test 1: API Key Validation');
        console.log('   Testing basic API connectivity...');

        const models = await apiRequest('GET', '/v1/models');
        console.log('   ✅ API Key is valid');
        console.log(`   ✅ Found ${models.data.length} available models`);

        // Test 2: Vector Store Connection
        if (vectorStoreId) {
            console.log('\n📚 Test 2: Vector Store Connection');
            console.log(`   Vector Store ID: ${vectorStoreId}`);

            try {
                const vectorStore = await apiRequest('GET', `/v1/vector_stores/${vectorStoreId}`);
                console.log('   ✅ Vector Store exists');
                console.log(`   ✅ Name: ${vectorStore.name}`);
                console.log(`   ✅ File count: ${vectorStore.file_counts?.completed || 0} files`);
                console.log(`   ✅ Status: ${vectorStore.status}`);
                console.log(`   ✅ Created: ${new Date(vectorStore.created_at * 1000).toLocaleString()}`);
            } catch (error) {
                console.log('   ❌ Vector Store not found or inaccessible');
                console.log(`   Error: ${error.message}`);
            }
        } else {
            console.log('\n📚 Test 2: Vector Store Connection');
            console.log('   ⏭️  Skipped (no vector_store_id in config)');
        }

        // Test 3: Assistant Connection
        if (assistantId) {
            console.log('\n🤖 Test 3: Assistant Connection');
            console.log(`   Assistant ID: ${assistantId}`);

            try {
                const assistant = await apiRequest('GET', `/v1/assistants/${assistantId}`);
                console.log('   ✅ Assistant exists');
                console.log(`   ✅ Name: ${assistant.name}`);
                console.log(`   ✅ Model: ${assistant.model}`);
                console.log(`   ✅ Tools: ${assistant.tools.map(t => t.type).join(', ')}`);

                // Check if assistant has vector store attached
                if (assistant.tool_resources?.file_search?.vector_store_ids) {
                    const vsIds = assistant.tool_resources.file_search.vector_store_ids;
                    console.log(`   ✅ Attached Vector Stores: ${vsIds.length}`);
                    vsIds.forEach(id => console.log(`      • ${id}`));
                } else {
                    console.log('   ⚠️  No vector stores attached to assistant');
                }
            } catch (error) {
                console.log('   ❌ Assistant not found or inaccessible');
                console.log(`   Error: ${error.message}`);
            }
        } else {
            console.log('\n🤖 Test 3: Assistant Connection');
            console.log('   ⏭️  Skipped (no assistant_id in config)');
        }

        // Test 4: List Vector Store Files
        if (vectorStoreId) {
            console.log('\n📁 Test 4: Vector Store Files');

            try {
                const files = await apiRequest('GET', `/v1/vector_stores/${vectorStoreId}/files?limit=5`);
                console.log(`   ✅ Retrieved file list (showing first 5/${files.data.length})`);

                files.data.forEach((file, index) => {
                    console.log(`   ${index + 1}. File ID: ${file.id} (Status: ${file.status})`);
                });

                if (files.data.length === 0) {
                    console.log('   ⚠️  No files found in vector store');
                }
            } catch (error) {
                console.log('   ❌ Could not retrieve files');
                console.log(`   Error: ${error.message}`);
            }
        } else {
            console.log('\n📁 Test 4: Vector Store Files');
            console.log('   ⏭️  Skipped (no vector_store_id in config)');
        }

        // Test 5: Test Conversion (Create Thread)
        if (assistantId && vectorStoreId) {
            console.log('\n🔄 Test 5: Test Conversion Flow');
            console.log('   Creating a test thread...');

            try {
                const thread = await apiRequest('POST', '/v1/threads');
                console.log(`   ✅ Thread created: ${thread.id}`);
                console.log('   ✅ Ready to process conversions');

                // Clean up test thread
                await apiRequest('DELETE', `/v1/threads/${thread.id}`);
                console.log('   ✅ Test thread cleaned up');
            } catch (error) {
                console.log('   ❌ Could not create thread');
                console.log(`   Error: ${error.message}`);
            }
        } else {
            console.log('\n🔄 Test 5: Test Conversion Flow');
            console.log('   ⏭️  Skipped (missing assistant_id or vector_store_id)');
        }

        // Test 6: Live Conversion Prompt
        if (assistantId) {
            console.log('\n⚡ Test 6: Live Conversion Prompt');
            let threadId = null;
            try {
                // 1. Create a thread
                console.log('   Creating a test thread...');
                const thread = await apiRequest('POST', '/v1/threads');
                threadId = thread.id;
                console.log(`   ✅ Thread created: ${threadId}`);

                // 2. Add a message
                const prompt = 'Create a JSON section for a heading widget with the text \'Hello World\'';
                console.log(`   Sending prompt: "${prompt}"`);
                await apiRequest('POST', `/v1/threads/${threadId}/messages`, {
                    role: 'user',
                    content: prompt
                });
                console.log('   ✅ Message added');

                // 3. Create a run
                console.log('   Running assistant...');
                let run = await apiRequest('POST', `/v1/threads/${threadId}/runs`, {
                    assistant_id: assistantId
                });
                const runId = run.id;
                console.log(`   ✅ Run created: ${runId}`);

                // 4. Poll for completion
                console.log('   Waiting for completion...');
                const terminalStates = ['completed', 'failed', 'cancelled', 'expired'];
                while (!terminalStates.includes(run.status)) {
                    await new Promise(resolve => setTimeout(resolve, 1000)); // wait 1s
                    run = await apiRequest('GET', `/v1/threads/${threadId}/runs/${runId}`);
                    console.log(`   Status: ${run.status}`);
                }

                if (run.status !== 'completed') {
                    throw new Error(`Run finished with status: ${run.status}`);
                }

                console.log('   ✅ Run completed!');

                // 5. Retrieve and validate the response
                const messages = await apiRequest('GET', `/v1/threads/${threadId}/messages`);
                const assistantResponse = messages.data.find(m => m.role === 'assistant');

                if (!assistantResponse || !assistantResponse.content[0]) {
                    throw new Error('Assistant did not provide a response.');
                }

                const responseText = assistantResponse.content[0].text.value;
                console.log('   📝 Assistant Response:');
                console.log(responseText);

                const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
                if (!jsonMatch || !jsonMatch[1]) {
                    throw new Error('Response does not contain a valid JSON block.');
                }

                JSON.parse(jsonMatch[1]); // This will throw if JSON is invalid
                console.log('   ✅ Response contains valid JSON!');

                // 6. Retrieve and validate run steps
                console.log('   Inspecting run steps for tool usage...');
                const steps = await apiRequest('GET', `/v1/threads/${threadId}/runs/${runId}/steps`);
                const toolStep = steps.data.find(step => step.type === 'tool_calls');

                if (toolStep && toolStep.step_details.tool_calls[0].type === 'file_search') {
                    console.log('   ✅ Assistant used the file_search tool as expected.');
                } else {
                    throw new Error('Assistant did not use the file_search tool.');
                }

            } catch (error) {
                console.log('   ❌ Live conversion test failed');
                console.log(`   Error: ${error.message}`);
            } finally {
                // 7. Clean up the thread
                if (threadId) {
                    await apiRequest('DELETE', `/v1/threads/${threadId}`);
                    console.log('   ✅ Test thread cleaned up');
                }
            }
        } else {
            console.log('\n⚡ Test 6: Live Conversion Prompt');
            console.log('   ⏭️  Skipped (no assistant_id in config)');
        }

        // Summary
        console.log('\n' + '═'.repeat(60));
        console.log('✅ CONNECTION TEST COMPLETE\n');

        if (assistantId && vectorStoreId) {
            console.log('🎉 Everything is working! You can now use the converter.\n');
            console.log('Next steps:');
            console.log('  1. Open html-to-elementor-converter.html');
            console.log('  2. Switch to AI mode');
            console.log('  3. Enter your API key');
            console.log('  4. Paste the Assistant ID and Vector Store ID');
            console.log('  5. Convert your HTML!\n');
        } else {
            console.log('⚠️  Setup incomplete. Run setup-assistant.js first.\n');
        }

    } catch (error) {
        console.log('\n❌ Test failed:', error.message);
        process.exit(1);
    }
}

runTests();
