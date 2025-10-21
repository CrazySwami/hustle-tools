// WordPress Playground Integration
import { startPlaygroundWeb } from 'https://playground.wordpress.net/client/index.js';

let playgroundClient = null;
let currentPageId = null;
let currentPageSlug = 'elementor-test-preview';

// Expose globals for external access
window.playgroundClient = null;
window.currentPageId = null;

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
        {
            "step": "mkdir",
            "path": "/wordpress/wp-content/mu-plugins"
        },
        {
            "step": "runPHP",
            "code": "<?php require_once '/wordpress/wp-load.php'; update_option('elementor_onboarded', true); update_option('elementor_tracker_notice', '1'); update_option('elementor_pro_license_key', 'playground_test_key'); update_option('_elementor_pro_license_data', array('success' => true, 'license' => 'valid', 'item_name' => 'Elementor Pro', 'expires' => 'lifetime')); ?>"
        },
        {
            "step": "writeFile",
            "path": "/wordpress/wp-content/mu-plugins/elementor-pro-playground-bypass.php",
            "data": "<?php\n/**\n * Plugin Name: Elementor Pro Playground Bypass\n * Description: Bypasses Elementor Pro license checks in WordPress Playground\n * Version: 1.0\n */\n\n// Bypass ALL external HTTP requests to Elementor servers\nadd_filter('pre_http_request', function($preempt, $args, $url) {\n    if (strpos($url, 'elementor.com') !== false || strpos($url, 'my.elementor.com') !== false) {\n        return array(\n            'response' => array('code' => 200, 'message' => 'OK'),\n            'headers' => array(),\n            'body' => json_encode(array(\n                'success' => true,\n                'license' => 'valid',\n                'item_name' => 'Elementor Pro',\n                'expires' => 'lifetime',\n                'license_limit' => 1000,\n                'site_count' => 1,\n                'activations_left' => 999,\n                'message' => 'License is active'\n            ))\n        );\n    }\n    return $preempt;\n}, 1, 3);\n\n// Force license as always valid\nadd_filter('elementor_pro/license/api_get_license_data', function() {\n    return (object) array(\n        'success' => true,\n        'license' => 'valid',\n        'item_name' => 'Elementor Pro',\n        'expires' => 'lifetime'\n    );\n}, 1);\n\nadd_filter('elementor/admin/license/get_license_data', function($data) {\n    return array(\n        'success' => true,\n        'license' => 'valid',\n        'item_name' => 'Elementor Pro',\n        'expires' => 'lifetime'\n    );\n}, 1);\n\n// Bypass all license checks\nadd_filter('elementor/admin/license/is_license_active', '__return_true', 1);\nadd_filter('elementor/admin/license/is_license_expired', '__return_false', 1);\nadd_filter('elementor_pro/core/connect/is_connected', '__return_true', 1);\n\n// Suppress activation redirect to prevent errors\nadd_filter('wp_redirect', function($location) {\n    if (strpos($location, 'elementor') !== false && strpos($location, 'activated') !== false) {\n        return admin_url('plugins.php?activate=true');\n    }\n    return $location;\n}, 1);\n\n// Add admin notice that Pro is active\nadd_action('admin_notices', function() {\n    if (is_plugin_active('elementor-pro/elementor-pro.php')) {\n        echo '<div class=\"notice notice-success\"><p><strong>Elementor Pro is active!</strong> License bypass enabled for WordPress Playground.</p></div>';\n    }\n});\n"
        }
    ]
};

let autoStartPlayground = false; // Set to true to auto-start on page load

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

    const elementorContent = elementorJSON.content || [];
    console.log('Importing Elementor content (type:', typeof elementorContent, '):', elementorContent);

    // Safely stringify with error handling
    let contentStr;
    try {
        contentStr = JSON.stringify(elementorContent);
        console.log('Stringified content length:', contentStr.length);
    } catch (error) {
        console.error('JSON stringify error:', error);
        throw new Error('Cannot stringify Elementor content: ' + error.message);
    }

    const escapedContent = contentStr.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r');
    
    const phpCode = `<?php
        require_once '/wordpress/wp-load.php';
        $page_id = ${currentPageId};
        $elementor_data = json_decode('${escapedContent}', true);
        if ($elementor_data) {
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
            
            echo 'Success';
        } else {
            echo 'Error: Invalid JSON';
        }
    ?>`;
    
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
    
    updatePlaygroundStatus('⏳ Launching WordPress Playground... (this takes ~30-40 seconds on first launch)');
    
    try {
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
    
    updatePlaygroundStatus('⏳ Launching WordPress Playground... (this takes ~30-40 seconds on first launch)');
    
    try {
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
