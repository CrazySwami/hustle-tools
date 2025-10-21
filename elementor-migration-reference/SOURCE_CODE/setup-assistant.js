#!/usr/bin/env node

/**
 * Setup script for OpenAI Assistants API with Elementor source files
 *
 * This script:
 * 1. Creates a Vector Store with Elementor widget/control source files
 * 2. Creates an Assistant configured with file search
 * 3. Outputs the IDs to paste into the converter
 *
 * Usage:
 *   Option 1: export OPENAI_API_KEY=sk-... && node setup-assistant.js
 *   Option 2: Create .env file with OPENAI_API_KEY=sk-... && node setup-assistant.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Try to load from .env file if exists
let API_KEY = process.env.OPENAI_API_KEY;

if (!API_KEY) {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        console.log('📄 Loading API key from .env file...');
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/OPENAI_API_KEY\s*=\s*(.+)/);
        if (match) {
            API_KEY = match[1].trim();
            console.log('✅ API key loaded from .env\n');
        }
    }
}

if (!API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY not found\n');
    console.log('Two ways to provide your API key:\n');
    console.log('Option 1 - Environment variable:');
    console.log('  export OPENAI_API_KEY=sk-...');
    console.log('  node setup-assistant.js\n');
    console.log('Option 2 - .env file:');
    console.log('  1. Copy .env.example to .env');
    console.log('  2. Edit .env and add your API key');
    console.log('  3. Run: node setup-assistant.js\n');
    process.exit(1);
}

console.log('🚀 Starting Elementor Assistant Setup...\n');

// Helper function for API requests
function apiRequest(method, endpoint, body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.openai.com',
            path: endpoint,
            method: method,
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
                'OpenAI-Beta': 'assistants=v2'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(JSON.parse(data));
                } else {
                    reject(new Error(`API Error ${res.statusCode}: ${data}`));
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

// Upload file with form data
function uploadFile(filePath) {
    return new Promise((resolve, reject) => {
        const fileContent = fs.readFileSync(filePath);
        const fileName = path.basename(filePath);

        const boundary = `----Boundary${Date.now()}`;
        const formData = [
            `--${boundary}`,
            `Content-Disposition: form-data; name="file"; filename="${fileName}"`,
            'Content-Type: text/x-php',
            '',
            fileContent.toString(),
            `--${boundary}`,
            'Content-Disposition: form-data; name="purpose"',
            '',
            'assistants',
            `--${boundary}--`
        ].join('\r\n');

        const options = {
            hostname: 'api.openai.com',
            path: '/v1/files',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': Buffer.byteLength(formData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(JSON.parse(data));
                } else {
                    reject(new Error(`Upload Error ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', reject);
        req.write(formData);
        req.end();
    });
}

async function main() {
    try {
        // Step 1: Upload Elementor source files
        console.log('📤 Step 1: Uploading Elementor source files...');
        console.log('🔍 Scanning for all widget and control files...\n');

        // Try multiple possible locations
        let widgetsDir = path.join(__dirname, 'elementor-source', 'elementor-widgets');

        // If not found in current dir, try parent directory
        if (!fs.existsSync(widgetsDir)) {
            widgetsDir = path.join(__dirname, '..', 'elementor-source', 'elementor-widgets');
        }

        if (!fs.existsSync(widgetsDir)) {
            console.error('❌ Error: Could not find elementor-source/elementor-widgets directory');
            console.log('\nSearched in:');
            console.log(`  1. ${path.join(__dirname, 'elementor-source', 'elementor-widgets')}`);
            console.log(`  2. ${path.join(__dirname, '..', 'elementor-source', 'elementor-widgets')}`);
            console.log('\nPlease download the Elementor source files first.');
            console.log('See QUICK_START.md for instructions.\n');
            process.exit(1);
        }

        console.log(`📁 Using widget directory: ${widgetsDir}\n`);

        // Auto-discover all PHP files
        const filesToUpload = [];

        // Get all widget PHP files
        if (fs.existsSync(widgetsDir)) {
            const widgetFiles = fs.readdirSync(widgetsDir)
                .filter(f => f.endsWith('.php'))
                .map(f => path.join(widgetsDir, f));
            filesToUpload.push(...widgetFiles);
        }

        // Get all group control PHP files
        const groupsDir = path.join(widgetsDir, 'groups');
        if (fs.existsSync(groupsDir)) {
            const groupFiles = fs.readdirSync(groupsDir)
                .filter(f => f.endsWith('.php'))
                .map(f => path.join(groupsDir, f));
            filesToUpload.push(...groupFiles);
        }

        console.log(`📊 Found ${filesToUpload.length} files to upload\n`);

        const uploadedFiles = [];
        let uploadCount = 0;

        for (const filePath of filesToUpload) {
            if (!fs.existsSync(filePath)) {
                console.log(`⚠️  Skipping ${path.basename(filePath)} (not found)`);
                continue;
            }

            uploadCount++;
            console.log(`  [${uploadCount}/${filesToUpload.length}] Uploading ${path.basename(filePath)}...`);

            try {
                const file = await uploadFile(filePath);
                uploadedFiles.push(file.id);
                console.log(`  ✅ ${file.id}`);
            } catch (error) {
                console.log(`  ❌ Failed: ${error.message}`);
            }
        }

        console.log(`\n✅ Successfully uploaded ${uploadedFiles.length}/${filesToUpload.length} files\n`);

        // Step 2: Create Vector Store
        console.log('📚 Step 2: Creating Vector Store...');

        const vectorStore = await apiRequest('POST', '/v1/vector_stores', {
            name: 'Elementor Widget Controls',
            file_ids: uploadedFiles
        });

        console.log(`✅ Vector Store created: ${vectorStore.id}\n`);

        // Step 3: Create Assistant
        console.log('🤖 Step 3: Creating Assistant...');

        const assistant = await apiRequest('POST', '/v1/assistants', {
            name: 'Elementor JSON Converter',
            instructions: `You are an expert Elementor JSON conversion specialist with access to Elementor's source code.

Your task is to convert HTML/CSS to Elementor JSON format using EXACT property names from the Elementor source files.

CRITICAL RULES:
1. Search the Elementor source files to find the EXACT property names for each widget
2. ALWAYS set activation properties FIRST:
   - typography_typography: "custom" before any typography_* properties
   - background_background: "classic"|"gradient" before background colors
3. Widget-specific color properties:
   - heading: title_color (NOT text_color)
   - text-editor: text_color
   - button: button_text_color
4. Gradient properties: background_gradient_color and background_gradient_color_b (NOT color_start/color_end)
5. Create individual widgets for each HTML element
6. Use computed styles provided for exact values (convert rgb to hex)

Always respond with valid JSON only.`,
            model: 'gpt-4-turbo',
            tools: [{ type: 'file_search' }],
            tool_resources: {
                file_search: {
                    vector_store_ids: [vectorStore.id]
                }
            }
        });

        console.log(`✅ Assistant created: ${assistant.id}\n`);

        // Output configuration
        console.log('═'.repeat(60));
        console.log('🎉 SETUP COMPLETE!');
        console.log('═'.repeat(60));
        console.log('\n📋 Copy these IDs into the converter:\n');
        console.log(`Assistant ID:     ${assistant.id}`);
        console.log(`Vector Store ID:  ${vectorStore.id}`);
        console.log('\n💡 Paste these into the "Advanced Configuration" section');
        console.log('   in the HTML converter when using AI mode.\n');

        // Save to file
        const config = {
            assistant_id: assistant.id,
            vector_store_id: vectorStore.id,
            created_at: new Date().toISOString(),
            files_uploaded: uploadedFiles.length
        };

        fs.writeFileSync(
            path.join(__dirname, 'assistant-config.json'),
            JSON.stringify(config, null, 2)
        );

        console.log('💾 Configuration saved to assistant-config.json\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

main();
