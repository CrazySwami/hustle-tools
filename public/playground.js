// WordPress Playground Integration
// Load the playground library dynamically
let startPlaygroundWeb = null;
let playgroundClient = null;
let currentPageId = null;
let currentPageSlug = 'elementor-test-preview';
let playgroundLoaded = false;

// Expose globals for external access
window.playgroundClient = null;
window.currentPageId = null;
window.updateAndViewPage = null; // Will be set after definition

// Dynamically load the WordPress Playground library
async function loadPlaygroundLibrary() {
    if (playgroundLoaded) return;

    try {
        const module = await import('https://playground.wordpress.net/client/index.js');
        startPlaygroundWeb = module.startPlaygroundWeb;
        playgroundLoaded = true;
        console.log('✅ WordPress Playground library loaded');
    } catch (error) {
        console.error('❌ Failed to load WordPress Playground library:', error);
        throw new Error('Failed to load WordPress Playground library. Please check your internet connection.');
    }
}

const playgroundBlueprint = {
    "landingPage": "/wp-admin/",
    "preferredVersions": {
        "php": "8.0",
        "wp": "latest"
    },
    "features": {
        "networking": true
    },
    "steps": [
        {
            "step": "login"
        },
        {
            "step": "installPlugin",
            "pluginZipFile": {
                "resource": "wordpress.org/plugins",
                "slug": "elementor"
            },
            "options": {
                "activate": true
            }
        },
        {
            "step": "installPlugin",
            "pluginZipFile": {
                "resource": "wordpress.org/plugins",
                "slug": "wordpress-seo"
            },
            "options": {
                "activate": true
            }
        },
        {
            "step": "installPlugin",
            "pluginZipFile": {
                "resource": "wordpress.org/plugins",
                "slug": "analogwp-templates"
            },
            "options": {
                "activate": true
            }
        },
        // NOTE: Elementor Pro cannot be auto-installed as it's a premium plugin requiring a license.
        // To add Elementor Pro manually:
        // 1. Once Playground loads, go to Plugins > Add New > Upload Plugin
        // 2. Upload your Elementor Pro .zip file
        // 3. Activate the plugin
        // OR use the installPlugin step with a direct URL to your Pro zip file:
        // {
        //     "step": "installPlugin",
        //     "pluginZipFile": {
        //         "resource": "url",
        //         "url": "https://your-server.com/elementor-pro.zip"
        //     },
        //     "options": {
        //         "activate": true
        //     }
        // },
        {
            "step": "installTheme",
            "themeZipFile": {
                "resource": "wordpress.org/themes",
                "slug": "hello-elementor"
            }
        },
        {
            "step": "activateTheme",
            "themeFolderName": "hello-elementor"
        },
        // Temporarily disabled to debug WordPress critical error
        // {
        //     "step": "mkdir",
        //     "path": "/wordpress/wp-content/mu-plugins"
        // },
        // {
        //     "step": "runPHP",
        //     "code": "<?php require_once '/wordpress/wp-load.php'; update_option('elementor_onboarded', true); update_option('elementor_tracker_notice', '1'); update_option('elementor_pro_license_key', 'playground_test_key'); update_option('_elementor_pro_license_data', array('success' => true, 'license' => 'valid', 'item_name' => 'Elementor Pro', 'expires' => 'lifetime')); ?>"
        // },
        // {
        //     "step": "writeFile",
        //     "path": "/wordpress/wp-content/mu-plugins/elementor-pro-playground-bypass.php",
        //     "data": "<?php\n/**\n * Plugin Name: Elementor Pro Playground Bypass\n * Description: Bypasses Elementor Pro license checks in WordPress Playground\n * Version: 1.0\n */\n\n// Bypass ALL external HTTP requests to Elementor servers\nadd_filter('pre_http_request', function($preempt, $args, $url) {\n    if (strpos($url, 'elementor.com') !== false || strpos($url, 'my.elementor.com') !== false) {\n        return array(\n            'response' => array('code' => 200, 'message' => 'OK'),\n            'headers' => array(),\n            'body' => json_encode(array(\n                'success' => true,\n                'license' => 'valid',\n                'item_name' => 'Elementor Pro',\n                'expires' => 'lifetime',\n                'license_limit' => 1000,\n                'site_count' => 1,\n                'activations_left' => 999,\n                'message' => 'License is active'\n            ))\n        );\n    }\n    return $preempt;\n}, 1, 3);\n\n// Force license as always valid\nadd_filter('elementor_pro/license/api_get_license_data', function() {\n    return (object) array(\n        'success' => true,\n        'license' => 'valid',\n        'item_name' => 'Elementor Pro',\n        'expires' => 'lifetime'\n    );\n}, 1);\n\nadd_filter('elementor/admin/license/get_license_data', function($data) {\n    return array(\n        'success' => true,\n        'license' => 'valid',\n        'item_name' => 'Elementor Pro',\n        'expires' => 'lifetime'\n    );\n}, 1);\n\n// Bypass all license checks\nadd_filter('elementor/admin/license/is_license_active', '__return_true', 1);\nadd_filter('elementor/admin/license/is_license_expired', '__return_false', 1);\nadd_filter('elementor_pro/core/connect/is_connected', '__return_true', 1);\n\n// Suppress activation redirect to prevent errors\nadd_filter('wp_redirect', function($location) {\n    if (strpos($location, 'elementor') !== false && strpos($location, 'activated') !== false) {\n        return admin_url('plugins.php?activate=true');\n    }\n    return $location;\n}, 1);\n\n// Add admin notice that Pro is active\nadd_action('admin_notices', function() {\n    if (is_plugin_active('elementor-pro/elementor-pro.php')) {\n        echo '<div class=\"notice notice-success\"><p><strong>Elementor Pro is active!</strong> License bypass enabled for WordPress Playground.</p></div>';\n    }\n});\n"
        // }
    ]
};

let autoStartPlayground = true; // Auto-start playground on page load

function updatePlaygroundStatus(message, type) {
    type = type || 'info';
    const statusText = document.getElementById('playgroundStatusText');
    const statusDiv = document.getElementById('playgroundStatus');
    
    if (statusText) {
        statusText.textContent = message;
        statusDiv.style.display = message ? 'block' : 'none';
    }
    
    if (statusDiv) {
        if (type === 'error') {
            statusDiv.style.background = '#fee2e2';
            statusDiv.style.borderLeftColor = '#ef4444';
        } else if (type === 'success') {
            statusDiv.style.background = '#d1fae5';
            statusDiv.style.borderLeftColor = '#10b981';
            
            // Auto-hide success messages after 3 seconds
            setTimeout(() => {
                if (statusText) statusText.textContent = '';
                statusDiv.style.display = 'none';
            }, 3000);
        } else {
            statusDiv.style.background = '#fffbeb';
            statusDiv.style.borderLeftColor = '#f59e0b';
        }
    }
}

async function importElementorTemplate(elementorJSON) {
    if (!playgroundClient || !currentPageId) {
        throw new Error('Playground not ready');
    }

    // Validate JSON
    if (!elementorJSON || typeof elementorJSON !== 'object') {
        throw new Error('Invalid Elementor JSON: must be an object');
    }

    // Extract content - handle different formats
    let elementorContent;
    if (Array.isArray(elementorJSON)) {
        // If the JSON itself is already an array (just content)
        elementorContent = elementorJSON;
    } else if (elementorJSON.content && Array.isArray(elementorJSON.content)) {
        // If it has a content property that's an array
        elementorContent = elementorJSON.content;
    } else if (typeof elementorJSON === 'object') {
        // If it's an object but not in the expected format, wrap it
        elementorContent = [elementorJSON];
    } else {
        throw new Error('Invalid Elementor JSON structure: expected array or object with content property');
    }

    console.log('📦 Importing Elementor content:', {
        type: typeof elementorContent,
        isArray: Array.isArray(elementorContent),
        length: Array.isArray(elementorContent) ? elementorContent.length : 'N/A',
        firstElement: elementorContent[0] ? {
            elType: elementorContent[0].elType,
            widgetType: elementorContent[0].widgetType,
            id: elementorContent[0].id
        } : 'empty'
    });

    // Validate that we have at least one element
    if (!Array.isArray(elementorContent) || elementorContent.length === 0) {
        throw new Error('Elementor content must be a non-empty array');
    }

    // CRITICAL: Validate that all elements have required elType property
    for (let i = 0; i < elementorContent.length; i++) {
        const element = elementorContent[i];
        if (!element || typeof element !== 'object') {
            throw new Error(`Element at index ${i} is not an object`);
        }
        if (!element.elType) {
            console.error('❌ Missing elType in element:', element);
            throw new Error(`Element at index ${i} is missing required "elType" property. Each Elementor element must have elType (e.g., "section", "column", "widget"). Received: ${JSON.stringify(element).substring(0, 200)}`);
        }
        console.log(`✅ Element ${i}: elType="${element.elType}", id="${element.id}"`);
    }

    // Safely stringify with error handling
    let contentStr;
    try {
        contentStr = JSON.stringify(elementorContent);
        console.log('✅ Stringified content successfully. Length:', contentStr.length);
    } catch (error) {
        console.error('❌ JSON stringify error:', error);
        throw new Error('Cannot stringify Elementor content: ' + error.message);
    }

    // Use a safer approach: write JSON to a file first, then import from file
    const phpCode = `<?php
        require_once '/wordpress/wp-load.php';
        $page_id = ${currentPageId};

        // Read JSON from temporary file
        $temp_file = '/tmp/elementor_import_' . $page_id . '.json';
        if (file_exists($temp_file)) {
            $json_string = file_get_contents($temp_file);

            // Debug: Log the first 500 chars of JSON
            error_log('JSON string length: ' . strlen($json_string));
            error_log('JSON preview: ' . substr($json_string, 0, 500));

            $elementor_data = json_decode($json_string, true);
            $json_error = json_last_error();
            $json_error_msg = json_last_error_msg();

            if ($json_error === JSON_ERROR_NONE) {
                // Validate that we have valid data
                if (!is_array($elementor_data)) {
                    echo 'Error: Decoded data is not an array, got: ' . gettype($elementor_data);
                    @unlink($temp_file);
                    exit;
                }

                if (empty($elementor_data)) {
                    echo 'Error: Decoded data is empty array';
                    @unlink($temp_file);
                    exit;
                }

                update_post_meta($page_id, '_elementor_data', $elementor_data);
                update_post_meta($page_id, '_elementor_edit_mode', 'builder');

                // Clear Elementor cache
                delete_post_meta($page_id, '_elementor_css');

                // Save/publish the page to regenerate frontend
                wp_update_post(array(
                    'ID' => $page_id,
                    'post_status' => 'publish'
                ));

                // Flush Elementor cache if available
                if (class_exists('\\Elementor\\Plugin')) {
                    \\Elementor\\Plugin::instance()->files_manager->clear_cache();
                }

                // Clean up temp file
                @unlink($temp_file);

                echo 'Success: Updated ' . count($elementor_data) . ' elements';
            } else {
                echo 'Error: JSON decode failed - ' . $json_error_msg . ' (code: ' . $json_error . ')';
                @unlink($temp_file);
            }
        } else {
            echo 'Error: Temp file not found at ' . $temp_file;
        }
    ?>`;

    // First, write the JSON to a file
    console.log('Writing JSON to temporary file...');
    const writeResult = await playgroundClient.writeFile(
        `/tmp/elementor_import_${currentPageId}.json`,
        contentStr
    );
    
    console.log('Running PHP import...');
    
    const importResult = await playgroundClient.run({
        code: phpCode
    });
    
    console.log('Import result:', importResult);
    
    if (importResult && importResult.text) {
        console.log('Import response:', importResult.text);
        if (importResult.text.indexOf('Error') !== -1) {
            throw new Error(importResult.text);
        }
    }
    
    return importResult;
}

window.testInPlayground = async function() {
    // If no JSON generated yet, just open WordPress with Elementor
    if (!window.generatedJSON) {
        console.log('ℹ️ No JSON generated yet, opening WordPress Playground directly...');
        return window.openPlaygroundDirect();
    }
    
    console.log('🚀 Launching WordPress Playground with Elementor template...');

    const panel = document.getElementById('playgroundPanel');
    if (panel) {
        panel.style.display = 'block';
    }

    updatePlaygroundStatus('⏳ Loading WordPress Playground library...');

    try {
        // Load the playground library first
        await loadPlaygroundLibrary();

        updatePlaygroundStatus('⏳ Launching WordPress Playground... (this takes ~30-40 seconds on first launch)');

        const iframe = document.getElementById('playgroundIframe');

        if (!iframe) {
            throw new Error('Playground iframe not found');
        }

        updatePlaygroundStatus('🌐 Starting WordPress...');

        console.log('Starting Playground with blueprint:', playgroundBlueprint);

        playgroundClient = await startPlaygroundWeb({
            iframe: iframe,
            remoteUrl: 'https://playground.wordpress.net/remote.html',
            blueprint: playgroundBlueprint
        });
        
        // Expose to window for external access
        window.playgroundClient = playgroundClient;
        
        console.log('Playground client created:', playgroundClient);
        
        updatePlaygroundStatus('📦 Installing Elementor + Hello theme...');
        
        console.log('Waiting for WordPress to be ready...');
        await playgroundClient.isReady();
        console.log('WordPress is ready!');
        
        updatePlaygroundStatus('✅ WordPress ready! Creating test page...');
        
        // Create the test page
        const createPageCode = `<?php
            require_once '/wordpress/wp-load.php';
            $page_id = wp_insert_post(array(
                'post_title' => 'Elementor Test Preview',
                'post_name' => 'elementor-test-preview',
                'post_status' => 'publish',
                'post_type' => 'page',
                'post_content' => ''
            ));
            if ($page_id && !is_wp_error($page_id)) {
                update_post_meta($page_id, '_elementor_edit_mode', 'builder');
                update_post_meta($page_id, '_elementor_template_type', 'wp-page');
                update_post_meta($page_id, '_wp_page_template', 'elementor_canvas');
                echo $page_id;
            } else {
                echo '0';
            }
        ?>`;
        
        console.log('Creating page...');
        const pageResult = await playgroundClient.run({ code: createPageCode });
        
        console.log('Page creation result:', pageResult);
        
        if (!pageResult || typeof pageResult.text === 'undefined') {
            throw new Error('Invalid response from WordPress');
        }
        
        currentPageId = parseInt(pageResult.text.trim());
        
        if (!currentPageId || isNaN(currentPageId) || currentPageId === 0) {
            throw new Error('Could not create test page. Response: ' + pageResult.text);
        }
        
        // Expose to window for external access
        window.currentPageId = currentPageId;
        
        console.log('📄 Created page ID:', currentPageId);
        
        updatePlaygroundStatus('📄 Test page ready! Importing your Elementor template...');
        
        await importElementorTemplate(window.generatedJSON);
        
        updatePlaygroundStatus('✅ Template imported! Opening Elementor editor...', 'success');
        
        await window.openElementorEditor();
        
        // Enable buttons (check both converter and chat editor IDs)
        const refreshBtn = document.getElementById('refreshTemplateBtn');
        const updateBtn = document.getElementById('updatePlaygroundBtn'); // Chat editor - Opens Elementor
        const viewPageBtn = document.getElementById('viewPageBtn'); // Chat editor - view live
        const viewBtn = document.getElementById('viewPageBtn'); // Converter
        
        if (refreshBtn) refreshBtn.disabled = false;
        if (updateBtn) updateBtn.disabled = false;
        if (viewPageBtn) viewPageBtn.disabled = false;
        if (viewBtn) viewBtn.disabled = false;
        
        updatePlaygroundStatus('🎉 Success! You are now viewing the Elementor editor with your template.', 'success');
        
        console.log('✅ Playground setup complete!');
        
    } catch (error) {
        console.error('❌ Playground error:', error);
        updatePlaygroundStatus('❌ Error: ' + error.message, 'error');
        alert('Failed to launch Playground: ' + error.message);
    }
};

window.openElementorEditor = async function() {
    if (!playgroundClient || !currentPageId) {
        console.warn('Playground not initialized');
        return;
    }
    
    const editorUrl = '/wp-admin/post.php?post=' + currentPageId + '&action=elementor';
    console.log('Opening Elementor editor:', editorUrl);
    await playgroundClient.goTo(editorUrl);
    console.log('Navigated to Elementor editor');
};

window.viewPage = async function() {
    if (!playgroundClient || !currentPageId) {
        console.warn('Playground not initialized');
        return;
    }

    const pageUrl = '/?page_id=' + currentPageId;
    console.log('Viewing page:', pageUrl);
    await playgroundClient.goTo(pageUrl);
    console.log('Page loaded');
};

// Pull changes from Elementor editor back to JSON
window.pullFromPlayground = async function() {
    if (!playgroundClient || !currentPageId) {
        throw new Error('Playground not initialized. Please launch it first.');
    }

    try {
        updatePlaygroundStatus('📥 Pulling changes from Elementor editor...');
        console.log('🔽 Pulling Elementor data from page ID:', currentPageId);

        // PHP code to get the current Elementor data
        const phpCode = `<?php
            require_once '/wordpress/wp-load.php';
            $page_id = ${currentPageId};
            $elementor_data = get_post_meta($page_id, '_elementor_data', true);

            if ($elementor_data) {
                // If it's already an array, encode it
                if (is_array($elementor_data)) {
                    echo json_encode($elementor_data, JSON_UNESCAPED_UNICODE);
                } else {
                    // If it's a string, output it directly
                    echo $elementor_data;
                }
            } else {
                echo json_encode(array('error' => 'No Elementor data found'));
            }
        ?>`;

        console.log('Running PHP to fetch Elementor data...');

        const result = await playgroundClient.run({
            code: phpCode
        });

        console.log('Pull result:', result);

        if (!result || !result.text) {
            throw new Error('No data received from WordPress');
        }

        let elementorData;
        try {
            elementorData = JSON.parse(result.text);
        } catch (e) {
            console.error('Failed to parse JSON:', result.text);
            throw new Error('Invalid JSON received from WordPress');
        }

        if (elementorData.error) {
            throw new Error(elementorData.error);
        }

        console.log('✅ Successfully pulled Elementor data:', elementorData);
        updatePlaygroundStatus('✅ Changes pulled successfully!', 'success');

        return elementorData;

    } catch (error) {
        console.error('❌ Pull error:', error);
        updatePlaygroundStatus('❌ Error pulling changes: ' + error.message, 'error');
        throw error;
    }
};

// Update template and view live page
window.updateAndViewPage = async function(elementorJSON) {
    if (!playgroundClient || !currentPageId) {
        console.warn('Playground not initialized - need to create page first');
        // Create page and import template
        if (!playgroundClient) {
            throw new Error('Playground not running. Please launch it first.');
        }

        // Create page if needed
        if (!currentPageId) {
            updatePlaygroundStatus('📄 Creating page...');
            const createPageCode = `<?php
                require_once '/wordpress/wp-load.php';
                $page_id = wp_insert_post(array(
                    'post_title' => 'Elementor Test Preview',
                    'post_name' => 'elementor-test-preview',
                    'post_status' => 'publish',
                    'post_type' => 'page',
                    'post_content' => ''
                ));
                if ($page_id && !is_wp_error($page_id)) {
                    update_post_meta($page_id, '_elementor_edit_mode', 'builder');
                    update_post_meta($page_id, '_elementor_template_type', 'wp-page');
                    update_post_meta($page_id, '_wp_page_template', 'elementor_canvas');
                    echo $page_id;
                } else {
                    echo '0';
                }
            ?>`;

            const pageResult = await playgroundClient.run({ code: createPageCode });
            currentPageId = parseInt(pageResult.text.trim());
            window.currentPageId = currentPageId;

            if (!currentPageId || isNaN(currentPageId) || currentPageId === 0) {
                throw new Error('Could not create test page');
            }

            console.log('📄 Created page ID:', currentPageId);
        }
    }

    try {
        updatePlaygroundStatus('🔄 Updating template...');

        // Import the template
        await importElementorTemplate(elementorJSON);

        updatePlaygroundStatus('✅ Template updated! Opening live page...', 'success');

        // View the live page
        const pageUrl = '/?page_id=' + currentPageId;
        console.log('Opening live page:', pageUrl);
        await playgroundClient.goTo(pageUrl);

        updatePlaygroundStatus('✅ Live page loaded!', 'success');
        console.log('✅ Template updated and live page opened');

    } catch (error) {
        console.error('Update and view error:', error);
        updatePlaygroundStatus('❌ Error: ' + error.message, 'error');
        throw error;
    }
};

window.refreshPlaygroundTemplate = async function() {
    if (!window.generatedJSON) {
        alert('❌ No template to refresh');
        return;
    }
    
    if (!playgroundClient) {
        updatePlaygroundStatus('❌ Playground not initialized. Launch it first.', 'error');
        return;
    }
    
    try {
        updatePlaygroundStatus('🔄 Refreshing template...');
        await importElementorTemplate(window.generatedJSON);
        
        // Only open editor if playgroundClient is still valid
        if (playgroundClient && currentPageId) {
            await window.openElementorEditor();
        }
        
        updatePlaygroundStatus('✅ Template refreshed!', 'success');
    } catch (error) {
        console.error('Refresh error:', error);
        updatePlaygroundStatus('❌ Error refreshing: ' + error.message, 'error');
    }
};

window.closePlayground = function() {
    const panel = document.getElementById('playgroundPanel');
    if (panel) panel.style.display = 'none';
    console.log('Playground panel hidden');
};

// Activate Elementor Pro programmatically
window.activateElementorPro = async function() {
    if (!playgroundClient) {
        alert('❌ Please launch WordPress Playground first!');
        return;
    }
    
    try {
        updatePlaygroundStatus('🔌 Activating Elementor Pro...');
        
        const activateCode = `<?php
            require_once '/wordpress/wp-load.php';
            
            $plugin = 'elementor-pro/elementor-pro.php';
            
            // Check if plugin exists
            if (file_exists(WP_PLUGIN_DIR . '/' . $plugin)) {
                // Activate the plugin
                $result = activate_plugin($plugin);
                
                if (is_wp_error($result)) {
                    echo 'Error: ' . $result->get_error_message();
                } else {
                    echo 'Success: Elementor Pro activated!';
                }
            } else {
                echo 'Error: Elementor Pro not found. Please upload it first.';
            }
        ?>`;
        
        console.log('Running activation code...');
        const result = await playgroundClient.run({ code: activateCode });
        
        console.log('Activation result:', result);
        
        if (result && result.text) {
            if (result.text.indexOf('Success') !== -1) {
                updatePlaygroundStatus('✅ Elementor Pro activated successfully!', 'success');
                alert('✅ Elementor Pro is now active! Refresh the page to see Pro features.');
                
                // Refresh to admin plugins page
                await playgroundClient.goTo('/wp-admin/plugins.php');
            } else {
                updatePlaygroundStatus('❌ ' + result.text, 'error');
                alert(result.text);
            }
        }
        
    } catch (error) {
        console.error('Activation error:', error);
        updatePlaygroundStatus('❌ Error: ' + error.message, 'error');
        alert('Failed to activate: ' + error.message);
    }
};

// Open Playground directly without JSON import
window.openPlaygroundDirect = async function() {
    console.log('🌐 Opening WordPress Playground directly...');

    const panel = document.getElementById('playgroundPanel');
    if (panel) {
        panel.style.display = 'block';
    }

    // Check if already initialized
    if (playgroundClient) {
        console.log('✅ Playground already running');
        updatePlaygroundStatus('✅ WordPress Playground is ready!', 'success');

        // Redirect to wp-admin after 2 seconds
        setTimeout(async function() {
            await playgroundClient.goTo('/wp-admin/');
            console.log('Redirected to wp-admin');
        }, 2000);

        return;
    }

    updatePlaygroundStatus('⏳ Loading WordPress Playground library...');

    try {
        // Load the playground library first
        await loadPlaygroundLibrary();

        updatePlaygroundStatus('⏳ Launching WordPress Playground... (this takes ~30-40 seconds on first launch)');

        const iframe = document.getElementById('playgroundIframe');

        if (!iframe) {
            throw new Error('Playground iframe not found');
        }

        updatePlaygroundStatus('🌐 Starting WordPress...');
        
        console.log('Starting Playground with blueprint:', playgroundBlueprint);
        
        playgroundClient = await startPlaygroundWeb({
            iframe: iframe,
            remoteUrl: 'https://playground.wordpress.net/remote.html',
            blueprint: playgroundBlueprint
        });
        
        // Expose to window for external access
        window.playgroundClient = playgroundClient;
        
        console.log('Playground client created:', playgroundClient);
        
        updatePlaygroundStatus('📦 Installing Elementor + Hello theme...');
        
        console.log('Waiting for WordPress to be ready...');
        await playgroundClient.isReady();
        console.log('WordPress is ready!');

        updatePlaygroundStatus('✅ WordPress ready! Redirecting to dashboard...', 'success');

        // Auto-redirect to wp-admin after 2 seconds
        setTimeout(async function() {
            await playgroundClient.goTo('/wp-admin/');
            console.log('✅ Redirected to wp-admin dashboard');
            updatePlaygroundStatus('✅ WordPress Playground ready! You are in wp-admin', 'success');
        }, 2000);

        console.log('✅ Playground setup complete!');
        
    } catch (error) {
        console.error('❌ Playground error:', error);
        updatePlaygroundStatus('❌ Error: ' + error.message, 'error');
        alert('Failed to launch Playground: ' + error.message);
    }
};

// Create page and import template if playground is already running
window.importToExistingPlayground = async function() {
    if (!window.playgroundClient) {
        throw new Error('Playground not running. Start it first.');
    }
    
    if (!window.generatedJSON) {
        throw new Error('No JSON to import');
    }
    
    try {
        updatePlaygroundStatus('📄 Creating page for template...');
        
        // Create the test page if we don't have one yet
        if (!window.currentPageId) {
            const createPageCode = `<?php
                require_once '/wordpress/wp-load.php';
                $page_id = wp_insert_post(array(
                    'post_title' => 'Elementor Test Preview',
                    'post_name' => 'elementor-test-preview',
                    'post_status' => 'publish',
                    'post_type' => 'page',
                    'post_content' => ''
                ));
                if ($page_id && !is_wp_error($page_id)) {
                    update_post_meta($page_id, '_elementor_edit_mode', 'builder');
                    update_post_meta($page_id, '_elementor_template_type', 'wp-page');
                    update_post_meta($page_id, '_wp_page_template', 'elementor_canvas');
                    echo $page_id;
                } else {
                    echo '0';
                }
            ?>`;
            
            const pageResult = await window.playgroundClient.run({ code: createPageCode });
            currentPageId = parseInt(pageResult.text.trim());
            window.currentPageId = currentPageId;
            
            if (!currentPageId || isNaN(currentPageId) || currentPageId === 0) {
                throw new Error('Could not create test page');
            }
            
            console.log('📄 Created page ID:', currentPageId);
        }
        
        updatePlaygroundStatus('📄 Importing template...');
        await importElementorTemplate(window.generatedJSON);
        
        updatePlaygroundStatus('✅ Template imported! Opening Elementor editor...', 'success');
        await window.openElementorEditor();
        
        // Enable buttons
        const updateBtn = document.getElementById('updatePlaygroundBtn');
        const viewBtn = document.getElementById('viewPageBtn');
        if (updateBtn) updateBtn.disabled = false;
        if (viewBtn) viewBtn.disabled = false;
        
        updatePlaygroundStatus('✅ Template loaded in Elementor editor!', 'success');
        
    } catch (error) {
        console.error('Import error:', error);
        updatePlaygroundStatus('❌ Error: ' + error.message, 'error');
        throw error;
    }
};

// Apply site configuration to WordPress
window.applySiteConfig = async function(config) {
    if (!playgroundClient) {
        throw new Error('Playground not running. Launch it first.');
    }

    try {
        updatePlaygroundStatus('⚙️ Applying site configuration...');
        console.log('📝 Applying configuration:', config);

        const { settings, pages } = config;

        // Apply WordPress settings using JSON file approach
        if (settings) {
            // Write settings to temp file
            const settingsJson = JSON.stringify(settings);
            await playgroundClient.writeFile('/tmp/settings.json', settingsJson);

            const settingsCode = `<?php
                require_once '/wordpress/wp-load.php';

                try {
                    $settings_json = file_get_contents('/tmp/settings.json');
                    $settings = json_decode($settings_json, true);

                    if ($settings && json_last_error() === JSON_ERROR_NONE) {
                        if (isset($settings['siteTitle'])) {
                            update_option('blogname', $settings['siteTitle']);
                        }
                        if (isset($settings['tagline'])) {
                            update_option('blogdescription', $settings['tagline']);
                        }
                        if (isset($settings['adminEmail'])) {
                            update_option('admin_email', $settings['adminEmail']);
                        }
                        if (isset($settings['timezone'])) {
                            update_option('timezone_string', $settings['timezone']);
                        }
                        if (isset($settings['dateFormat'])) {
                            update_option('date_format', $settings['dateFormat']);
                        }
                        if (isset($settings['timeFormat'])) {
                            update_option('time_format', $settings['timeFormat']);
                        }
                        if (isset($settings['startOfWeek'])) {
                            update_option('start_of_week', $settings['startOfWeek']);
                        }
                        if (isset($settings['postsPerPage'])) {
                            update_option('posts_per_page', intval($settings['postsPerPage']));
                        }
                        if (isset($settings['permalinkStructure'])) {
                            update_option('permalink_structure', $settings['permalinkStructure']);
                        }
                        if (isset($settings['siteIcon'])) {
                            update_option('site_icon', intval($settings['siteIcon']));
                        }
                        if (isset($settings['blogPublic'])) {
                            update_option('blog_public', intval($settings['blogPublic']));
                        }

                        echo 'Settings applied successfully';
                    } else {
                        echo 'Error: Invalid JSON - ' . json_last_error_msg();
                    }
                } catch (Exception $e) {
                    echo 'Error: ' . $e->getMessage();
                }

                @unlink('/tmp/settings.json');
            ?>`;

            console.log('Applying WordPress settings...');
            const settingsResult = await playgroundClient.run({ code: settingsCode });
            console.log('Settings result:', settingsResult.text);

            if (settingsResult.text && settingsResult.text.includes('Error')) {
                throw new Error(settingsResult.text);
            }
        }

        // Create and configure pages using JSON file approach
        if (pages && pages.length > 0) {
            for (const page of pages) {
                // Write page data to temp file
                const pageJson = JSON.stringify(page);
                await playgroundClient.writeFile('/tmp/page_data.json', pageJson);

                const pageCode = `<?php
                    require_once '/wordpress/wp-load.php';

                    try {
                        $page_json = file_get_contents('/tmp/page_data.json');
                        $page = json_decode($page_json, true);

                        if ($page && json_last_error() === JSON_ERROR_NONE) {
                            // Check if page already exists by slug
                            $existing_page = get_page_by_path($page['slug'], OBJECT, 'page');

                            $page_data = array(
                                'post_title' => isset($page['title']) ? $page['title'] : 'Untitled',
                                'post_name' => isset($page['slug']) ? $page['slug'] : '',
                                'post_content' => isset($page['content']) ? $page['content'] : '',
                                'post_excerpt' => isset($page['excerpt']) ? $page['excerpt'] : '',
                                'post_status' => 'publish',
                                'post_type' => 'page'
                            );

                            // Update existing page or create new
                            if ($existing_page) {
                                $page_data['ID'] = $existing_page->ID;
                                $page_id = wp_update_post($page_data);
                            } else {
                                $page_id = wp_insert_post($page_data);
                            }

                            if ($page_id && !is_wp_error($page_id)) {
                                // Set Yoast SEO meta
                                if (isset($page['yoast']) && class_exists('WPSEO_Options')) {
                                    if (isset($page['yoast']['focusKeyword'])) {
                                        update_post_meta($page_id, '_yoast_wpseo_focuskw', $page['yoast']['focusKeyword']);
                                    }
                                    if (isset($page['yoast']['metaTitle'])) {
                                        update_post_meta($page_id, '_yoast_wpseo_title', $page['yoast']['metaTitle']);
                                    }
                                    if (isset($page['yoast']['metaDescription'])) {
                                        update_post_meta($page_id, '_yoast_wpseo_metadesc', $page['yoast']['metaDescription']);
                                    }
                                }
                                echo $page_id;
                            } else {
                                echo 'Error: ' . (is_wp_error($page_id) ? $page_id->get_error_message() : 'Failed to create page');
                            }
                        } else {
                            echo 'Error: Invalid page JSON - ' . json_last_error_msg();
                        }
                    } catch (Exception $e) {
                        echo 'Error: ' . $e->getMessage();
                    }

                    @unlink('/tmp/page_data.json');
                ?>`;

                console.log(`Creating page: ${page.title}...`);
                const pageResult = await playgroundClient.run({ code: pageCode });
                console.log(`Page "${page.title}" result:`, pageResult.text);

                if (pageResult.text && pageResult.text.includes('Error')) {
                    throw new Error(`Page "${page.title}": ${pageResult.text}`);
                }
            }
        }

        updatePlaygroundStatus('✅ Site configuration applied successfully!', 'success');
        console.log('✅ Configuration applied!');
        alert('✅ Settings and pages applied to WordPress!');

    } catch (error) {
        console.error('❌ Configuration error:', error);
        updatePlaygroundStatus('❌ Error: ' + error.message, 'error');
        throw error;
    }
};

// Fetch WordPress settings from playground
window.getWordPressSettings = async function() {
    if (!playgroundClient) {
        throw new Error('Playground not running');
    }

    const phpCode = `<?php
        require_once '/wordpress/wp-load.php';

        $settings = array(
            'siteTitle' => get_option('blogname'),
            'tagline' => get_option('blogdescription'),
            'adminEmail' => get_option('admin_email'),
            'timezone' => get_option('timezone_string'),
            'dateFormat' => get_option('date_format'),
            'timeFormat' => get_option('time_format'),
            'startOfWeek' => get_option('start_of_week'),
            'postsPerPage' => get_option('posts_per_page'),
            'permalinkStructure' => get_option('permalink_structure'),
            'siteIcon' => get_option('site_icon'),
            'blogPublic' => get_option('blog_public')
        );

        echo json_encode($settings);
    ?>`;

    const result = await playgroundClient.run({ code: phpCode });
    return JSON.parse(result.text);
};

// Get Elementor Style Kit from WordPress
window.getElementorStyleKit = async function() {
    if (!playgroundClient) {
        throw new Error('Playground not running');
    }

    const phpCode = `<?php
        require_once '/wordpress/wp-load.php';

        $style_kit = array();

        // Get the active kit ID
        $kit_id = get_option('elementor_active_kit');

        if ($kit_id) {
            // Get ALL settings from _elementor_page_settings (complete kit)
            $kit_meta = get_post_meta($kit_id, '_elementor_page_settings', true);

            if (is_array($kit_meta) && !empty($kit_meta)) {
                // Return the COMPLETE kit settings, not just a subset
                $style_kit = $kit_meta;
            }
        }

        // Fallback to legacy options if kit doesn't exist
        if (empty($style_kit)) {
            $style_kit = array(
                'system_colors' => get_option('elementor_scheme_color', array()),
                'system_typography' => get_option('elementor_scheme_typography', array())
            );
        }

        echo json_encode($style_kit);
    ?>`;

    const result = await playgroundClient.run({ code: phpCode });
    return JSON.parse(result.text);
};

// Set Elementor Style Kit in WordPress
window.setElementorStyleKit = async function(styleKit) {
    if (!playgroundClient) {
        throw new Error('Playground not running');
    }

    // Write style kit to temp file
    const styleKitJson = JSON.stringify(styleKit);
    await playgroundClient.writeFile('/tmp/style_kit.json', styleKitJson);

    const phpCode = `<?php
        require_once '/wordpress/wp-load.php';

        $style_kit_json = file_get_contents('/tmp/style_kit.json');
        $style_kit = json_decode($style_kit_json, true);

        if ($style_kit && json_last_error() === JSON_ERROR_NONE) {
            // Get or create active kit
            $kit_id = get_option('elementor_active_kit');

            if (!$kit_id) {
                // Create default kit
                $kit_id = wp_insert_post(array(
                    'post_title' => 'Default Kit',
                    'post_type' => 'elementor_library',
                    'post_status' => 'publish',
                    'meta_input' => array(
                        '_elementor_template_type' => 'kit'
                    )
                ));
                update_option('elementor_active_kit', $kit_id);
            }

            // Get existing settings
            $kit_settings = get_post_meta($kit_id, '_elementor_page_settings', true);
            if (!is_array($kit_settings)) {
                $kit_settings = array();
            }

            // Merge new style kit data with existing settings (preserves all properties)
            // This ensures we don't lose any Elementor settings we're not explicitly managing
            $kit_settings = array_merge($kit_settings, $style_kit);

            update_post_meta($kit_id, '_elementor_page_settings', $kit_settings);

            echo 'Style kit updated successfully';
        } else {
            echo 'Error: Invalid style kit JSON';
        }

        @unlink('/tmp/style_kit.json');
    ?>`;

    const result = await playgroundClient.run({ code: phpCode });
    console.log('Style kit update result:', result.text);

    if (result.text && result.text.includes('Error')) {
        throw new Error(result.text);
    }
};

// Get WordPress theme stylesheet (CSS)
window.getWordPressStylesheet = async function() {
    if (!playgroundClient) {
        throw new Error('Playground not running');
    }

    console.log('📄 Fetching WordPress theme stylesheet...');

    const phpCode = `<?php
        require_once '/wordpress/wp-load.php';

        // Get active theme information
        $theme = wp_get_theme();
        $theme_name = $theme->get_stylesheet();
        $theme_dir = get_stylesheet_directory();
        $stylesheet_path = $theme_dir . '/style.css';

        $result = array(
            'theme_name' => $theme_name,
            'theme_version' => $theme->get('Version'),
            'stylesheet_path' => $stylesheet_path,
            'stylesheet_exists' => file_exists($stylesheet_path)
        );

        // Read the stylesheet if it exists
        if (file_exists($stylesheet_path)) {
            $css_content = file_get_contents($stylesheet_path);
            $result['css'] = $css_content;
            $result['size'] = strlen($css_content);
        } else {
            $result['error'] = 'Stylesheet file not found at: ' . $stylesheet_path;
        }

        echo json_encode($result);
    ?>`;

    const result = await playgroundClient.run({ code: phpCode });
    const data = JSON.parse(result.text);

    console.log('✅ Stylesheet fetched:', {
        theme: data.theme_name,
        version: data.theme_version,
        size: data.size ? `${(data.size / 1024).toFixed(2)} KB` : 'N/A'
    });

    if (data.error) {
        throw new Error(data.error);
    }

    return {
        themeName: data.theme_name,
        themeVersion: data.theme_version,
        css: data.css || '',
        path: data.stylesheet_path
    };
};

// Update WordPress global stylesheet (create custom CSS file)
window.updateGlobalStylesheet = async function(css) {
    if (!playgroundClient) {
        throw new Error('Playground not running');
    }

    console.log('💾 Updating global stylesheet...');

    // Write custom CSS to uploads directory
    const customCssPath = '/wordpress/wp-content/uploads/custom-global.css';

    // Write the CSS file
    await playgroundClient.writeFile(customCssPath, css);

    // Enqueue the custom CSS in WordPress
    const phpCode = `<?php
        require_once '/wordpress/wp-load.php';

        // Create a mu-plugin to enqueue the custom CSS
        $mu_plugin_code = "<?php
/**
 * Plugin Name: Custom Global Stylesheet
 * Description: Enqueues custom global CSS
 * Version: 1.0
 */

add_action('wp_enqueue_scripts', function() {
    wp_enqueue_style(
        'custom-global-stylesheet',
        content_url('uploads/custom-global.css'),
        array(),
        filemtime(WP_CONTENT_DIR . '/uploads/custom-global.css')
    );
}, 999);

add_action('admin_enqueue_scripts', function() {
    wp_enqueue_style(
        'custom-global-stylesheet-admin',
        content_url('uploads/custom-global.css'),
        array(),
        filemtime(WP_CONTENT_DIR . '/uploads/custom-global.css')
    );
}, 999);
";

        $mu_plugins_dir = WP_CONTENT_DIR . '/mu-plugins';
        if (!file_exists($mu_plugins_dir)) {
            mkdir($mu_plugins_dir, 0755, true);
        }

        $mu_plugin_file = $mu_plugins_dir . '/custom-global-stylesheet.php';
        file_put_contents($mu_plugin_file, $mu_plugin_code);

        echo 'Custom stylesheet updated and enqueued successfully';
    ?>`;

    const result = await playgroundClient.run({ code: phpCode });
    console.log('✅ Stylesheet update result:', result.text);

    return {
        success: true,
        message: result.text,
        path: customCssPath
    };
};

// Fetch all pages from WordPress
window.getWordPressPages = async function() {
    if (!playgroundClient) {
        throw new Error('Playground not running');
    }

    const phpCode = `<?php
        require_once '/wordpress/wp-load.php';

        $pages = get_posts(array(
            'post_type' => 'page',
            'post_status' => 'publish',
            'numberposts' => -1,
            'orderby' => 'menu_order',
            'order' => 'ASC'
        ));

        $pages_data = array();
        foreach ($pages as $page) {
            $yoast = array(
                'focusKeyword' => '',
                'metaTitle' => '',
                'metaDescription' => ''
            );

            if (class_exists('WPSEO_Options')) {
                $yoast['focusKeyword'] = get_post_meta($page->ID, '_yoast_wpseo_focuskw', true);
                $yoast['metaTitle'] = get_post_meta($page->ID, '_yoast_wpseo_title', true);
                $yoast['metaDescription'] = get_post_meta($page->ID, '_yoast_wpseo_metadesc', true);
            }

            $pages_data[] = array(
                'id' => 'wp-' . $page->ID,
                'title' => $page->post_title,
                'slug' => $page->post_name,
                'content' => $page->post_content,
                'excerpt' => $page->post_excerpt,
                'yoast' => $yoast
            );
        }

        echo json_encode($pages_data);
    ?>`;

    const result = await playgroundClient.run({ code: phpCode });
    return JSON.parse(result.text);
};

// Export full WordPress site as downloadable package
window.exportPlaygroundSite = async function() {
    if (!playgroundClient) {
        throw new Error('Playground not initialized. Please launch it first.');
    }

    console.log('📦 Exporting WordPress site...');
    updatePlaygroundStatus('📦 Preparing site export...', 'info');

    try {
        // Export the entire WordPress directory as a zip
        const phpCode = `<?php
            require_once '/wordpress/wp-load.php';

            // Create a temporary directory for export
            $export_dir = '/tmp/wp-export-' . time();
            mkdir($export_dir);

            // Copy entire WordPress directory
            shell_exec('cp -r /wordpress/* ' . $export_dir . '/');

            // Create a zip file
            $zip_file = '/tmp/wordpress-site-' . time() . '.zip';
            shell_exec('cd /tmp && zip -r ' . basename($zip_file) . ' ' . basename($export_dir));

            // Read zip file
            if (file_exists($zip_file)) {
                echo base64_encode(file_get_contents($zip_file));
                @unlink($zip_file);
                shell_exec('rm -rf ' . $export_dir);
            } else {
                echo 'Error: Could not create zip file';
            }
        ?>`;

        const result = await playgroundClient.run({ code: phpCode });

        if (result.text && !result.text.includes('Error')) {
            // Convert base64 to blob and download
            const base64Data = result.text.trim();
            const binaryData = atob(base64Data);
            const bytes = new Uint8Array(binaryData.length);
            for (let i = 0; i < binaryData.length; i++) {
                bytes[i] = binaryData.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: 'application/zip' });

            // Create download link
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `wordpress-site-${Date.now()}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            updatePlaygroundStatus('✅ Site exported successfully!', 'success');
            console.log('✅ Site exported!');
            return { success: true };
        } else {
            throw new Error(result.text || 'Export failed');
        }
    } catch (error) {
        console.error('❌ Export error:', error);
        updatePlaygroundStatus('❌ Export failed: ' + error.message, 'error');
        throw error;
    }
};

// Save HTML section to Elementor template library
window.saveHtmlSectionToLibrary = async function(section) {
    if (!playgroundClient) {
        throw new Error('Playground not running. Launch it first.');
    }

    try {
        updatePlaygroundStatus('💾 Saving section to Elementor template library...');
        console.log('📝 Saving section:', section);

        const { name, html, css, js, globalCss } = section;

        if (!name || !html) {
            throw new Error('Section must have a name and HTML content');
        }

        // Write section data to temp file (including name)
        const sectionJson = JSON.stringify({ name, html, css, js });
        await playgroundClient.writeFile('/tmp/section_data.json', sectionJson);

        const phpCode = `<?php
            require_once '/wordpress/wp-load.php';

            try {
                $section_json = file_get_contents('/tmp/section_data.json');
                $section = json_decode($section_json, true);

                if ($section && json_last_error() === JSON_ERROR_NONE) {
                    $name = isset($section['name']) ? $section['name'] : 'Untitled Section';
                    $html = isset($section['html']) ? $section['html'] : '';
                    $css = isset($section['css']) ? $section['css'] : '';
                    $js = isset($section['js']) ? $section['js'] : '';
                    $global_css = isset($section['globalCss']) ? $section['globalCss'] : '';

                    // Combine HTML, CSS, and JS into a single HTML widget
                    $combined_html = $html;

                    // Append global CSS first, then section CSS as <style> tag
                    if (!empty($global_css) || !empty($css)) {
                        $combined_html .= "\n\n<style>\n";
                        if (!empty($global_css)) {
                            $combined_html .= "/* Global CSS */\n" . $global_css . "\n\n";
                        }
                        if (!empty($css)) {
                            $combined_html .= "/* Section CSS */\n" . $css . "\n";
                        }
                        $combined_html .= "</style>";
                    }

                    // Append JS as <script> tag
                    if (!empty($js)) {
                        $combined_html .= "\n\n<script>\n" . $js . "\n</script>";
                    }

                    // Debug: Log what we're about to save
                    error_log('💾 Saving to Elementor:');
                    error_log('Name: ' . $name);
                    error_log('HTML length: ' . strlen($html));
                    error_log('CSS length: ' . strlen($css));
                    error_log('JS length: ' . strlen($js));
                    error_log('Combined HTML length: ' . strlen($combined_html));

                    // Create Elementor HTML widget structure
                    $elementor_data = array(
                        array(
                            'id' => 'section_' . substr(md5(uniqid()), 0, 8),
                            'elType' => 'section',
                            'settings' => array(
                                'content_width' => 'full',
                                'padding' => array(
                                    'unit' => 'px',
                                    'top' => '0',
                                    'right' => '0',
                                    'bottom' => '0',
                                    'left' => '0',
                                    'isLinked' => true
                                ),
                                'margin' => array(
                                    'unit' => 'px',
                                    'top' => '0',
                                    'right' => '0',
                                    'bottom' => '0',
                                    'left' => '0',
                                    'isLinked' => true
                                )
                            ),
                            'elements' => array(
                                array(
                                    'id' => 'column_' . substr(md5(uniqid()), 0, 8),
                                    'elType' => 'column',
                                    'settings' => array(
                                        '_column_size' => 100,
                                        'padding' => array(
                                            'unit' => 'px',
                                            'top' => '0',
                                            'right' => '0',
                                            'bottom' => '0',
                                            'left' => '0',
                                            'isLinked' => true
                                        ),
                                        'margin' => array(
                                            'unit' => 'px',
                                            'top' => '0',
                                            'right' => '0',
                                            'bottom' => '0',
                                            'left' => '0',
                                            'isLinked' => true
                                        )
                                    ),
                                    'elements' => array(
                                        array(
                                            'id' => 'widget_' . substr(md5(uniqid()), 0, 8),
                                            'elType' => 'widget',
                                            'widgetType' => 'html',
                                            'settings' => array(
                                                'html' => $combined_html
                                            )
                                        )
                                    )
                                )
                            )
                        )
                    );

                    // Create template post
                    $template_id = wp_insert_post(array(
                        'post_title' => $name,
                        'post_type' => 'elementor_library',
                        'post_status' => 'publish',
                        'post_content' => ''
                    ));

                    if ($template_id && !is_wp_error($template_id)) {
                        // Set template metadata
                        update_post_meta($template_id, '_elementor_data', $elementor_data);
                        update_post_meta($template_id, '_elementor_template_type', 'section');
                        update_post_meta($template_id, '_elementor_edit_mode', 'builder');

                        // Store custom CSS and JS as separate meta
                        if (!empty($css)) {
                            update_post_meta($template_id, '_elementor_css', $css);
                            update_post_meta($template_id, '_custom_section_css', $css);
                        }
                        if (!empty($js)) {
                            update_post_meta($template_id, '_custom_section_js', $js);
                        }

                        // Clear Elementor cache
                        if (class_exists('\\Elementor\\Plugin')) {
                            \\Elementor\\Plugin::instance()->files_manager->clear_cache();
                        }

                        echo json_encode(array(
                            'success' => true,
                            'template_id' => $template_id,
                            'message' => 'Section saved to Elementor template library',
                            'debug' => array(
                                'name' => $name,
                                'html_length' => strlen($html),
                                'css_length' => strlen($css),
                                'js_length' => strlen($js),
                                'combined_length' => strlen($combined_html),
                                'has_style_tag' => strpos($combined_html, '<style>') !== false,
                                'has_script_tag' => strpos($combined_html, '<script>') !== false
                            )
                        ));
                    } else {
                        echo json_encode(array(
                            'success' => false,
                            'error' => is_wp_error($template_id) ? $template_id->get_error_message() : 'Failed to create template'
                        ));
                    }
                } else {
                    echo json_encode(array(
                        'success' => false,
                        'error' => 'Invalid section JSON - ' . json_last_error_msg()
                    ));
                }
            } catch (Exception $e) {
                echo json_encode(array(
                    'success' => false,
                    'error' => $e->getMessage()
                ));
            }

            @unlink('/tmp/section_data.json');
        ?>`;

        console.log('Running PHP to save template...');
        const result = await playgroundClient.run({ code: phpCode });
        console.log('Template save result:', result.text);

        const response = JSON.parse(result.text);

        if (response.success) {
            updatePlaygroundStatus('✅ Section saved to Elementor template library!', 'success');
            console.log('✅ Template ID:', response.template_id);
            return {
                success: true,
                templateId: response.template_id,
                message: response.message
            };
        } else {
            throw new Error(response.error || 'Failed to save template');
        }

    } catch (error) {
        console.error('❌ Save template error:', error);
        updatePlaygroundStatus('❌ Error: ' + error.message, 'error');
        throw error;
    }
};

// Import HTML section to a preview page
window.importHtmlSectionToPage = async function(section) {
    if (!playgroundClient) {
        throw new Error('Playground not running. Launch it first.');
    }

    try {
        updatePlaygroundStatus('📄 Creating preview page with section...');
        console.log('📝 Importing section to page:', section);

        const { name, html, css, js, globalCss } = section;

        if (!html) {
            throw new Error('Section must have HTML content');
        }

        // Write section data to temp file
        const sectionJson = JSON.stringify({ name, html, css, js });
        await playgroundClient.writeFile('/tmp/section_preview.json', sectionJson);

        const phpCode = `<?php
            require_once '/wordpress/wp-load.php';

            try {
                $section_json = file_get_contents('/tmp/section_preview.json');
                $section = json_decode($section_json, true);

                if ($section && json_last_error() === JSON_ERROR_NONE) {
                    $name = isset($section['name']) ? $section['name'] : 'Untitled Section';
                    $html = isset($section['html']) ? $section['html'] : '';
                    $css = isset($section['css']) ? $section['css'] : '';
                    $js = isset($section['js']) ? $section['js'] : '';
                    $global_css = isset($section['globalCss']) ? $section['globalCss'] : '';

                    // Combine HTML, CSS, and JS into a single HTML widget
                    $combined_html = $html;

                    // Append global CSS first, then section CSS as <style> tag
                    if (!empty($global_css) || !empty($css)) {
                        $combined_html .= "\n\n<style>\n";
                        if (!empty($global_css)) {
                            $combined_html .= "/* Global CSS */\n" . $global_css . "\n\n";
                        }
                        if (!empty($css)) {
                            $combined_html .= "/* Section CSS */\n" . $css . "\n";
                        }
                        $combined_html .= "</style>";
                    }

                    // Append JS as <script> tag
                    if (!empty($js)) {
                        $combined_html .= "\n\n<script>\n" . $js . "\n</script>";
                    }

                    // Create Elementor HTML widget structure
                    $elementor_data = array(
                        array(
                            'id' => 'section_' . substr(md5(uniqid()), 0, 8),
                            'elType' => 'section',
                            'settings' => array(
                                'content_width' => 'full',
                                'padding' => array(
                                    'unit' => 'px',
                                    'top' => '0',
                                    'right' => '0',
                                    'bottom' => '0',
                                    'left' => '0',
                                    'isLinked' => true
                                ),
                                'margin' => array(
                                    'unit' => 'px',
                                    'top' => '0',
                                    'right' => '0',
                                    'bottom' => '0',
                                    'left' => '0',
                                    'isLinked' => true
                                )
                            ),
                            'elements' => array(
                                array(
                                    'id' => 'column_' . substr(md5(uniqid()), 0, 8),
                                    'elType' => 'column',
                                    'settings' => array(
                                        '_column_size' => 100,
                                        'padding' => array(
                                            'unit' => 'px',
                                            'top' => '0',
                                            'right' => '0',
                                            'bottom' => '0',
                                            'left' => '0',
                                            'isLinked' => true
                                        ),
                                        'margin' => array(
                                            'unit' => 'px',
                                            'top' => '0',
                                            'right' => '0',
                                            'bottom' => '0',
                                            'left' => '0',
                                            'isLinked' => true
                                        )
                                    ),
                                    'elements' => array(
                                        array(
                                            'id' => 'widget_' . substr(md5(uniqid()), 0, 8),
                                            'elType' => 'widget',
                                            'widgetType' => 'html',
                                            'settings' => array(
                                                'html' => $combined_html
                                            )
                                        )
                                    )
                                )
                            )
                        )
                    );

                    // Check if preview page already exists
                    $page_slug = 'section-preview-' . sanitize_title($name);
                    $existing_page = get_page_by_path($page_slug, OBJECT, 'page');

                    if ($existing_page) {
                        $page_id = $existing_page->ID;
                        wp_update_post(array(
                            'ID' => $page_id,
                            'post_title' => 'Preview: ' . $name,
                            'post_status' => 'publish'
                        ));
                    } else {
                        $page_id = wp_insert_post(array(
                            'post_title' => 'Preview: ' . $name,
                            'post_name' => $page_slug,
                            'post_status' => 'publish',
                            'post_type' => 'page',
                            'post_content' => ''
                        ));
                    }

                    if ($page_id && !is_wp_error($page_id)) {
                        // Set Elementor page data
                        update_post_meta($page_id, '_elementor_data', $elementor_data);
                        update_post_meta($page_id, '_elementor_edit_mode', 'builder');
                        update_post_meta($page_id, '_elementor_template_type', 'wp-page');
                        update_post_meta($page_id, '_wp_page_template', 'elementor_canvas');

                        // Add custom CSS and JS if provided
                        if (!empty($css)) {
                            // Add CSS via custom CSS meta
                            update_post_meta($page_id, '_elementor_page_assets', array('css' => $css));
                        }
                        if (!empty($js)) {
                            update_post_meta($page_id, '_custom_page_js', $js);
                        }

                        // Clear Elementor cache
                        delete_post_meta($page_id, '_elementor_css');
                        if (class_exists('\\Elementor\\Plugin')) {
                            \\Elementor\\Plugin::instance()->files_manager->clear_cache();
                        }

                        // Publish the page
                        wp_update_post(array(
                            'ID' => $page_id,
                            'post_status' => 'publish'
                        ));

                        echo json_encode(array(
                            'success' => true,
                            'page_id' => $page_id,
                            'page_url' => get_permalink($page_id),
                            'edit_url' => '/wp-admin/post.php?post=' . $page_id . '&action=elementor',
                            'message' => 'Section imported to preview page'
                        ));
                    } else {
                        echo json_encode(array(
                            'success' => false,
                            'error' => is_wp_error($page_id) ? $page_id->get_error_message() : 'Failed to create page'
                        ));
                    }
                } else {
                    echo json_encode(array(
                        'success' => false,
                        'error' => 'Invalid section JSON - ' . json_last_error_msg()
                    ));
                }
            } catch (Exception $e) {
                echo json_encode(array(
                    'success' => false,
                    'error' => $e->getMessage()
                ));
            }

            @unlink('/tmp/section_preview.json');
        ?>`;

        console.log('Running PHP to create preview page...');
        const result = await playgroundClient.run({ code: phpCode });
        console.log('Preview page result:', result.text);

        const response = JSON.parse(result.text);

        if (response.success) {
            updatePlaygroundStatus('✅ Preview page created! Opening...', 'success');
            console.log('✅ Page ID:', response.page_id);

            // Navigate to the live page
            await playgroundClient.goTo('/?page_id=' + response.page_id);

            return {
                success: true,
                pageId: response.page_id,
                pageUrl: response.page_url,
                editUrl: response.edit_url,
                message: response.message
            };
        } else {
            throw new Error(response.error || 'Failed to create preview page');
        }

    } catch (error) {
        console.error('❌ Import to page error:', error);
        updatePlaygroundStatus('❌ Error: ' + error.message, 'error');
        throw error;
    }
};

/**
 * Update WordPress Playground with all sections from Section Library
 * Creates or updates a preview page with all sections combined
 */
window.updateAllSectionsPreview = async function(sections, globalCss = '') {
    if (!playgroundClient) {
        throw new Error('Playground not running. Launch it first.');
    }

    if (!sections || sections.length === 0) {
        throw new Error('No sections provided');
    }

    try {
        updatePlaygroundStatus(`📄 Creating preview page with ${sections.length} section(s)...`);
        console.log('📝 Updating preview with all sections:', sections.length);

        // Write sections data to temp file
        const sectionsJson = JSON.stringify({ sections, globalCss });
        await playgroundClient.writeFile('/tmp/all_sections_preview.json', sectionsJson);

        const phpCode = `<?php
            require_once '/wordpress/wp-load.php';

            try {
                $data_json = file_get_contents('/tmp/all_sections_preview.json');
                $data = json_decode($data_json, true);

                if ($data && json_last_error() === JSON_ERROR_NONE) {
                    $sections = isset($data['sections']) ? $data['sections'] : array();
                    $global_css = isset($data['globalCss']) ? $data['globalCss'] : '';

                    if (empty($sections)) {
                        echo json_encode(array(
                            'success' => false,
                            'error' => 'No sections provided'
                        ));
                        exit;
                    }

                    // Build Elementor data array with all sections
                    $elementor_data = array();

                    foreach ($sections as $section) {
                        $name = isset($section['name']) ? $section['name'] : 'Untitled Section';
                        $html = isset($section['html']) ? $section['html'] : '';
                        $css = isset($section['css']) ? $section['css'] : '';
                        $js = isset($section['js']) ? $section['js'] : '';

                        // Combine HTML, CSS, and JS into a single HTML widget
                        $combined_html = $html;

                        // Append global CSS first, then section CSS as <style> tag
                        if (!empty($global_css) || !empty($css)) {
                            $combined_html .= "\\n\\n<style>\\n";
                            if (!empty($global_css)) {
                                $combined_html .= "/* Global CSS */\\n" . $global_css . "\\n\\n";
                            }
                            if (!empty($css)) {
                                $combined_html .= "/* Section CSS */\\n" . $css . "\\n";
                            }
                            $combined_html .= "</style>";
                        }

                        // Append JS as <script> tag
                        if (!empty($js)) {
                            $combined_html .= "\\n\\n<script>\\n" . $js . "\\n</script>";
                        }

                        // Create Elementor section structure
                        $elementor_data[] = array(
                            'id' => 'section_' . substr(md5(uniqid()), 0, 8),
                            'elType' => 'section',
                            'settings' => array(
                                'content_width' => 'full',
                                'padding' => array(
                                    'unit' => 'px',
                                    'top' => '0',
                                    'right' => '0',
                                    'bottom' => '0',
                                    'left' => '0',
                                    'isLinked' => true
                                ),
                                'margin' => array(
                                    'unit' => 'px',
                                    'top' => '0',
                                    'right' => '0',
                                    'bottom' => '0',
                                    'left' => '0',
                                    'isLinked' => true
                                )
                            ),
                            'elements' => array(
                                array(
                                    'id' => 'column_' . substr(md5(uniqid()), 0, 8),
                                    'elType' => 'column',
                                    'settings' => array(
                                        '_column_size' => 100,
                                        'padding' => array(
                                            'unit' => 'px',
                                            'top' => '0',
                                            'right' => '0',
                                            'bottom' => '0',
                                            'left' => '0',
                                            'isLinked' => true
                                        ),
                                        'margin' => array(
                                            'unit' => 'px',
                                            'top' => '0',
                                            'right' => '0',
                                            'bottom' => '0',
                                            'left' => '0',
                                            'isLinked' => true
                                        )
                                    ),
                                    'elements' => array(
                                        array(
                                            'id' => 'widget_' . substr(md5(uniqid()), 0, 8),
                                            'elType' => 'widget',
                                            'widgetType' => 'html',
                                            'settings' => array(
                                                'html' => $combined_html
                                            )
                                        )
                                    )
                                )
                            )
                        );
                    }

                    // Check if preview page already exists
                    $page_slug = 'sections-preview-all';
                    $existing_page = get_page_by_path($page_slug, OBJECT, 'page');

                    if ($existing_page) {
                        $page_id = $existing_page->ID;
                        wp_update_post(array(
                            'ID' => $page_id,
                            'post_title' => 'Preview: All Sections (' . count($sections) . ')',
                            'post_status' => 'publish'
                        ));
                    } else {
                        $page_id = wp_insert_post(array(
                            'post_title' => 'Preview: All Sections (' . count($sections) . ')',
                            'post_name' => $page_slug,
                            'post_status' => 'publish',
                            'post_type' => 'page',
                            'post_content' => ''
                        ));
                    }

                    if ($page_id && !is_wp_error($page_id)) {
                        // Set Elementor page data
                        update_post_meta($page_id, '_elementor_data', $elementor_data);
                        update_post_meta($page_id, '_elementor_edit_mode', 'builder');
                        update_post_meta($page_id, '_elementor_template_type', 'wp-page');
                        update_post_meta($page_id, '_wp_page_template', 'elementor_canvas');

                        // Clear Elementor cache
                        delete_post_meta($page_id, '_elementor_css');
                        if (class_exists('\\\\Elementor\\\\Plugin')) {
                            \\\\Elementor\\\\Plugin::instance()->files_manager->clear_cache();
                        }

                        // Publish the page
                        wp_update_post(array(
                            'ID' => $page_id,
                            'post_status' => 'publish'
                        ));

                        echo json_encode(array(
                            'success' => true,
                            'page_id' => $page_id,
                            'page_url' => get_permalink($page_id),
                            'edit_url' => '/wp-admin/post.php?post=' . $page_id . '&action=elementor',
                            'sections_count' => count($sections),
                            'message' => count($sections) . ' section(s) imported to preview page'
                        ));
                    } else {
                        echo json_encode(array(
                            'success' => false,
                            'error' => is_wp_error($page_id) ? $page_id->get_error_message() : 'Failed to create page'
                        ));
                    }
                } else {
                    echo json_encode(array(
                        'success' => false,
                        'error' => 'Invalid sections JSON - ' . json_last_error_msg()
                    ));
                }
            } catch (Exception $e) {
                echo json_encode(array(
                    'success' => false,
                    'error' => $e->getMessage()
                ));
            }

            @unlink('/tmp/all_sections_preview.json');
        ?>`;

        console.log('Running PHP to create/update preview page with all sections...');
        const result = await playgroundClient.run({ code: phpCode });
        console.log('Preview page result:', result.text);

        const response = JSON.parse(result.text);

        if (response.success) {
            updatePlaygroundStatus(`✅ Preview updated with ${response.sections_count} section(s)! Opening...`, 'success');
            console.log('✅ Page ID:', response.page_id);

            // Navigate to the live page
            await playgroundClient.goTo('/?page_id=' + response.page_id);

            return {
                success: true,
                pageId: response.page_id,
                pageUrl: response.page_url,
                editUrl: response.edit_url,
                sectionsCount: response.sections_count,
                message: response.message
            };
        } else {
            throw new Error(response.error || 'Failed to create preview page');
        }

    } catch (error) {
        console.error('❌ Update all sections preview error:', error);
        updatePlaygroundStatus('❌ Error: ' + error.message, 'error');
        throw error;
    }
};

// Deploy Elementor Widget to WordPress Playground
window.deployElementorWidget = async function(widgetPhp, widgetCss = '', widgetJs = '') {
    if (!playgroundClient) {
        throw new Error('Playground not running. Launch it first.');
    }

    try {
        updatePlaygroundStatus('🔧 Deploying Elementor widget...');

        // Extract widget class name from PHP code
        const classMatch = widgetPhp.match(/class\s+(\w+)/);
        const widgetClassName = classMatch ? classMatch[1] : 'Elementor_Custom_Widget';

        // Extract widget name from get_name() method
        const nameMatch = widgetPhp.match(/return\s+['"]([\w-]+)['"]\s*;/);
        const widgetSlug = nameMatch ? nameMatch[1] : 'custom_widget';

        console.log('📦 Widget details:', { className: widgetClassName, slug: widgetSlug });

        // CRITICAL: Check for PHP syntax errors BEFORE deploying
        const syntaxCheckCode = `<?php
            $widget_code = <<<'PHPCODE'
${widgetPhp}
PHPCODE;

            // Write to temp file and check syntax
            $temp_file = '/tmp/widget-check.php';
            file_put_contents($temp_file, $widget_code);

            exec('php -l ' . $temp_file . ' 2>&1', $output, $return_code);

            if ($return_code !== 0) {
                echo 'PHP_SYNTAX_ERROR: ' . implode("\\n", $output);
            } else {
                echo 'PHP_SYNTAX_OK';
            }

            unlink($temp_file);
        ?>`;

        console.log('🔍 Checking PHP syntax...');
        const syntaxCheck = await playgroundClient.run({ code: syntaxCheckCode });
        console.log('📋 Syntax check result:', syntaxCheck.text);

        if (syntaxCheck.text.includes('PHP_SYNTAX_ERROR')) {
            const errorMsg = syntaxCheck.text.replace('PHP_SYNTAX_ERROR: ', '');
            console.error('❌ PHP SYNTAX ERROR IN WIDGET:', errorMsg);
            throw new Error(`Widget has PHP syntax errors:\n\n${errorMsg}\n\nFix these errors and try again.`);
        }

        // Create plugin directory
        const pluginSlug = `elementor-${widgetSlug}`;
        const pluginDir = `/wordpress/wp-content/plugins/${pluginSlug}`;

        // Main plugin file with widget registration
        const mainPluginFile = `<?php
/**
 * Plugin Name: ${widgetClassName}
 * Description: Custom Elementor widget
 * Version: 1.0.0
 * Requires Plugins: elementor
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// Register custom widget category
function register_hustle_tools_category( $elements_manager ) {
    $elements_manager->add_category(
        'hustle-tools',
        [
            'title' => __( 'Hustle Tools', 'text-domain' ),
            'icon' => 'fa fa-plug',
        ]
    );
}
add_action( 'elementor/elements/categories_registered', 'register_hustle_tools_category' );

// Register the widget
function register_${widgetSlug}_widget( $widgets_manager ) {
    require_once( __DIR__ . '/widget.php' );
    $widgets_manager->register( new ${widgetClassName}() );
}
add_action( 'elementor/widgets/register', 'register_${widgetSlug}_widget' );

// Enqueue widget styles
function ${widgetSlug}_enqueue_styles() {
    if ( file_exists( __DIR__ . '/widget.css' ) ) {
        wp_enqueue_style(
            '${widgetSlug}-style',
            plugins_url( 'widget.css', __FILE__ ),
            [],
            '1.0.0'
        );
    }
}
add_action( 'wp_enqueue_scripts', '${widgetSlug}_enqueue_styles' );
add_action( 'elementor/editor/after_enqueue_styles', '${widgetSlug}_enqueue_styles' );

// Enqueue widget scripts
function ${widgetSlug}_enqueue_scripts() {
    if ( file_exists( __DIR__ . '/widget.js' ) ) {
        wp_enqueue_script(
            '${widgetSlug}-script',
            plugins_url( 'widget.js', __FILE__ ),
            [ 'jquery' ],
            '1.0.0',
            true
        );
    }
}
add_action( 'wp_enqueue_scripts', '${widgetSlug}_enqueue_scripts' );
add_action( 'elementor/frontend/after_register_scripts', '${widgetSlug}_enqueue_scripts' );
`;

        // Create plugin directory
        await playgroundClient.mkdir(pluginDir);
        console.log('📁 Created plugin directory:', pluginDir);

        // Write plugin files
        await playgroundClient.writeFile(`${pluginDir}/${pluginSlug}.php`, mainPluginFile);
        await playgroundClient.writeFile(`${pluginDir}/widget.php`, widgetPhp);

        if (widgetCss && widgetCss.trim()) {
            await playgroundClient.writeFile(`${pluginDir}/widget.css`, widgetCss);
        }

        if (widgetJs && widgetJs.trim()) {
            await playgroundClient.writeFile(`${pluginDir}/widget.js`, widgetJs);
        }

        console.log('✅ Widget files written');

        // Activate the plugin
        const activateCode = `<?php
            require_once '/wordpress/wp-load.php';
            require_once ABSPATH . 'wp-admin/includes/plugin.php';

            $plugin_file = '${pluginSlug}/${pluginSlug}.php';

            if ( !is_plugin_active( $plugin_file ) ) {
                $result = activate_plugin( $plugin_file );
                if ( is_wp_error( $result ) ) {
                    echo 'ERROR: ' . $result->get_error_message();
                } else {
                    echo 'SUCCESS: Widget activated';
                }
            } else {
                echo 'INFO: Widget already active';
            }
        ?>`;

        const activateResult = await playgroundClient.run({ code: activateCode });
        console.log('🔌 Activation result:', activateResult.text);

        // Force Elementor to refresh widget library and reload editor
        const refreshCode = `<?php
            require_once '/wordpress/wp-load.php';

            // Clear Elementor cache and regenerate
            if ( class_exists( '\\Elementor\\Plugin' ) ) {
                // Clear all Elementor caches
                \\Elementor\\Plugin::instance()->files_manager->clear_cache();

                // Regenerate CSS files
                if ( method_exists( \\Elementor\\Plugin::instance()->files_manager, 'regenerate_all_files' ) ) {
                    \\Elementor\\Plugin::instance()->files_manager->regenerate_all_files();
                }

                // Force widget cache refresh
                delete_transient( 'elementor_remote_info_api_data_' . ELEMENTOR_VERSION );
                wp_cache_flush();

                echo 'SUCCESS: Elementor cache cleared and regenerated';
            } else {
                echo 'ERROR: Elementor not loaded';
            }
        ?>`;

        try {
            const refreshResult = await playgroundClient.run({ code: refreshCode });
            console.log('🔄 Cache refresh result:', refreshResult.text);

            // If we're in an Elementor editor, try to reload it
            try {
                // Check if we're in an iframe with Elementor editor
                const iframeDoc = playgroundClient.iframe?.contentDocument || playgroundClient.iframe?.contentWindow?.document;
                if (iframeDoc && iframeDoc.location.href.includes('elementor')) {
                    console.log('🔄 Reloading Elementor editor...');
                    iframeDoc.location.reload();
                }
            } catch (e) {
                console.log('⚠️ Could not reload Elementor editor (may not be open)');
            }
        } catch (error) {
            console.warn('⚠️ Could not clear Elementor cache:', error);
        }

        updatePlaygroundStatus('✅ Widget deployed successfully!', 'success');

        return {
            success: true,
            widgetSlug,
            widgetClassName,
            message: `Widget "${widgetClassName}" deployed and activated! You can now find it in the Elementor editor sidebar.`
        };

    } catch (error) {
        console.error('❌ Widget deployment error:', error);
        updatePlaygroundStatus('❌ Error: ' + error.message, 'error');
        throw error;
    }
};

// Auto-start playground on page load (if enabled)
if (autoStartPlayground) {
    window.addEventListener('DOMContentLoaded', function() {
        console.log('🚀 Auto-starting WordPress Playground...');
        setTimeout(function() {
            window.openPlaygroundDirect();
        }, 1000);
    });
}

console.log('✅ WordPress Playground module loaded');
