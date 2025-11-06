# WordPress Playground Import Guide

**Date:** 2025-11-06  
**Topics:** Importing Style Kit JSON & Custom CSS into WordPress Playground

---

## Overview

**Questions:**
1. Can we import the Style Kit JSON into the Elementor Playground?
2. Can we import CSS into the theme custom CSS files?

**Answers:**
✅ **YES to both!** Here's how:

---

## 1. Importing Style Kit JSON into Elementor (WordPress Playground)

### Method A: Through Elementor's Import API ⭐ **Recommended**

```javascript
// In your WordPress Playground client code
async function importStyleKitToElementor(styleKitJSON) {
  const playground = window.PlaygroundClient;
  
  // Run PHP code to import the style kit
  const phpCode = `<?php
    // Import style kit data into Elementor
    update_option('elementor_active_kit', YOUR_KIT_ID);
    update_post_meta(YOUR_KIT_ID, '_elementor_page_settings', json_decode('${JSON.stringify(styleKitJSON)}', true));
  ?>`;
  
  await playground.run({ code: phpCode });
}
```

### Method B: Through WordPress REST API

```javascript
// Use WordPress Playground's REST API proxy
async function importViaREST(styleKitJSON) {
  const playground = window.PlaygroundClient;
  
  // Step 1: Create or update the Elementor Kit post
  const response = await playground.request('/wp-json/wp/v2/elementor_library', {
    method: 'POST',
    body: JSON.stringify({
      title: 'AI Generated Style Kit',
      type: 'elementor_library',
      template_type: 'kit',
      meta: {
        _elementor_page_settings: styleKitJSON
      }
    })
  });
  
  const kitId = response.id;
  
  // Step 2: Set it as the active kit
  await playground.run({
    code: `<?php update_option('elementor_active_kit', ${kitId}); ?>`
  });
}
```

### Method C: Direct File Upload (Simplest for Testing)

```javascript
// Upload JSON file and trigger Elementor import
async function uploadStyleKit(styleKitJSON) {
  const playground = window.PlaygroundClient;
  
  // Create a JSON file in WordPress uploads directory
  const jsonString = JSON.stringify(styleKitJSON, null, 2);
  await playground.writeFile(
    '/wordpress/wp-content/uploads/style-kit.json',
    jsonString
  );
  
  // Run PHP to import it
  await playground.run({
    code: `<?php
      $json = file_get_contents(WP_CONTENT_DIR . '/uploads/style-kit.json');
      $data = json_decode($json, true);
      
      // Import into Elementor
      \\Elementor\\Plugin::$instance->kits_manager->import_kit($data);
    ?>`
  });
}
```

---

## 2. Importing Custom CSS into WordPress Theme (Appearance > Customize > Additional CSS)

### Method A: Through WordPress Customizer API ⭐ **Recommended**

```javascript
async function importCustomCSS(cssString) {
  const playground = window.PlaygroundClient;
  
  // The custom CSS is stored in wp_options as 'custom_css_post_id'
  // and the actual CSS is in a post of type 'custom_css'
  
  const phpCode = `<?php
    // Get or create the custom CSS post
    $core_css = wp_get_custom_css();
    
    // Append or replace with new CSS
    $new_css = '${cssString.replace(/'/g, "\\'")}';
    
    // Save it
    $args = array(
      'css' => $new_css,
    );
    
    wp_update_custom_css_post(json_encode($args));
  ?>`;
  
  await playground.run({ code: phpCode });
}
```

### Method B: Direct wp_options Update

```javascript
async function importCustomCSSSimple(cssString) {
  const playground = window.PlaygroundClient;
  
  const phpCode = `<?php
    // Create custom CSS post
    $css_post = wp_insert_post(array(
      'post_title' => 'Custom CSS',
      'post_content' => '${cssString.replace(/'/g, "\\'")}',
      'post_status' => 'publish',
      'post_type' => 'custom_css'
    ));
    
    // Link it to the theme
    $stylesheet = get_stylesheet();
    update_option("custom_css_post_id_$stylesheet", $css_post);
  ?>`;
  
  await playground.run({ code: phpCode });
}
```

### Method C: Write to theme style.css (Alternative)

```javascript
async function appendToThemeStylesheet(cssString) {
  const playground = window.PlaygroundClient;
  
  // Read current theme stylesheet
  const currentCSS = await playground.readFile('/wordpress/wp-content/themes/YOUR_THEME/style.css');
  
  // Append new CSS
  const newCSS = currentCSS + '\n\n/* AI Generated Styles */\n' + cssString;
  
  // Write back
  await playground.writeFile('/wordpress/wp-content/themes/YOUR_THEME/style.css', newCSS);
}
```

---

## 3. Complete Integration Example

Here's a complete example showing how to import both Style Kit JSON and Custom CSS:

```typescript
// In your src/components/elementor/HublPreviewPanel.tsx or similar

import { useState } from 'react';

export function WordPressPlaygroundImporter() {
  const [importing, setImporting] = useState(false);
  
  const importToWordPress = async () => {
    setImporting(true);
    
    try {
      // Get the playground client
      const playground = window.PlaygroundClient;
      
      if (!playground) {
        alert('WordPress Playground not loaded!');
        return;
      }
      
      // 1. Get current style kit JSON
      const styleKit = getCurrentStyleKit(); // Your function to get the kit
      
      // 2. Get custom CSS from your CSS tab
      const customCSS = getCustomCSS(); // Your function to get custom CSS
      
      // 3. Import Style Kit
      await playground.run({
        code: `<?php
          $kit_data = json_decode('${JSON.stringify(styleKit)}', true);
          
          // Get active kit ID or create new one
          $kit_id = get_option('elementor_active_kit');
          
          if (!$kit_id) {
            $kit_id = wp_insert_post(array(
              'post_title' => 'AI Generated Kit',
              'post_type' => 'elementor_library',
              'post_status' => 'publish',
            ));
            update_option('elementor_active_kit', $kit_id);
          }
          
          // Update kit settings
          update_post_meta($kit_id, '_elementor_page_settings', $kit_data);
          
          echo "Style Kit imported successfully!";
        ?>`
      });
      
      // 4. Import Custom CSS
      await playground.run({
        code: `<?php
          $css = '${customCSS.replace(/'/g, "\\'")}';
          
          // Get theme stylesheet name
          $stylesheet = get_stylesheet();
          
          // Get or create custom CSS post
          $css_post_id = get_theme_mod("custom_css_post_id");
          
          if (!$css_post_id) {
            $css_post_id = wp_insert_post(array(
              'post_title' => 'Custom CSS',
              'post_content' => $css,
              'post_status' => 'publish',
              'post_type' => 'custom_css'
            ));
            update_theme_mod("custom_css_post_id", $css_post_id);
          } else {
            wp_update_post(array(
              'ID' => $css_post_id,
              'post_content' => $css
            ));
          }
          
          echo "Custom CSS imported successfully!";
        ?>`
      });
      
      alert('✅ Successfully imported Style Kit and Custom CSS to WordPress!');
      
    } catch (error) {
      console.error('Import error:', error);
      alert('❌ Import failed: ' + error.message);
    } finally {
      setImporting(false);
    }
  };
  
  return (
    <button
      onClick={importToWordPress}
      disabled={importing}
      style={{ padding: '12px 24px', fontSize: '14px', fontWeight: 600 }}
    >
      {importing ? '⏳ Importing...' : '🚀 Import to WordPress Playground'}
    </button>
  );
}
```

---

## 4. WordPress Playground API Reference

### Key Methods:

```javascript
// Execute PHP code
await playground.run({ code: '<?php /* your code */ ?>' });

// Read file
const content = await playground.readFile('/path/to/file.ext');

// Write file
await playground.writeFile('/path/to/file.ext', 'content');

// Make HTTP request to WordPress
const response = await playground.request('/wp-json/wp/v2/posts');

// Navigate to URL in playground
await playground.goTo('/wp-admin/customize.php');
```

### WordPress Playground Client Setup:

```typescript
// In your component
declare global {
  interface Window {
    PlaygroundClient: {
      run: (options: { code: string }) => Promise<any>;
      readFile: (path: string) => Promise<string>;
      writeFile: (path: string, content: string) => Promise<void>;
      request: (url: string, options?: RequestInit) => Promise<Response>;
      goTo: (url: string) => Promise<void>;
    };
  }
}
```

---

## 5. Implementation Checklist

### In Your Hustle-Tools App:

- [ ] Add "Import to WordPress" button in Elementor editor
- [ ] Get Style Kit JSON from current state
- [ ] Get Custom CSS from CSS tab
- [ ] Check if WordPress Playground is loaded (`window.PlaygroundClient`)
- [ ] Execute PHP import commands via `playground.run()`
- [ ] Show success/error messages
- [ ] Optionally navigate to WordPress Customizer to show results

### Testing:

- [ ] Start WordPress Playground in your HublPreviewPanel
- [ ] Generate a Style Kit with AI
- [ ] Click "Import to WordPress"
- [ ] Check WordPress Admin → Elementor → Settings → Style to verify
- [ ] Check Appearance → Customize → Additional CSS to verify

---

## 6. Error Handling

```javascript
const importWithErrorHandling = async () => {
  try {
    if (!window.PlaygroundClient) {
      throw new Error('WordPress Playground not loaded. Please start Playground first.');
    }
    
    if (!styleKit || Object.keys(styleKit).length === 0) {
      throw new Error('No Style Kit to import. Please generate a kit first.');
    }
    
    // Import logic here...
    
  } catch (error) {
    console.error('[WordPress Import Error]', error);
    
    // Show user-friendly message
    const errorMessages = {
      'Playground not loaded': 'Please make sure WordPress Playground is running first.',
      'No Style Kit': 'Please generate a Style Kit before importing.',
      'Permission denied': 'WordPress Playground doesn't have permission to write files.',
    };
    
    const userMessage = Object.entries(errorMessages).find(([key]) => 
      error.message.includes(key)
    )?.[1] || error.message;
    
    alert(`❌ Import Failed: ${userMessage}`);
  }
};
```

---

## 7. Next Steps

1. **Add Import Button** to `HublPreviewPanel.tsx` or `ElementorChat.tsx`
2. **Test with Simple CSS** first (just background color)
3. **Then test Style Kit JSON** import
4. **Add progress indicators** for better UX
5. **Consider batch imports** if you have multiple pages

---

## 8. Resources

- WordPress Playground Docs: https://wordpress.github.io/wordpress-playground/
- Elementor Developers: https://developers.elementor.com/
- WP Customize API: https://developer.wordpress.org/themes/customize-api/

---

**Status:** 📋 Ready to Implement  
**Complexity:** Medium (30-60 minutes)  
**Value:** High (seamless workflow from design to WordPress)

