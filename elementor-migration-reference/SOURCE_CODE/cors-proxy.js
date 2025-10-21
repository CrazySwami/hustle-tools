#!/usr/bin/env node

/**
 * CORS Proxy for OpenAI APIs
 * Supports both Chat Completions and Assistants API
 *
 * Usage: node cors-proxy.js
 *
 * Endpoints:
 * - POST /api/openai -> /v1/chat/completions (Chat API)
 * - POST /api/openai-assistant -> Assistants API (threads, messages, runs)
 */

const http = require('http');
const https = require('https');

const PORT = 3001;

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, OpenAI-Beta');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Route handling
    if (req.url === '/api/openai' && req.method === 'POST') {
        handleChatCompletions(req, res);
    } else if (req.url === '/api/openai-assistant' && req.method === 'POST') {
        handleAssistantsAPI(req, res);
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

/**
 * Handle Chat Completions API (existing functionality)
 */
function handleChatCompletions(req, res) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        try {
            const requestData = JSON.parse(body);
            const apiKey = req.headers.authorization?.replace('Bearer ', '');

            if (!apiKey) {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'No API key provided' }));
                return;
            }

            // Forward to OpenAI Chat Completions
            const options = {
                hostname: 'api.openai.com',
                path: '/v1/chat/completions',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                }
            };

            const proxyReq = https.request(options, (proxyRes) => {
                res.writeHead(proxyRes.statusCode, proxyRes.headers);
                proxyRes.pipe(res);
            });

            proxyReq.on('error', (error) => {
                console.error('Chat API Proxy error:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            });

            proxyReq.write(body);
            proxyReq.end();

        } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid request' }));
        }
    });
}

/**
 * Handle Assistants API (threads, messages, runs)
 */
function handleAssistantsAPI(req, res) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        try {
            const requestData = JSON.parse(body);
            const apiKey = req.headers.authorization?.replace('Bearer ', '');

            if (!apiKey) {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'No API key provided' }));
                return;
            }

            // Determine endpoint based on action
            let path, method;
            let requestBody = {};

            switch (requestData.action) {
                case 'createThread':
                    path = '/v1/threads';
                    method = 'POST';
                    break;

                case 'addMessage':
                    path = `/v1/threads/${requestData.threadId}/messages`;
                    method = 'POST';
                    requestBody = {
                        role: 'user',
                        content: requestData.content
                    };
                    break;

                case 'runAssistant':
                    path = `/v1/threads/${requestData.threadId}/runs`;
                    method = 'POST';
                    requestBody = {
                        assistant_id: requestData.assistantId,
                        model: requestData.model || 'gpt-5-2025-08-07',
                        tools: requestData.tools || []
                    };
                    break;

                case 'getRunStatus':
                    path = `/v1/threads/${requestData.threadId}/runs/${requestData.runId}`;
                    method = 'GET';
                    break;

                case 'getMessages':
                    path = `/v1/threads/${requestData.threadId}/messages`;
                    method = 'GET';
                    break;

                default:
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Unknown action' }));
                    return;
            }

            // Forward to OpenAI Assistants API
            const options = {
                hostname: 'api.openai.com',
                path: path,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'OpenAI-Beta': 'assistants=v2'
                }
            };

            const proxyReq = https.request(options, (proxyRes) => {
                let responseData = '';
                proxyRes.on('data', chunk => {
                    responseData += chunk;
                });

                proxyRes.on('end', () => {
                    res.writeHead(proxyRes.statusCode, {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    });
                    res.end(responseData);
                });
            });

            proxyReq.on('error', (error) => {
                console.error('Assistants API Proxy error:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            });

            if (method === 'POST') {
                proxyReq.write(JSON.stringify(requestBody));
            }
            proxyReq.end();

        } catch (error) {
            console.error('Request error:', error);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid request: ' + error.message }));
        }
    });
}

server.listen(PORT, () => {
    console.log(`✅ CORS Proxy running on http://localhost:${PORT}`);
    console.log(`   Endpoints:`);
    console.log(`   - POST /api/openai (Chat Completions)`);
    console.log(`   - POST /api/openai-assistant (Assistants API)`);
});
