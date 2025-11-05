# WordPress Plugin System & Project Management

Complete documentation for the Elementor Code Editor's project management and WordPress plugin generation system.

---

## Table of Contents

1. [Overview](#overview)
2. [Project Management System](#project-management-system)
3. [WordPress Plugin System](#wordpress-plugin-system)
4. [AI-Powered Widget Generation](#ai-powered-widget-generation)
5. [File Management](#file-management)
6. [Download & Export](#download--export)
7. [Technical Architecture](#technical-architecture)

---

## Overview

The Elementor Code Editor provides a complete project management system for building WordPress/Elementor websites and plugins. It supports three main project types:

- **HTML Projects**: Standalone HTML/CSS/JS sections
- **PHP Widget Projects**: Single Elementor widget files
- **WordPress Plugin Projects** ⭐ NEW: Multi-widget plugin packages
- **HubSpot Modules**: HubL template projects

---

## Project Management System

### Project Types

#### 1. HTML Projects
Standard web development projects with three files:
- `index.html` - HTML markup
- `styles.css` - Stylesheets
- `script.js` - JavaScript

**Use Cases:**
- Landing page sections
- Standalone components
- Prototyping designs
- Client mockups

#### 2. PHP Widget Projects (Legacy)
Single Elementor widget with three separate files:
- `widget.php` - Widget class definition
- `style.css` - Widget styles
- `script.js` - Widget JavaScript

**Status:** Being replaced by WordPress Plugin Projects

#### 3. WordPress Plugin Projects ⭐ NEW
Complete WordPress plugin with multiple widgets:

**Structure:**
```
my-custom-widgets/
├── my-custom-widgets.php    (Main plugin file)
└── widgets/
    ├── hero-widget.php
    ├── cta-widget.php
    └── testimonial-widget.php
```

**Features:**
- Unlimited widgets per plugin
- Auto-registration of all widgets
- Custom widget category
- Professional plugin headers
- WordPress standards compliant

#### 4. HubSpot Modules
HubSpot CMS modules with HubL templating:
- `template.html` - HubL template
- `module.hubl` - HubL logic
- `styles.css` - Module styles
- `script.js` - Module JavaScript

---

## WordPress Plugin System

### Creating a Plugin

**Method 1: Via UI Dialog (Recommended)**
1. Click "Create New Project" button
2. Select "WordPress Plugin" type
3. Enter plugin name (e.g., "My Custom Widgets")
4. Add optional description
5. Plugin is created with main file

**Method 2: Programmatic API**
```typescript
const plugin = fileGroups.createNewPlugin(
  'My Custom Widgets',
  'Custom Elementor widgets for my website'
);
```

### Plugin Structure

#### Main Plugin File
The main PHP file (`{plugin-slug}.php`) handles:

1. **Plugin Headers** - WordPress recognizes the plugin
2. **Widget Category Registration** - Custom category in Elementor
3. **File Auto-Loading** - Automatically requires all widget files
4. **Widget Auto-Registration** - Registers all widget classes

**Example Main File:**
```php
<?php
/**
 * Plugin Name: My Custom Widgets
 * Description: Custom Elementor widgets collection
 * Version: 1.0.0
 * Author: Your Name
 * Text Domain: my-custom-widgets
 * Elementor tested up to: 3.20.0
 */

if (!defined('ABSPATH')) {
    exit;
}

// Register custom category
function my_custom_widgets_add_elementor_category($elements_manager) {
    $elements_manager->add_category('my-custom-widgets', [
        'title' => esc_html__('My Custom Widgets', 'my-custom-widgets'),
        'icon' => 'fa fa-plug',
    ]);
}
add_action('elementor/elements/categories_registered', 'my_custom_widgets_add_elementor_category');

// Auto-register widgets
function my_custom_widgets_register_widgets($widgets_manager) {
    // Auto-load all widget files
    $widget_files = glob(plugin_dir_path(__FILE__) . 'widgets/*.php');
    foreach ($widget_files as $widget_file) {
        require_once $widget_file;
    }

    // Auto-registration happens here
    $widgets_manager->register(new Hero_Widget());
    $widgets_manager->register(new CTA_Widget());
}
add_action('elementor/widgets/register', 'my_custom_widgets_register_widgets');
```

### Adding Widgets to Plugin

**Method 1: Generate Widget with AI**
1. Have HTML/CSS/JS code in editor
2. Click "Generate Widget" button
3. Choose "Add to existing plugin" option
4. Select target plugin
5. Enter widget name
6. AI generates widget code
7. Widget auto-registered in plugin

**Method 2: Add Widget Button**
1. Open plugin project
2. Click "+" button in Files panel
3. Enter widget name
4. Widget template created
5. Edit widget code in Monaco editor

**Method 3: Programmatic API**
```typescript
fileGroups.addWidgetToPlugin(
  pluginId,
  'Hero Widget',
  widgetPhpCode
);
```

### Widget File Structure

Each widget is a single PHP file with embedded styles:

```php
<?php
if (!defined('ABSPATH')) exit;

class Hero_Widget extends \Elementor\Widget_Base {

    public function get_name() {
        return 'hero_widget';
    }

    public function get_title() {
        return 'Hero Section';
    }

    public function get_icon() {
        return 'eicon-banner';
    }

    public function get_categories() {
        return ['my-custom-widgets'];
    }

    protected function register_controls() {
        // Content Tab
        $this->start_controls_section('content_section', [
            'label' => 'Content',
            'tab' => \Elementor\Controls_Manager::TAB_CONTENT,
        ]);

        $this->add_control('title', [
            'label' => 'Title',
            'type' => \Elementor\Controls_Manager::TEXT,
            'default' => 'Welcome to Our Website',
        ]);

        $this->end_controls_section();

        // Style Tab
        $this->start_controls_section('style_section', [
            'label' => 'Style',
            'tab' => \Elementor\Controls_Manager::TAB_STYLE,
        ]);

        $this->add_control('title_color', [
            'label' => 'Title Color',
            'type' => \Elementor\Controls_Manager::COLOR,
            'default' => '', // Uses global default
            'selectors' => [
                '{{WRAPPER}} .hero-title' => 'color: {{VALUE}}'
            ],
        ]);

        $this->end_controls_section();
    }

    protected function render() {
        $settings = $this->get_settings_for_display();
        ?>
        <style>
        /* Structural CSS only */
        {{WRAPPER}} .hero-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
            transition: all 0.3s ease;
        }

        @media (max-width: 768px) {
            {{WRAPPER}} .hero-container {
                grid-template-columns: 1fr;
            }
        }
        </style>

        <div class="hero-container">
            <h1 class="hero-title"><?php echo esc_html($settings['title']); ?></h1>
        </div>
        <?php
    }
}
```

### Elementor Best Practices Enforced

The AI system prompt enforces these critical rules:

#### 1. Inline CSS in `<style>` Tags
✅ **Correct:** CSS embedded in render() method
```php
protected function render() {
    ?>
    <style>
    {{WRAPPER}} .my-class {
        display: flex;
    }
    </style>
    <div class="my-class">Content</div>
    <?php
}
```

❌ **Wrong:** Separate CSS file
```php
// Don't do this anymore
wp_enqueue_style('widget-style', 'style.css');
```

#### 2. Structural CSS Only
✅ **Correct:** Layout, transitions, responsive
```css
{{WRAPPER}} .hero {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    transition: opacity 0.3s ease;
}
```

❌ **Wrong:** Hardcoded colors/typography
```css
{{WRAPPER}} .hero {
    background-color: #667eea; /* DON'T HARDCODE */
    color: white;              /* DON'T HARDCODE */
    font-family: Arial;        /* DON'T HARDCODE */
}
```

#### 3. Dynamic Styling via Controls
✅ **Correct:** Elementor controls with selectors
```php
$this->add_control('bg_color', [
    'label' => 'Background Color',
    'type' => \Elementor\Controls_Manager::COLOR,
    'default' => '', // Empty = global default
    'selectors' => [
        '{{WRAPPER}} .hero' => 'background-color: {{VALUE}}'
    ]
]);
```

#### 4. {{WRAPPER}} Scoping
✅ **Correct:** All CSS rules use {{WRAPPER}}
```css
{{WRAPPER}} .my-class { }
{{WRAPPER}} .my-class:hover { }
{{WRAPPER}} .my-class .child { }
```

❌ **Wrong:** Global selectors
```css
.my-class { } /* Leaks to entire page! */
```

---

## AI-Powered Widget Generation

### How It Works

1. **User Input**
   - Provide HTML/CSS/JS code
   - Optional: Add reference images
   - Optional: Add description

2. **Programmatic Parsing**
   - System identifies all HTML elements
   - Maps elements to required controls
   - Generates control list automatically

3. **AI Enhancement** (Claude Sonnet 4.5)
   - Analyzes parsed structure
   - Generates complete PHP widget class
   - Creates intelligent control organization
   - Follows Elementor best practices
   - Streams response in real-time

4. **Widget Output**
   - Single PHP file with embedded CSS
   - Complete Elementor controls
   - Proper escaping and sanitization
   - WordPress coding standards

### Generation Settings

**Model:** Claude Sonnet 4.5 (required for best results)
**Streaming:** Yes (watch code generate live)
**Cost:** ~$0.05-0.15 per widget
**Time:** 10-45 seconds depending on complexity

### What Gets Generated

1. **Widget Class Structure**
   - Proper class name and namespace
   - Widget metadata (name, title, icon, category)
   - get_name(), get_title(), get_icon(), get_categories()

2. **Controls (register_controls)**
   - Content Tab: Text, images, links, media
   - Style Tab: Colors, typography, spacing, borders
   - Advanced Tab: Custom CSS, animations, visibility

3. **Render Method**
   - Embedded `<style>` tag with structural CSS
   - Dynamic HTML output
   - Proper escaping (esc_html, esc_url, etc.)
   - Settings integration

---

## File Management

### Project Organization

**localStorage Schema:**
```typescript
interface EditorState {
  groups: FileGroup[];           // All projects
  activeGroupId: string | null;  // Current project
  version: number;                // Schema version
}

interface FileGroup {
  id: string;
  name: string;
  type: 'html' | 'php' | 'hubspot';

  // Standard files
  html: string;
  css: string;
  js: string;
  php?: string;
  hubl?: string;

  // Plugin-specific (NEW)
  isPlugin?: boolean;
  pluginMainFile?: string;
  pluginName?: string;
  pluginSlug?: string;
  widgetFiles?: {
    [widgetId: string]: {
      name: string;
      slug: string;
      content: string;
      className: string;
    }
  };
}
```

### File Operations

#### Create New Project
```typescript
const htmlProject = fileGroups.createNewGroup('Landing Page', 'html');
const plugin = fileGroups.createNewPlugin('My Widgets', 'Description');
```

#### Select/Switch Project
```typescript
fileGroups.selectGroup(projectId);
```

#### Update File Content
```typescript
fileGroups.updateGroupFile(projectId, 'html', newContent);
fileGroups.updateGroupFile(projectId, 'css', newStyles);
```

#### Rename Project
```typescript
fileGroups.renameGroup(projectId, 'New Name');
```

#### Duplicate Project
```typescript
const duplicate = fileGroups.duplicateGroup(projectId);
```

#### Delete Project
```typescript
fileGroups.deleteGroup(projectId);
```

### Storage Management

**Storage Limit:** ~5MB (localStorage)
**Auto-Save:** Yes, on every change
**Persistence:** Browser localStorage
**Sync:** No (local only)

**Check Storage Usage:**
```typescript
import { getStorageInfo } from '@/lib/file-group-manager';

const { used, limit, percentage } = getStorageInfo();
console.log(`Using ${percentage.toFixed(1)}% of storage`);
```

---

## Download & Export

### Individual Files

Download any file separately:

1. Open plugin project
2. Click "Download Plugin" button
3. In modal, click download icon next to file
4. File downloads as `.php`

**Files Available:**
- Main plugin file (`{slug}.php`)
- Each widget file (`{widget-slug}.php`)

### Complete Plugin ZIP

Download entire plugin as installable ZIP:

1. Open plugin project
2. Click "Download Plugin" button
3. Click "Download Plugin ZIP" button
4. ZIP file downloads with proper structure

**ZIP Structure:**
```
my-custom-widgets.zip
├── my-custom-widgets.php
└── widgets/
    ├── hero-widget.php
    ├── cta-widget.php
    └── testimonial-widget.php
```

**Installation:**
1. Go to WordPress → Plugins → Add New
2. Click "Upload Plugin"
3. Choose the ZIP file
4. Click "Install Now"
5. Activate the plugin
6. Widgets appear in Elementor under custom category

### WordPress Playground Deployment

Test plugins in browser-based WordPress:

1. Click "WordPress Playground" tab
2. Playground auto-launches on page load
3. Click "Import to Playground" button
4. Plugin installs automatically
5. Test widgets in live WordPress environment

---

## Technical Architecture

### Core Components

#### 1. File Group Manager
**Location:** `src/lib/file-group-manager.ts`

**Responsibilities:**
- localStorage management
- CRUD operations for projects
- Plugin creation and management
- Widget registration
- State persistence

**Key Functions:**
```typescript
// Projects
createGroup(name, type, template)
getGroups()
getActiveGroup()
updateGroup(id, updates)
deleteGroup(id)

// Plugins (NEW)
createPlugin(name, description)
addWidgetToPlugin(pluginId, widgetName, code)
removeWidgetFromPlugin(pluginId, widgetId)
updateWidgetInPlugin(pluginId, widgetId, newCode)
getAllPlugins()
```

#### 2. useFileGroups Hook
**Location:** `src/hooks/useFileGroups.ts`

**Responsibilities:**
- React state management
- Real-time updates
- Event handling
- UI synchronization

**Returns:**
```typescript
{
  // State
  groups: FileGroup[];
  activeGroup: FileGroup | null;
  activeGroupId: string | null;

  // Actions
  createNewGroup();
  selectGroup();
  updateGroupFile();
  renameGroup();
  duplicateGroup();
  deleteGroup();

  // Plugin Actions (NEW)
  createNewPlugin();
  addWidgetToPlugin();
  removeWidgetFromPlugin();
  updateWidgetInPlugin();
  getAllPlugins();

  // Utilities
  refresh();
}
```

#### 3. Widget Generation API
**Location:** `src/app/api/convert-html-to-widget/route.ts`

**Process:**
1. Receives HTML/CSS/JS + description
2. Parses HTML programmatically
3. Identifies all elements and required controls
4. Sends to Claude Sonnet 4.5 with structured prompt
5. Streams generated PHP code back
6. Returns single PHP file

**System Prompt Enforces:**
- Inline CSS in `<style>` tags
- Structural CSS only (no hardcoded colors/fonts)
- Elementor controls for all dynamic styling
- `{{WRAPPER}}` scoping
- WordPress coding standards

#### 4. UI Components

**Dialogs:**
- `AddWidgetDialog.tsx` - Add widget to existing plugin
- `PluginNamingDialog.tsx` - Name new plugins
- `PluginDownloadModal.tsx` - Download files/ZIP

**Editor:**
- `HtmlSectionEditor.tsx` - Main code editor
- `ProjectSidebar.tsx` - Project list and management
- `MonacoEditor` - Code editing with syntax highlighting

### Data Flow

```
User Action
    ↓
UI Component
    ↓
useFileGroups Hook
    ↓
File Group Manager
    ↓
localStorage
    ↓
State Update
    ↓
UI Re-render
```

### Widget Generation Flow

```
User: "Generate Widget"
    ↓
HTML/CSS/JS Input
    ↓
API: Programmatic Parsing
    ↓
API: Element Analysis
    ↓
API: Claude Sonnet 4.5
    ↓
API: Stream PHP Code
    ↓
UI: Display Generated Code
    ↓
Option 1: Add to Existing Plugin
Option 2: Create New Plugin
    ↓
File Group Manager
    ↓
localStorage + Auto-Registration
```

---

## Roadmap & Future Features

### Planned Features

1. **Visual Plugin Builder** - Drag-and-drop widget assembly
2. **Plugin Settings Page** - Admin options and configuration
3. **Widget Templates Library** - Pre-built widget starters
4. **Multi-Site Sync** - Cloud sync across devices
5. **Version Control** - Git integration for plugins
6. **WordPress Plugin Morph Tool** - AI-powered plugin file editing
7. **Automated Testing** - Widget validation and testing
8. **Performance Optimization** - Bundle size analysis

### Known Limitations

1. **localStorage Only** - No cloud backup (yet)
2. **5MB Storage Limit** - Browser localStorage constraint
3. **Single PHP File Focus** - No multi-file widget support yet
4. **No Plugin Settings UI** - Must manually edit plugin file
5. **Manual Widget Naming** - No auto-naming based on content

---

## Best Practices

### Project Organization

1. **Use Descriptive Names** - "Hero Section - Homepage" not "Widget 1"
2. **One Purpose Per Plugin** - Group related widgets only
3. **Document Your Widgets** - Add comments in PHP code
4. **Test Before Deployment** - Use WordPress Playground first
5. **Keep Backups** - Download plugins regularly

### Widget Development

1. **Follow Elementor Standards** - Let AI handle best practices
2. **Test Responsive Design** - Check all breakpoints
3. **Validate HTML** - Ensure proper escaping
4. **Optimize Performance** - Keep CSS lean
5. **Use Global Defaults** - Don't hardcode colors/fonts

### Code Quality

1. **Let AI Generate Controls** - Don't skip controls
2. **Use Semantic Names** - `hero_title` not `text_1`
3. **Group Related Controls** - Logical tab organization
4. **Add Descriptions** - Help users understand controls
5. **Include CSS Selectors** - Show what elements are affected

---

## Troubleshooting

### Common Issues

**Q: Widget doesn't show in Elementor**
A: Check plugin is activated and widget category is registered

**Q: Styles not applying**
A: Ensure {{WRAPPER}} prefix on all CSS rules

**Q: Download button not appearing**
A: Make sure project is marked as plugin (isPlugin: true)

**Q: Storage quota exceeded**
A: Delete old projects or export to free up space

**Q: Widget controls not working**
A: Verify selectors match actual HTML class names

---

## Support & Resources

- **Documentation:** `/docs/` folder
- **Code Examples:** WordPress Playground test widgets
- **AI Model:** Claude Sonnet 4.5 recommended
- **Elementor Docs:** https://developers.elementor.com/

---

**Last Updated:** November 2025
**Version:** 2.0.0
**System:** WordPress Plugin Management + Project System
