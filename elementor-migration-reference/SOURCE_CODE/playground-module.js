import { startPlaygroundWeb } from 'https://playground.wordpress.net/client/index.js';

import { startPlaygroundWeb } from 'https://playground.wordpress.net/client/index.js';

let playgroundClient = null;
let currentPageId = null;
let currentPageSlug = 'elementor-test-preview';

const playgroundBlueprint = {
    "$schema": "https://playground.wordpress.net/blueprint-schema.json",    "landingPage": "/wp-admin/",    "preferredVersions": {        "php": "8.3",        "wp": "latest"
    },
    "features": {        "networking": true
    },
    "steps": [
        {
            "step": "login",            "username": "admin",            "password": "password"
        },
        {
            "step": "installPlugin",            "pluginData": {                "resource": "wordpress.org/plugins",                "slug": "elementor"
            },
            "options": {                "activate": true
            }
        },
        {
            "step": "installTheme",            "themeData": {                "resource": "wordpress.org/themes",                "slug": "hello-elementor"
            }
        },
        {
            "step": "activateTheme",            "themeFolderName": "hello-elementor"
        },
        {
            "step": "runPHP",            "code": "<?php require_once 'wordpress/wp-load.php'; $page_id = wp_insert_post(['post_title' => 'Elementor Test Preview', 'post_name' => 'elementor-test-preview', 'post_status' => 'publish', 'post_type' => 'page', 'post_content' => '']); update_post_meta($page_id, '_elementor_edit_mode', 'builder'); update_post_meta($page_id, '_elementor_template_type', 'wp-page'); update_post_meta($page_id, '_wp_page_template', 'elementor_canvas'); echo $page_id; ?>"
        }
    ]
};

function updatePlaygroundStatus(message, type = 'info') {    const statusText = document.getElementById('playgroundStatusText');    const statusDiv = document.getElementById('playgroundStatus');

    statusText.textContent = message;

    // Update colors based on type
    if (type === 'error') {        statusDiv.style.background = '#fee2e2';        statusDiv.style.borderLeftColor = '#ef4444';    } else if (type === 'success') {        statusDiv.style.background = '#d1fae5';        statusDiv.style.borderLeftColor = '#10b981';
    } else {
        statusDiv.style.background = '#fffbeb';        statusDiv.style.borderLeftColor = '#f59e0b';
    }
}

window.testInPlayground = async function() {
    if (!generatedJSON) {
        alert('❌ Please convert HTML to Elementor JSON first!');
        return;
    }

    console.log('🚀 Launching WordPress Playground with Elementor...');

    // Show the playground panel
    const panel = document.getElementById('playgroundPanel');    panel.style.display = 'block';    panel.scrollIntoView({ behavior: 'smooth' });

    updatePlaygroundStatus('⏳ Launching WordPress Playground... (this takes ~30-40 seconds on first launch)');

    try {
        const iframe = document.getElementById('playgroundIframe');

        // Launch Playground with OPFS persistence
        updatePlaygroundStatus('🌐 Starting WordPress...');

        playgroundClient = await startPlaygroundWeb({
            iframe: iframe,
            remoteUrl: 'https://playground.wordpress.net/remote.html',
            blueprint: playgroundBlueprint,
            mounts: [{
                mountPoint: '/wordpress/wp-content',
                device: {
                    type: 'opfs',                    path: '/wordpress-playground'
                }
            }]
        });

        updatePlaygroundStatus('📦 Installing Elementor + Hello theme...');

        // Wait for WordPress to be fully ready
        await playgroundClient.isReady();

        updatePlaygroundStatus('✅ WordPress ready! Creating test page...');

        // Get the page ID that was created by the Blueprint
        const pageResult = await playgroundClient.run({
            code: `<?php
                require_once 'wordpress/wp-load.php';                $page = get_page_by_path('${currentPageSlug}');
                echo $page ? $page->ID : 0;
            ?>`
        });

        currentPageId = parseInt(pageResult.text);

        if (!currentPageId) {
            throw new Error('Could not find test page');
        }

        console.log('📄 Found page ID:', currentPageId);

        updatePlaygroundStatus('📄 Test page ready! Importing your Elementor template...');

        // Import the Elementor JSON template
        await importElementorTemplate(generatedJSON);

        updatePlaygroundStatus('✅ Template imported! Opening Elementor editor...', 'success');

        // Navigate to Elementor editor
        await openElementorEditor();

        // Enable action buttons
        document.getElementById('refreshTemplateBtn').disabled = false;        document.getElementById('openEditorBtn').disabled = false;        document.getElementById('viewPageBtn').disabled = false;

        updatePlaygroundStatus('🎉 Success! You are now viewing the Elementor editor with your template.', 'success');

        console.log('✅ Playground setup complete!');

    } catch (error) {
        console.error('❌ Playground error:', error);        updatePlaygroundStatus('❌ Error: ' + error.message, 'error');        alert('Failed to launch Playground: ' + error.message);
    }
};

async function importElementorTemplate(elementorJSON) {
    if (!playgroundClient || !currentPageId) {
        throw new Error('Playground not ready');
    }

    // Extract content from your JSON format
    // Your format: { version, title, type, content: [...] }
    const elementorContent = elementorJSON.content || [];

    console.log('Importing Elementor content:', elementorContent);

    // Convert to string and escape for PHP
    const contentStr = JSON.stringify(elementorContent);
    const escapedContent = contentStr
        .replace(/\\/g, '\\\\')        .replace(/'/g, "\\'");

    // Import into WordPress via PHP
    const importResult = await playgroundClient.run({
        code: `<?php
            require_once 'wordpress/wp-load.php';

            $page_id = ${currentPageId};
            $elementor_data_str = '${escapedContent}';

            // Parse and save Elementor data
            $elementor_data = json_decode($elementor_data_str, true);

            if ($elementor_data === null) {
                echo 'ERROR: Failed to parse JSON - ' . json_last_error_msg();
                exit;
            }

            // Save to WordPress
            update_post_meta($page_id, '_elementor_data', json_encode($elementor_data));            update_post_meta($page_id, '_elementor_edit_mode', 'builder');            update_post_meta($page_id, '_elementor_template_type', 'wp-page');            update_post_meta($page_id, '_elementor_version', '3.23.0');            update_post_meta($page_id, '_wp_page_template', 'elementor_canvas');

            // Clear Elementor cache
            if (class_exists('\\\\Elementor\\\\Plugin')) {
                \\\\Elementor\\\\Plugin::instance()->files_manager->clear_cache();
            }

            echo 'SUCCESS: Template imported to page ' . $page_id;
        ?>`
    });

    console.log('Import result:', importResult.text);

    if (importResult.text.includes('ERROR')) {
        throw new Error(importResult.text);
    }
}

window.openElementorEditor = async function() {
    if (!playgroundClient || !currentPageId) {
        alert('Playground not ready yet');
        return;
    }

    const editorUrl = `/wp-admin/post.php?post=${currentPageId}&action=elementor`;
    await playgroundClient.goTo(editorUrl);

    console.log('🎨 Opened Elementor editor for page', currentPageId);
};

window.viewPage = async function() {
    if (!playgroundClient || !currentPageId) {
        alert('Playground not ready yet');
        return;
    }

    await playgroundClient.goTo(`/${currentPageSlug}/`);
    console.log('👁️ Viewing page:', currentPageSlug);
};

window.refreshPlaygroundTemplate = async function() {
    if (!playgroundClient || !currentPageId) {
        alert('Playground not ready yet');
        return;
    }

    if (!generatedJSON) {
        alert('No JSON to import. Please convert HTML first.');
        return;
    }

    updatePlaygroundStatus('🔄 Re-importing template...');

    try {
        await importElementorTemplate(generatedJSON);
        await openElementorEditor();
        updatePlaygroundStatus('✅ Template refreshed!', 'success');
    } catch (error) {
        console.error(error);
        updatePlaygroundStatus('❌ Error refreshing: ' + error.message, 'error');
    }
};

window.closePlayground = function() {
    const panel = document.getElementById('playgroundPanel');    panel.style.display = 'none';

    // Don't destroy client - keep it alive for faster subsequent use    console.log('Playground panel hidden (client still active)');
};

console.log('✅ WordPress Playground module loaded');

// Expose Playground functions to window
window.closePlayground = closePlayground;
window.refreshPlaygroundTemplate = refreshPlaygroundTemplate;
window.openElementorEditor = openElementorEditor;
window.viewPage = viewPage;

console.log('✅ WordPress Playground module loaded');
