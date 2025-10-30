# HTML Generator Modal + Hot Reload Implementation Plan

## Overview
1. Add HTML Generator modal button to Code Editor (non-tool, just UI)
2. Implement hot reload for PHP/CSS changes that auto-refreshes WordPress Playground and Elementor editor

---

## Part 1: HTML Generator Modal

### Goal
Bring back the HTML Generator modal for quick full-page generation without using AI tool calling. This provides a fast, visual way to generate HTML/CSS/JS or Elementor widgets with image upload support.

### Current State
- `HTMLGeneratorDialog` component exists at `/src/components/html-generator/HTMLGeneratorDialog.tsx`
- Has image upload (max 3), image analysis with Claude Haiku 4.5
- Supports two modes: "HTML Section" and "Elementor Widget"
- Optional: Use extracted CSS classes from Style Guide
- NOT currently integrated into Code Editor

### Implementation

#### 1. Add "Generate" Button to Code Editor Toolbar

**Location**: [HtmlSectionEditor.tsx:1502-1557](src/components/elementor/HtmlSectionEditor.tsx#L1502-L1557)

Currently has "Deploy to Playground" and "Review Code" buttons. Add "Generate" button next to them.

```typescript
// Add state
const [showGeneratorDialog, setShowGeneratorDialog] = useState(false);

// Add button in toolbar (line ~1500)
<button
  onClick={() => setShowGeneratorDialog(true)}
  style={{
    flex: 1,
    padding: '10px 16px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  }}
  title="Generate HTML/CSS/JS or Elementor Widget with AI"
>
  <FileCodeIcon size={16} />
  Generate
</button>
```

#### 2. Import HTMLGeneratorDialog

```typescript
import { HTMLGeneratorDialog } from '@/components/html-generator/HTMLGeneratorDialog';
import { useGlobalStylesheet } from '@/lib/global-stylesheet-context';
```

#### 3. Add Dialog Rendering

```typescript
{/* HTML Generator Dialog */}
{showGeneratorDialog && (
  <HTMLGeneratorDialog
    designSystemSummary={designSystemSummary}
    onGenerate={handleGenerateFromDialog}
    onClose={() => setShowGeneratorDialog(false)}
  />
)}
```

#### 4. Implement Generation Handler

```typescript
const handleGenerateFromDialog = async (
  description: string,
  images: Array<{ url: string; filename: string; description?: string }>,
  mode?: 'section' | 'widget',
  useExtractedClasses?: boolean
) => {
  try {
    // Build prompt with description + image descriptions
    let prompt = description;

    if (images.length > 0) {
      prompt += '\n\n**Reference Images:**\n';
      images.forEach((img, i) => {
        if (img.description) {
          prompt += `\n${i + 1}. ${img.filename}:\n${img.description}\n`;
        }
      });
    }

    // Add extracted classes if enabled
    if (useExtractedClasses && designSystemSummary) {
      prompt += '\n\n**Available CSS Classes:**\n';
      prompt += `Extract from: ${designSystemSummary.extractedFrom}\n`;
      prompt += `Total classes: ${designSystemSummary.totalClasses}\n`;
      prompt += `Categories: ${Object.keys(designSystemSummary.classesByCategory).join(', ')}\n`;
      // Could add actual class names here if needed
    }

    // Call generation API
    const response = await fetch('/api/generate-html', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        mode, // 'section' or 'widget'
        images: images.map(img => ({
          url: img.url,
          filename: img.filename,
        })),
        model: 'anthropic/claude-sonnet-4-5-20250929', // Or use selected model
        currentSection: section,
      }),
    });

    if (!response.ok) throw new Error('Generation failed');
    if (!response.body) throw new Error('No response body');

    // Stream HTML/CSS/JS/PHP to editor
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let htmlBuffer = '';
    let cssBuffer = '';
    let jsBuffer = '';
    let phpBuffer = '';
    let currentFile = '';

    setActiveCodeTab('html'); // Switch to HTML tab first

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'file-start') {
              currentFile = data.file; // 'html', 'css', 'js', 'php'
              if (currentFile !== 'html') {
                setActiveCodeTab(currentFile as 'css' | 'js'); // Switch tabs as we go
              }
            } else if (data.type === 'content' && data.file) {
              // Append to buffer
              if (data.file === 'html') htmlBuffer += data.content;
              else if (data.file === 'css') cssBuffer += data.content;
              else if (data.file === 'js') jsBuffer += data.content;
              else if (data.file === 'php') phpBuffer += data.content;

              // Update editor in real-time
              onUpdateSection({
                [data.file]: data.file === 'html' ? htmlBuffer :
                             data.file === 'css' ? cssBuffer :
                             data.file === 'js' ? jsBuffer :
                             phpBuffer
              });
            } else if (data.type === 'done') {
              console.log('✅ Generation complete!');
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }

    // Close dialog on success
    setShowGeneratorDialog(false);

    // Show success message
    alert('✅ Generation complete! Code has been added to the editor.');

  } catch (error) {
    console.error('Generation error:', error);
    alert('❌ Generation failed. Please try again.');
  }
};
```

#### 5. Create/Update API Route

**New file**: `/src/app/api/generate-html/route.ts`

```typescript
import { streamText } from 'ai';
import { createModel } from '@/lib/ai-models';

export async function POST(req: Request) {
  const { prompt, mode, images, model, currentSection } = await req.json();

  const systemPrompt = mode === 'widget'
    ? `You are an expert Elementor widget developer...

Generate a complete, production-ready Elementor widget PHP class with:
- Full widget registration
- Comprehensive controls (text, color, typography, dimensions, etc.)
- Clean render() method with Elementor's template system
- Proper escaping and sanitization
- CSS and JS files if needed

Return ONLY the code in this format:
\`\`\`php
// Widget code here
\`\`\`

\`\`\`css
// Optional CSS here
\`\`\`

\`\`\`javascript
// Optional JS here
\`\`\`
`
    : `You are an expert HTML/CSS/JS developer...

Generate clean, modern, responsive code based on the user's description.

Return ONLY the code in this format:
\`\`\`html
<!-- HTML code here -->
\`\`\`

\`\`\`css
/* CSS code here */
\`\`\`

\`\`\`javascript
// JS code here (if needed)
\`\`\`
`;

  // Build user message with images
  const userMessage = {
    role: 'user',
    content: [
      { type: 'text', text: prompt },
      ...images.map((img: any) => ({
        type: 'image',
        image: img.url,
      }))
    ]
  };

  const result = streamText({
    model: createModel(model),
    system: systemPrompt,
    messages: [userMessage],
  });

  // Transform stream to extract code blocks and send as structured data
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let buffer = '';
      let currentFile = '';

      for await (const chunk of result.textStream) {
        buffer += chunk;

        // Detect code block starts
        const htmlMatch = buffer.match(/```html/);
        const cssMatch = buffer.match(/```css/);
        const jsMatch = buffer.match(/```javascript/);
        const phpMatch = buffer.match(/```php/);

        if (htmlMatch && currentFile !== 'html') {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'file-start', file: 'html' })}\n\n`));
          currentFile = 'html';
          buffer = buffer.slice(htmlMatch.index! + 7);
        } else if (cssMatch && currentFile !== 'css') {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'file-start', file: 'css' })}\n\n`));
          currentFile = 'css';
          buffer = buffer.slice(cssMatch.index! + 6);
        } else if (jsMatch && currentFile !== 'js') {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'file-start', file: 'js' })}\n\n`));
          currentFile = 'js';
          buffer = buffer.slice(jsMatch.index! + 13);
        } else if (phpMatch && currentFile !== 'php') {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'file-start', file: 'php' })}\n\n`));
          currentFile = 'php';
          buffer = buffer.slice(phpMatch.index! + 6);
        }

        // Extract content between code blocks
        const endMatch = buffer.match(/```/);
        if (endMatch && currentFile) {
          const content = buffer.slice(0, endMatch.index);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'content',
            file: currentFile,
            content
          })}\n\n`));
          buffer = buffer.slice(endMatch.index! + 3);
          currentFile = '';
        } else if (currentFile && buffer.length > 100) {
          // Send partial content
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'content',
            file: currentFile,
            content: buffer
          })}\n\n`));
          buffer = '';
        }
      }

      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### Testing Checklist - HTML Generator
- [ ] Generate button appears in Code Editor toolbar
- [ ] Clicking opens HTMLGeneratorDialog modal
- [ ] Can select "HTML Section" mode
- [ ] Can select "Elementor Widget" mode
- [ ] Can upload up to 3 images
- [ ] Images are analyzed with Claude Haiku 4.5
- [ ] Can enter description text
- [ ] "Use extracted classes" checkbox appears when Style Guide has classes
- [ ] Generate button triggers generation
- [ ] HTML/CSS/JS/PHP streams to editor in real-time
- [ ] Tabs auto-switch as different files are generated
- [ ] Dialog closes on completion
- [ ] Success message appears

---

## Part 2: Hot Reload for PHP/CSS Changes

### Goal
Automatically detect when PHP or CSS files change in the Code Editor and:
1. Re-deploy the updated file to WordPress Playground
2. Refresh the Playground iframe
3. If Elementor editor is open, refresh it too

This enables real-time widget development without manual refresh.

### Architecture

```
Code Editor (HtmlSectionEditor)
    ↓
User edits PHP or CSS content
    ↓
useEffect detects content change
    ↓
Debounce 1000ms (wait for typing to stop)
    ↓
Check if PHP or CSS changed
    ↓
YES: Auto-deploy to Playground
    ↓
Reload Playground iframe
    ↓
If Elementor editor open: Refresh editor
```

### Implementation

#### 1. Add Hot Reload State

**Location**: [HtmlSectionEditor.tsx](src/components/elementor/HtmlSectionEditor.tsx)

```typescript
// Add state
const [hotReloadEnabled, setHotReloadEnabled] = useState(true);
const [lastDeployedPhp, setLastDeployedPhp] = useState('');
const [lastDeployedCss, setLastDeployedCss] = useState('');
const lastChangeTimeRef = useRef<number>(0);
```

#### 2. Add Hot Reload Effect

```typescript
// Hot reload effect - detects PHP/CSS changes and auto-deploys
useEffect(() => {
  if (!hotReloadEnabled) return;
  if (!playgroundReady) return;
  if (!section.php && !section.css) return;

  // Check if PHP or CSS actually changed (not just mount/unmount)
  const phpChanged = section.php && section.php !== lastDeployedPhp && lastDeployedPhp !== '';
  const cssChanged = section.css && section.css !== lastDeployedCss && lastDeployedCss !== '';

  if (!phpChanged && !cssChanged) {
    // First load - just update last deployed
    if (lastDeployedPhp === '') setLastDeployedPhp(section.php || '');
    if (lastDeployedCss === '') setLastDeployedCss(section.css || '');
    return;
  }

  // Debounce - wait 1000ms after last change before deploying
  lastChangeTimeRef.current = Date.now();
  const changeTime = lastChangeTimeRef.current;

  const timer = setTimeout(async () => {
    // Only deploy if this is still the latest change
    if (changeTime !== lastChangeTimeRef.current) return;

    console.log('🔥 Hot reload triggered:', { phpChanged, cssChanged });

    try {
      // Deploy PHP if changed
      if (phpChanged && section.php) {
        console.log('📤 Deploying updated PHP to Playground...');
        await handleDeployToPlayground(true); // true = silent mode (no alerts)
        setLastDeployedPhp(section.php);
      }

      // Deploy CSS if changed
      if (cssChanged && section.css) {
        console.log('📤 Deploying updated CSS to Playground...');
        // Update CSS in playground
        await window.updatePlaygroundCss?.(section.css);
        setLastDeployedCss(section.css);
      }

      // Reload playground iframe
      console.log('🔄 Reloading Playground iframe...');
      await window.reloadPlaygroundIframe?.();

      // If Elementor editor is open, refresh it
      if (window.isElementorEditorOpen?.()) {
        console.log('✨ Refreshing Elementor editor...');
        await window.refreshElementorEditor?.();
      }

      console.log('✅ Hot reload complete!');
    } catch (error) {
      console.error('❌ Hot reload error:', error);
    }
  }, 1000); // 1 second debounce

  return () => clearTimeout(timer);
}, [section.php, section.css, hotReloadEnabled, playgroundReady, lastDeployedPhp, lastDeployedCss]);
```

#### 3. Update Deploy Function

```typescript
const handleDeployToPlayground = async (silent = false) => {
  if (!section.php) {
    if (!silent) alert('⚠️ No widget PHP code to deploy...');
    return;
  }

  if (!silent) setIsDeploying(true);

  try {
    // Deploy widget to Playground
    await window.deployWidget?.({
      name: section.name || 'Custom Widget',
      php: section.php,
      css: section.css || '',
      js: section.js || '',
    });

    if (!silent) {
      alert('✅ Widget deployed to WordPress Playground!\n\nThe widget is now available in Elementor\'s widget panel.');
    }
  } catch (error) {
    console.error('Deploy error:', error);
    if (!silent) {
      alert('❌ Failed to deploy widget. Check console for details.');
    }
  } finally {
    if (!silent) setIsDeploying(false);
  }
};
```

#### 4. Add Hot Reload Toggle Button

```typescript
{/* Hot Reload Toggle */}
<button
  onClick={() => setHotReloadEnabled(!hotReloadEnabled)}
  style={{
    padding: '6px 12px',
    background: hotReloadEnabled ? '#10b981' : 'var(--muted)',
    color: hotReloadEnabled ? '#fff' : 'var(--muted-foreground)',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  }}
  title={hotReloadEnabled ? 'Hot reload enabled - changes auto-deploy' : 'Hot reload disabled - manual deploy only'}
>
  {hotReloadEnabled ? '🔥' : '❄️'}
  {hotReloadEnabled ? 'Hot Reload: ON' : 'Hot Reload: OFF'}
</button>
```

#### 5. Add Playground Helper Functions

**Location**: `/public/playground.js`

```javascript
// Reload playground iframe
window.reloadPlaygroundIframe = async function() {
  try {
    if (!window.playground || !window.playground.client) {
      console.warn('⚠️ Playground not ready for reload');
      return;
    }

    // Get current URL
    const currentUrl = await window.playground.client.run({
      code: '<?php echo home_url(); ?>'
    });

    // Navigate to same URL (triggers refresh)
    await window.playground.client.goTo(currentUrl);

    console.log('✅ Playground iframe reloaded');
  } catch (error) {
    console.error('❌ Playground reload error:', error);
  }
};

// Check if Elementor editor is open
window.isElementorEditorOpen = function() {
  try {
    if (!window.playground || !window.playground.client) return false;

    // Check if current URL contains 'elementor'
    const currentUrl = window.playground.client.getCurrentURL();
    return currentUrl && currentUrl.includes('elementor');
  } catch (error) {
    return false;
  }
};

// Refresh Elementor editor
window.refreshElementorEditor = async function() {
  try {
    if (!window.playground || !window.playground.client) {
      console.warn('⚠️ Playground not ready');
      return;
    }

    // Reload the Elementor editor page
    await window.playground.client.run({
      code: `<?php
        // Trigger Elementor to reload
        if (class_exists('\\Elementor\\Plugin')) {
          \\Elementor\\Plugin::instance()->documents->invalidate_cache();
        }
      ?>`
    });

    // Reload the page
    await window.reloadPlaygroundIframe();

    console.log('✅ Elementor editor refreshed');
  } catch (error) {
    console.error('❌ Elementor refresh error:', error);
  }
};

// Update CSS in playground
window.updatePlaygroundCss = async function(css) {
  try {
    if (!window.playground || !window.playground.client) {
      console.warn('⚠️ Playground not ready');
      return;
    }

    // Write CSS to temp file
    await window.playground.client.writeFile('/tmp/widget-styles.css', css);

    // Enqueue CSS in WordPress
    await window.playground.client.run({
      code: `<?php
        add_action('wp_enqueue_scripts', function() {
          $css = file_get_contents('/tmp/widget-styles.css');
          wp_add_inline_style('elementor-frontend', $css);
        });
      ?>`
    });

    console.log('✅ CSS updated in Playground');
  } catch (error) {
    console.error('❌ CSS update error:', error);
  }
};

// Deploy widget to Playground
window.deployWidget = async function(widget) {
  try {
    if (!window.playground || !window.playground.client) {
      throw new Error('Playground not ready');
    }

    const { name, php, css, js } = widget;

    // Write PHP file
    const widgetSlug = name.toLowerCase().replace(/\s+/g, '-');
    const phpPath = `/wordpress/wp-content/plugins/elementor-custom-widgets/${widgetSlug}.php`;
    await window.playground.client.writeFile(phpPath, php);

    // Write CSS file if provided
    if (css) {
      const cssPath = `/wordpress/wp-content/plugins/elementor-custom-widgets/${widgetSlug}.css`;
      await window.playground.client.writeFile(cssPath, css);
    }

    // Write JS file if provided
    if (js) {
      const jsPath = `/wordpress/wp-content/plugins/elementor-custom-widgets/${widgetSlug}.js`;
      await window.playground.client.writeFile(jsPath, js);
    }

    console.log('✅ Widget deployed:', widgetSlug);
  } catch (error) {
    console.error('❌ Widget deployment error:', error);
    throw error;
  }
};
```

### Testing Checklist - Hot Reload
- [ ] Hot reload toggle button appears
- [ ] Toggle can be enabled/disabled
- [ ] Edit PHP code → Wait 1 second → Auto-deploys to Playground
- [ ] Edit CSS code → Wait 1 second → Auto-deploys to Playground
- [ ] Playground iframe reloads after deployment
- [ ] If Elementor editor is open, it refreshes too
- [ ] Debounce works (typing fast doesn't trigger multiple deploys)
- [ ] Toggle OFF disables hot reload
- [ ] Toggle ON re-enables hot reload
- [ ] Console logs show hot reload activity
- [ ] No errors in console

---

## Benefits

### HTML Generator Modal
- **Fast prototyping**: Generate complete sections or widgets instantly
- **Image support**: Upload mockups for better AI understanding
- **No tool overhead**: Direct generation without tool calling complexity
- **Mode selection**: Choose between section or widget generation
- **Style Guide integration**: Can use extracted CSS classes

### Hot Reload
- **Real-time development**: See changes instantly without manual refresh
- **Better DX**: No context switching to deploy/refresh
- **Faster iteration**: Edit → Save → See results (1 second)
- **Elementor-aware**: Refreshes Elementor editor when open
- **Debounced**: Waits for typing to stop before deploying

---

## Next Steps

1. ✅ Plan complete
2. → Implement HTML Generator button + modal integration
3. → Implement hot reload watcher + auto-deploy
4. → Add Playground helper functions
5. → Test end-to-end workflow
6. → Document new features in README

---

## User Workflow

### HTML Generation
1. Click "Generate" button in Code Editor toolbar
2. Modal opens with description input + image upload
3. Select mode: "HTML Section" or "Elementor Widget"
4. Upload images (optional, max 3)
5. AI analyzes images automatically
6. Click "Generate HTML/CSS/JS" or "Generate Elementor Widget"
7. Code streams to editor in real-time
8. Tabs auto-switch as different files generate
9. Dialog closes, code is ready to edit

### Hot Reload Development
1. Enable "Hot Reload: ON" toggle (enabled by default)
2. Edit PHP widget code in Monaco editor
3. Stop typing for 1 second
4. Widget auto-deploys to WordPress Playground
5. Playground iframe refreshes automatically
6. If Elementor editor is open, it refreshes too
7. See changes instantly!

Same workflow for CSS changes - just edit and wait 1 second.

---

## Status: Ready to Implement

All planning complete. Proceeding with implementation.
