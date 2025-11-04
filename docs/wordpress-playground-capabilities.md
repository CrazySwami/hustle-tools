# WordPress Playground: Complete Capabilities Guide

*Last updated: January 2025*

This document provides a comprehensive overview of WordPress Playground's capabilities, APIs, testing workflows, and advanced use cases for development, testing, and automation.

---

## Table of Contents

1. [Overview](#overview)
2. [Three-Tier API Architecture](#three-tier-api-architecture)
3. [Blueprint API - Complete Steps Reference](#blueprint-api---complete-steps-reference)
4. [JavaScript API - PlaygroundClient](#javascript-api---playgroundclient)
5. [Debugging and Logging](#debugging-and-logging)
6. [Bulk Operations and Programmatic SEO](#bulk-operations-and-programmatic-seo)
7. [Import/Export and Site Backup](#importexport-and-site-backup)
8. [Plugin and Theme Testing](#plugin-and-theme-testing)
9. [Advanced Use Cases](#advanced-use-cases)
10. [Limitations and Known Issues](#limitations-and-known-issues)
11. [Code Examples](#code-examples)

---

## Overview

WordPress Playground is a browser-based WordPress environment powered by WebAssembly PHP. It runs entirely in the browser without requiring a server, making it ideal for:

- **Testing**: Plugin/theme development and compatibility testing
- **Demos**: Interactive product demonstrations
- **Development**: Rapid prototyping and experimentation
- **Education**: Safe learning environment without hosting costs
- **Automation**: Programmatic WordPress operations via APIs

**Core Technologies:**
- WebAssembly PHP execution (no server needed)
- SQLite database (replaces MySQL)
- Service Worker web server
- iframe embedding support

---

## Three-Tier API Architecture

WordPress Playground offers three APIs with increasing complexity:

### 1. Query API (No Code)

URL-based configuration through parameters:

```
https://playground.wordpress.net/?
  theme=frost&
  plugin=advanced-custom-fields&
  php=8.0&
  wp=6.0&
  blueprint-url=https://example.com/blueprint.json
```

**Available Parameters:**
- `theme` - Install theme from wordpress.org
- `plugin` - Install plugin from wordpress.org
- `php` - PHP version (7.0, 7.2, 7.4, 8.0, 8.1, 8.2, 8.3)
- `wp` - WordPress version
- `blueprint-url` - Load Blueprint from URL

### 2. Blueprint API (Low Code - JSON)

JSON-based configuration for complex setups. See [Blueprint API section](#blueprint-api---complete-steps-reference).

### 3. JavaScript API (Full Code)

Programmatic control via `PlaygroundClient`. See [JavaScript API section](#javascript-api---playgroundclient).

---

## Blueprint API - Complete Steps Reference

Blueprints are JSON files that configure WordPress Playground instances. They support 30+ steps for comprehensive site setup.

### Blueprint Structure

```json
{
  "landingPage": "/wp-admin/",
  "preferredVersions": {
    "php": "8.0",
    "wp": "latest"
  },
  "phpExtensionBundles": ["kitchen-sink"],
  "features": {
    "networking": true
  },
  "steps": [
    // Steps go here
  ]
}
```

### Plugin Management

#### `installPlugin`
Installs a plugin from wordpress.org, URL, or local file.

```json
{
  "step": "installPlugin",
  "pluginData": {
    "resource": "wordpress.org/plugins",
    "slug": "elementor"
  },
  "options": {
    "activate": true
  }
}
```

**Parameters:**
- `pluginData`: Object or zip file
  - `resource`: "wordpress.org/plugins", "url", "vfs"
  - `slug`: Plugin slug (for wordpress.org)
  - `url`: Direct download URL
- `options`: Configuration object
  - `activate`: Boolean - auto-activate after install
- `ifAlreadyInstalled`: "overwrite" | "skip" | "error"

#### `activatePlugin`
Activates an installed plugin.

```json
{
  "step": "activatePlugin",
  "pluginPath": "elementor/elementor.php",
  "pluginName": "Elementor"
}
```

**Parameters:**
- `pluginPath`: Relative path from wp-content/plugins/
- `pluginName`: Display name (optional)

### Theme Operations

#### `installTheme`
Installs a theme from various sources.

```json
{
  "step": "installTheme",
  "themeData": {
    "resource": "wordpress.org/themes",
    "slug": "hello-elementor"
  },
  "options": {
    "activate": true,
    "importStarterContent": true
  }
}
```

**Parameters:**
- `themeData`: Theme source (wordpress.org, URL, or file)
- `options.activate`: Auto-activate theme
- `options.importStarterContent`: Load demo content

#### `activateTheme`
Switches active theme.

```json
{
  "step": "activateTheme",
  "themeFolderName": "hello-elementor"
}
```

#### `importThemeStarterContent`
Loads demo content from active theme.

```json
{
  "step": "importThemeStarterContent",
  "themeSlug": "hello-elementor"
}
```

### File System Operations

#### `writeFile`
Creates or overwrites a single file.

```json
{
  "step": "writeFile",
  "path": "/wordpress/wp-content/uploads/test.txt",
  "data": "Hello World!"
}
```

**Parameters:**
- `path`: Absolute path in Playground filesystem
- `data`: File content (string or base64)

#### `writeFiles`
Creates multiple files with directory structure.

```json
{
  "step": "writeFiles",
  "writeToPath": "/wordpress/wp-content/themes/my-theme/",
  "filesTree": {
    "style.css": "/* Theme Name: My Theme */",
    "functions.php": "<?php // Theme functions",
    "templates": {
      "header.php": "<?php // Header template",
      "footer.php": "<?php // Footer template"
    }
  }
}
```

**Parameters:**
- `writeToPath`: Base directory
- `filesTree`: Nested object representing directory structure

#### `cp`
Copies files or directories.

```json
{
  "step": "cp",
  "fromPath": "/wordpress/wp-content/themes/twentytwentythree",
  "toPath": "/wordpress/wp-content/themes/my-custom-theme"
}
```

#### `mv`
Moves/renames files or directories.

```json
{
  "step": "mv",
  "fromPath": "/wordpress/wp-content/themes/old-name",
  "toPath": "/wordpress/wp-content/themes/new-name"
}
```

#### `rm`
Deletes a file.

```json
{
  "step": "rm",
  "path": "/wordpress/wp-content/uploads/unwanted.txt"
}
```

#### `rmdir`
Removes a directory.

```json
{
  "step": "rmdir",
  "path": "/wordpress/wp-content/themes/unused-theme"
}
```

#### `mkdir`
Creates a directory.

```json
{
  "step": "mkdir",
  "path": "/wordpress/wp-content/custom-uploads"
}
```

#### `unzip`
Extracts a ZIP archive.

```json
{
  "step": "unzip",
  "zipPath": "/wordpress/wp-content/themes/my-theme.zip",
  "extractToPath": "/wordpress/wp-content/themes/"
}
```

### Data & Configuration

#### `setSiteOptions`
Updates WordPress options (equivalent to `update_option()`).

```json
{
  "step": "setSiteOptions",
  "options": {
    "blogname": "My Playground Site",
    "blogdescription": "Testing WordPress Playground",
    "permalink_structure": "/%postname%/",
    "show_on_front": "page",
    "page_on_front": 2
  }
}
```

#### `setSiteLanguage`
Configures site language and downloads translations.

```json
{
  "step": "setSiteLanguage",
  "language": "es_ES"
}
```

#### `updateUserMeta`
Modifies user metadata.

```json
{
  "step": "updateUserMeta",
  "userId": 1,
  "meta": {
    "nickname": "Admin User",
    "show_admin_bar_front": "false"
  }
}
```

#### `defineWpConfigConsts`
Adds constants to wp-config.php.

```json
{
  "step": "defineWpConfigConsts",
  "consts": {
    "WP_DEBUG": true,
    "WP_DEBUG_LOG": true,
    "WP_DEBUG_DISPLAY": false
  },
  "method": "rewrite"
}
```

**Parameters:**
- `consts`: Object of constant key-value pairs
- `method`: "rewrite" | "define-before-run"

#### `defineSiteUrl`
Sets WordPress home and site URL constants.

```json
{
  "step": "defineSiteUrl",
  "siteUrl": "https://example.com"
}
```

#### `enableMultisite`
Configures WordPress multisite network.

```json
{
  "step": "enableMultisite"
}
```

#### `importWordPressFiles`
Replaces WordPress directories from ZIP archives.

```json
{
  "step": "importWordPressFiles",
  "zipPath": "/wordpress/backup.zip"
}
```

### Database & Content

#### `runSql`
Executes SQL queries (line-by-line, uses $wpdb).

```json
{
  "step": "runSql",
  "sql": "UPDATE wp_posts SET post_status = 'publish' WHERE post_status = 'draft';\nDELETE FROM wp_comments WHERE comment_approved = '0';"
}
```

**Parameters:**
- `sql`: SQL statements (one per line, multi-line queries not supported)

#### `runPHP`
Executes PHP code (requires `wp-load.php` for WordPress functions).

```json
{
  "step": "runPHP",
  "code": "<?php\nrequire_once 'wordpress/wp-load.php';\n$post_id = wp_insert_post([\n  'post_title' => 'Test Post',\n  'post_content' => 'Hello from Blueprint!',\n  'post_status' => 'publish'\n]);\nerror_log('Created post: ' . $post_id);"
}
```

**Parameters:**
- `code`: PHP code string (include `<?php` tags)

#### `runPHPWithOptions`
Runs PHP with advanced options.

```json
{
  "step": "runPHPWithOptions",
  "options": {
    "code": "<?php echo 'Hello!';",
    "headers": {
      "Content-Type": "application/json"
    }
  }
}
```

**Parameters:**
- `options.code`: PHP code
- `options.headers`: HTTP headers object
- `options.method`: HTTP method

#### `importWxr`
Imports WordPress XML export (WXR) files.

```json
{
  "step": "importWxr",
  "file": {
    "resource": "url",
    "url": "https://example.com/export.xml"
  }
}
```

#### `resetData`
Deletes all posts and comments, resets auto-increment.

```json
{
  "step": "resetData"
}
```

### Authentication

#### `login`
Logs in a user (defaults to admin).

```json
{
  "step": "login",
  "username": "admin",
  "password": "password"
}
```

**Parameters:**
- `username`: WordPress username (default: "admin")
- `password`: User password (default: "password")

### Command Interface

#### `wp-cli`
Executes WP-CLI commands.

```json
{
  "step": "wp-cli",
  "command": "post list --post_type=page --format=json"
}
```

**Parameters:**
- `command`: WP-CLI command string

### Shorthand Syntax

Blueprint supports simplified syntax for common operations:

```json
{
  "login": true,
  "plugins": ["elementor", "yoast-seo"],
  "siteOptions": {
    "blogname": "Quick Setup"
  },
  "defineWpConfigConsts": {
    "WP_DEBUG": true
  }
}
```

---

## JavaScript API - PlaygroundClient

The JavaScript API provides programmatic control over WordPress Playground instances.

### Installation

```javascript
import { startPlaygroundWeb } from 'https://playground.wordpress.net/client/index.js';

const client = await startPlaygroundWeb({
  iframe: document.getElementById('wp-playground'),
  remoteUrl: 'https://playground.wordpress.net/remote.html',
  blueprint: {
    // Blueprint configuration
  }
});
```

### Core Methods

#### PHP Execution

**`run(code: string): Promise<PHPResponse>`**

Executes PHP code and returns output.

```javascript
const response = await client.run({
  code: `<?php
    require_once 'wordpress/wp-load.php';
    echo wp_version;
  `
});
console.log(response.text); // WordPress version
```

**`request(path: string, options?: RequestOptions): Promise<PHPResponse>`**

Makes HTTP request to WordPress site (simulates web server).

```javascript
const response = await client.request('/wp-admin/');
console.log(response.httpStatusCode); // 200
```

**`cli(args: string[]): Promise<PHPResponse>`** (Node.js only)

Runs PHP in CLI mode (instance unusable after).

```javascript
const response = await client.cli(['--version']);
console.log(response.text);
```

#### Configuration

**`setPhpIniEntries(entries: Record<string, string>): Promise<void>`**

Modifies php.ini settings.

```javascript
await client.setPhpIniEntries({
  display_errors: '1',
  error_reporting: 'E_ALL',
  memory_limit: '256M'
});
```

#### File System Operations

**`mkdirTree(path: string): Promise<void>`**

Creates nested directory structures.

```javascript
await client.mkdirTree('/wordpress/wp-content/uploads/2025/01');
```

**`writeFile(path: string, data: string | Uint8Array): Promise<void>`**

Creates or overwrites files.

```javascript
await client.writeFile(
  '/wordpress/wp-content/mu-plugins/custom.php',
  '<?php // Custom plugin code'
);
```

**`unlink(path: string): Promise<void>`**

Deletes a file.

```javascript
await client.unlink('/wordpress/wp-content/uploads/old-file.jpg');
```

**`isDir(path: string): Promise<boolean>`**

Checks if path is a directory.

```javascript
const exists = await client.isDir('/wordpress/wp-content/themes/my-theme');
console.log(exists); // true or false
```

**`listFiles(path: string): Promise<string[]>`**

Lists files in a directory.

```javascript
const files = await client.listFiles('/wordpress/wp-content/themes');
console.log(files); // ['twentytwentythree', 'hello-elementor', ...]
```

**`goTo(path: string): Promise<void>`**

Navigates to specified URL path.

```javascript
await client.goTo('/wp-admin/post-new.php');
```

#### Inter-Process Communication

**`onMessage(callback: (data: string) => void): void`**

Registers listener for PHP-to-JavaScript messages.

```javascript
client.onMessage((message) => {
  console.log('Received from PHP:', message);
});
```

**PHP Side (in PHP code):**

```php
<?php
post_message_to_js('Hello from PHP!');
```

### Console Access

For quick debugging, the JavaScript API is exposed as `window.playground`:

```javascript
// In browser console:
await window.playground.isDir('/wordpress/wp-content/themes');
await window.playground.listFiles('/wordpress/wp-content/plugins');
```

---

## Debugging and Logging

WordPress Playground provides multiple debugging and logging mechanisms.

### Browser Developer Tools

Access via:
- **Windows/Linux**: `Ctrl + Shift + I`
- **macOS**: `Cmd + Option + I`

**Capabilities:**
- Network request inspection
- Console logs
- JavaScript debugging
- DOM/CSS inspection

### PHP Error Logging

Use `error_log()` in PHP code to output debug messages:

```json
{
  "step": "runPHP",
  "code": "<?php\nrequire_once 'wordpress/wp-load.php';\nerror_log('Debug: Starting operation');\n$result = some_function();\nerror_log('Debug: Result = ' . print_r($result, true));"
}
```

### Viewing Logs

Three ways to access logs:

1. **UI Menu**: Click three-dot menu → "View Logs"
2. **Browser Console**: Check console output
3. **Download**: Export site as ZIP → extract `debug.log`

### Console API Methods

Use `window.playground` for debugging:

```javascript
// Check directory structure
await window.playground.listFiles('/wordpress/wp-content/plugins');

// Verify file exists
await window.playground.isDir('/wordpress/wp-content/themes/my-theme');

// Read file content
const response = await window.playground.run({
  code: '<?php echo file_get_contents("/wordpress/wp-config.php");'
});
console.log(response.text);
```

### Database Inspection

Use SQL Buddy plugin to visually inspect database:

```json
{
  "steps": [
    {
      "step": "installPlugin",
      "pluginData": {
        "resource": "wordpress.org/plugins",
        "slug": "sql-buddy"
      },
      "options": { "activate": true }
    }
  ]
}
```

### Filesystem Inspection

Use WPide plugin to browse files:

```json
{
  "steps": [
    {
      "step": "installPlugin",
      "pluginData": {
        "resource": "wordpress.org/plugins",
        "slug": "wpide"
      },
      "options": { "activate": true }
    }
  ]
}
```

### Enable WordPress Debug Mode

```json
{
  "step": "defineWpConfigConsts",
  "consts": {
    "WP_DEBUG": true,
    "WP_DEBUG_LOG": true,
    "WP_DEBUG_DISPLAY": false,
    "SCRIPT_DEBUG": true,
    "SAVEQUERIES": true
  }
}
```

---

## Bulk Operations and Programmatic SEO

WordPress Playground supports bulk content creation through PHP code execution.

### Creating Multiple Posts

#### Using runPHP Step

```json
{
  "step": "runPHP",
  "code": "<?php\nrequire_once 'wordpress/wp-load.php';\n\n$posts = [\n  ['title' => 'Post 1', 'content' => 'Content for post 1'],\n  ['title' => 'Post 2', 'content' => 'Content for post 2'],\n  ['title' => 'Post 3', 'content' => 'Content for post 3']\n];\n\nforeach ($posts as $post_data) {\n  $post_id = wp_insert_post([\n    'post_title' => $post_data['title'],\n    'post_content' => $post_data['content'],\n    'post_status' => 'publish',\n    'post_type' => 'post'\n  ]);\n  error_log('Created post ID: ' . $post_id);\n}"
}
```

#### Using JavaScript API

```javascript
const postsData = [
  { title: 'SEO Post 1', content: 'Content about topic A' },
  { title: 'SEO Post 2', content: 'Content about topic B' },
  { title: 'SEO Post 3', content: 'Content about topic C' }
];

const code = `<?php
require_once 'wordpress/wp-load.php';
$posts = json_decode('${JSON.stringify(postsData)}', true);
$results = [];

foreach ($posts as $post_data) {
  $post_id = wp_insert_post([
    'post_title' => $post_data['title'],
    'post_content' => $post_data['content'],
    'post_status' => 'publish',
    'post_type' => 'post'
  ]);
  $results[] = $post_id;
}

echo json_encode($results);
`;

const response = await client.run({ code });
const createdIds = JSON.parse(response.text);
console.log('Created post IDs:', createdIds);
```

### Creating Multiple Pages

```json
{
  "step": "runPHP",
  "code": "<?php\nrequire_once 'wordpress/wp-load.php';\n\n$pages = [\n  'About Us' => 'Company information...',\n  'Services' => 'Our services include...',\n  'Contact' => 'Get in touch...'\n];\n\nforeach ($pages as $title => $content) {\n  wp_insert_post([\n    'post_title' => $title,\n    'post_content' => $content,\n    'post_status' => 'publish',\n    'post_type' => 'page'\n  ]);\n}"
}
```

### Programmatic SEO with Templates

```javascript
// Generate 100 location-based pages
const cities = ['New York', 'Los Angeles', 'Chicago', /* ... */];
const template = (city) => `
<?php
require_once 'wordpress/wp-load.php';
wp_insert_post([
  'post_title' => 'Best Services in ${city}',
  'post_content' => '<h2>Welcome to ${city}</h2><p>Discover our services in ${city}...</p>',
  'post_status' => 'publish',
  'post_type' => 'page',
  'meta_input' => [
    'city' => '${city}',
    'yoast_wpseo_title' => 'Best Services in ${city} | Company Name',
    'yoast_wpseo_metadesc' => 'Find the best services in ${city}. Expert solutions for your needs.'
  ]
]);
`;

for (const city of cities) {
  await client.run({ code: template(city) });
}
```

### Bulk Category/Tag Assignment

```json
{
  "step": "runPHP",
  "code": "<?php\nrequire_once 'wordpress/wp-load.php';\n\n// Get all posts\n$posts = get_posts(['numberposts' => -1]);\n\n// Bulk assign categories\nforeach ($posts as $post) {\n  wp_set_post_categories($post->ID, [1, 2, 3]); // Category IDs\n  wp_set_post_tags($post->ID, 'tag1, tag2, tag3');\n}"
}
```

### Bulk Import from CSV

```javascript
const csvData = `Title,Content,Category
Post 1,Content 1,News
Post 2,Content 2,Tech
Post 3,Content 3,News`;

const code = `<?php
require_once 'wordpress/wp-load.php';

$csv = <<<CSV
${csvData}
CSV;

$lines = array_slice(str_getcsv($csv, "\\n"), 1); // Skip header

foreach ($lines as $line) {
  list($title, $content, $category) = str_getcsv($line);

  $cat_id = get_cat_ID($category);
  if (!$cat_id) {
    $cat_id = wp_create_category($category);
  }

  wp_insert_post([
    'post_title' => $title,
    'post_content' => $content,
    'post_status' => 'publish',
    'post_category' => [$cat_id]
  ]);
}
`;

await client.run({ code });
```

---

## Import/Export and Site Backup

WordPress Playground supports full site import/export for backups and migration.

### Exporting Site

#### Via UI
1. Click three-dot menu (next to "Homepage" button)
2. Select "Download as .zip"
3. Save `.zip` file (includes database, files, and config)

#### Via JavaScript API

```javascript
// Export entire site
const blob = await client.exportSite();
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'playground-backup.zip';
a.click();
```

### Importing Site

#### Via UI
1. Click three-dot menu
2. Select "Import from .zip"
3. Choose previously exported `.zip` file
4. Site restores with all data

#### Via Blueprint

```json
{
  "step": "importWordPressFiles",
  "zipPath": "/wordpress/backup.zip"
}
```

### Export Format

Exported `.zip` contains:

```
playground-export.zip
├── wordpress/                 # All WordPress files
│   ├── wp-content/
│   │   ├── plugins/
│   │   ├── themes/
│   │   └── uploads/
│   ├── wp-admin/
│   ├── wp-includes/
│   └── wp-config.php
├── wp-content/*.sql          # Database dump (split by table)
└── database.sqlite           # SQLite database file
```

### Import WXR (WordPress Export)

```json
{
  "step": "importWxr",
  "file": {
    "resource": "url",
    "url": "https://example.com/wordpress-export.xml"
  }
}
```

### Database-Only Export

```javascript
// Export database as SQL
const code = `<?php
require_once 'wordpress/wp-load.php';
global $wpdb;

$tables = $wpdb->get_results('SHOW TABLES', ARRAY_N);
$sql_dump = '';

foreach ($tables as $table) {
  $table_name = $table[0];
  $sql_dump .= "-- Table: $table_name\\n";
  $sql_dump .= "DROP TABLE IF EXISTS $table_name;\\n";

  // Get CREATE TABLE statement
  $create = $wpdb->get_row("SHOW CREATE TABLE $table_name", ARRAY_N);
  $sql_dump .= $create[1] . ";\\n\\n";

  // Get data
  $rows = $wpdb->get_results("SELECT * FROM $table_name", ARRAY_A);
  foreach ($rows as $row) {
    $values = array_map(function($v) use ($wpdb) {
      return $wpdb->prepare('%s', $v);
    }, array_values($row));
    $sql_dump .= "INSERT INTO $table_name VALUES (" . implode(',', $values) . ");\\n";
  }
  $sql_dump .= "\\n";
}

file_put_contents('/wordpress/database-backup.sql', $sql_dump);
echo 'Database exported!';
`;

await client.run({ code });
```

---

## Plugin and Theme Testing

WordPress Playground is ideal for testing plugins and themes in isolated environments.

### Testing Plugin Installation

```json
{
  "steps": [
    {
      "step": "installPlugin",
      "pluginData": {
        "resource": "url",
        "url": "https://downloads.wordpress.org/plugin/your-plugin.zip"
      },
      "options": {
        "activate": true
      }
    },
    {
      "step": "login"
    }
  ],
  "landingPage": "/wp-admin/plugins.php"
}
```

### Testing Theme Activation

```json
{
  "steps": [
    {
      "step": "installTheme",
      "themeData": {
        "resource": "url",
        "url": "https://example.com/my-theme.zip"
      },
      "options": {
        "activate": true,
        "importStarterContent": true
      }
    }
  ],
  "landingPage": "/"
}
```

### Testing with Sample Content

```json
{
  "steps": [
    {
      "step": "installPlugin",
      "pluginData": {
        "resource": "wordpress.org/plugins",
        "slug": "fakerpress"
      },
      "options": { "activate": true }
    },
    {
      "step": "runPHP",
      "code": "<?php\nrequire_once 'wordpress/wp-load.php';\n// Generate 50 posts with FakerPress\ndo_action('fakerpress.generate', 'post', ['qty' => 50]);"
    }
  ]
}
```

### Testing Elementor Widgets

```json
{
  "steps": [
    {
      "step": "installPlugin",
      "pluginData": {
        "resource": "wordpress.org/plugins",
        "slug": "elementor"
      },
      "options": { "activate": true }
    },
    {
      "step": "installTheme",
      "themeData": {
        "resource": "wordpress.org/themes",
        "slug": "hello-elementor"
      },
      "options": { "activate": true }
    },
    {
      "step": "runPHP",
      "code": "<?php\nrequire_once 'wordpress/wp-load.php';\n// Create page with Elementor\n$page_id = wp_insert_post([\n  'post_title' => 'Elementor Test Page',\n  'post_content' => '',\n  'post_status' => 'publish',\n  'post_type' => 'page'\n]);\nupdate_post_meta($page_id, '_elementor_edit_mode', 'builder');\nupdate_post_meta($page_id, '_elementor_template_type', 'wp-page');"
    },
    {
      "step": "login"
    }
  ],
  "landingPage": "/wp-admin/post.php?post=2&action=elementor"
}
```

### Monitoring Plugin Errors

```json
{
  "steps": [
    {
      "step": "defineWpConfigConsts",
      "consts": {
        "WP_DEBUG": true,
        "WP_DEBUG_LOG": true,
        "WP_DEBUG_DISPLAY": false
      }
    },
    {
      "step": "installPlugin",
      "pluginData": {
        "resource": "url",
        "url": "https://example.com/test-plugin.zip"
      },
      "options": { "activate": true }
    },
    {
      "step": "runPHP",
      "code": "<?php\nrequire_once 'wordpress/wp-load.php';\n// Trigger plugin actions\ndo_action('init');\ndo_action('wp_loaded');\n// Check for errors\n$log = file_get_contents('/wordpress/wp-content/debug.log');\nif (strpos($log, 'Fatal error') !== false) {\n  error_log('FATAL ERROR DETECTED!');\n  error_log($log);\n}"
    }
  ]
}
```

### Cross-Version Testing

Test plugin across multiple WordPress/PHP versions:

```javascript
const versions = [
  { wp: '6.0', php: '7.4' },
  { wp: '6.1', php: '8.0' },
  { wp: '6.2', php: '8.1' },
  { wp: 'latest', php: '8.2' }
];

for (const version of versions) {
  const iframe = document.createElement('iframe');
  document.body.appendChild(iframe);

  const client = await startPlaygroundWeb({
    iframe,
    blueprint: {
      preferredVersions: {
        wp: version.wp,
        php: version.php
      },
      steps: [
        {
          step: 'installPlugin',
          pluginData: {
            resource: 'url',
            url: 'https://example.com/my-plugin.zip'
          },
          options: { activate: true }
        },
        {
          step: 'runPHP',
          code: `<?php
            require_once 'wordpress/wp-load.php';
            error_log('Testing on WP ${version.wp} / PHP ${version.php}');
            // Run plugin tests
          `
        }
      ]
    }
  });

  // Check logs for errors
  console.log(`Testing WP ${version.wp} / PHP ${version.php}`);
}
```

---

## Advanced Use Cases

### 1. Automated Testing Pipeline

```javascript
// Test suite for WordPress plugin
async function runTestSuite(pluginUrl) {
  const tests = [
    {
      name: 'Plugin Activation',
      test: async (client) => {
        const response = await client.run({
          code: `<?php
            require_once 'wordpress/wp-load.php';
            $active = is_plugin_active('my-plugin/my-plugin.php');
            echo json_encode(['active' => $active]);
          `
        });
        return JSON.parse(response.text).active === true;
      }
    },
    {
      name: 'Settings Page Exists',
      test: async (client) => {
        const response = await client.request('/wp-admin/options-general.php?page=my-plugin');
        return response.httpStatusCode === 200;
      }
    },
    {
      name: 'No PHP Errors',
      test: async (client) => {
        const response = await client.run({
          code: `<?php
            require_once 'wordpress/wp-load.php';
            $log = file_exists('/wordpress/wp-content/debug.log')
              ? file_get_contents('/wordpress/wp-content/debug.log')
              : '';
            echo $log;
          `
        });
        return !response.text.includes('Fatal error');
      }
    }
  ];

  const client = await startPlaygroundWeb({
    blueprint: {
      steps: [
        {
          step: 'defineWpConfigConsts',
          consts: { WP_DEBUG: true, WP_DEBUG_LOG: true }
        },
        {
          step: 'installPlugin',
          pluginData: { resource: 'url', url: pluginUrl },
          options: { activate: true }
        }
      ]
    }
  });

  const results = [];
  for (const test of tests) {
    try {
      const passed = await test.test(client);
      results.push({ name: test.name, passed });
    } catch (error) {
      results.push({ name: test.name, passed: false, error: error.message });
    }
  }

  return results;
}
```

### 2. Interactive Documentation

Create live code examples in documentation:

```html
<div id="wp-demo"></div>
<button onclick="runDemo()">Run Example</button>

<script type="module">
import { startPlaygroundWeb } from 'https://playground.wordpress.net/client/index.js';

window.runDemo = async function() {
  const client = await startPlaygroundWeb({
    iframe: document.getElementById('wp-demo'),
    blueprint: {
      steps: [
        {
          step: 'runPHP',
          code: `<?php
            require_once 'wordpress/wp-load.php';
            // Example: Create custom post type
            register_post_type('product', [
              'labels' => ['name' => 'Products'],
              'public' => true,
              'has_archive' => true
            ]);

            // Create sample product
            wp_insert_post([
              'post_title' => 'Sample Product',
              'post_type' => 'product',
              'post_status' => 'publish'
            ]);

            echo 'Product created!';
          `
        }
      ]
    }
  });
};
</script>
```

### 3. Client Data Migration Preview

Allow clients to preview their site migration:

```javascript
async function previewMigration(clientBackupUrl) {
  const client = await startPlaygroundWeb({
    blueprint: {
      steps: [
        {
          step: 'importWordPressFiles',
          zipPath: clientBackupUrl
        },
        {
          step: 'runPHP',
          code: `<?php
            require_once 'wordpress/wp-load.php';
            // Update URLs for preview
            update_option('siteurl', 'https://preview.example.com');
            update_option('home', 'https://preview.example.com');

            // Disable contact forms to prevent spam
            update_option('wpcf7_disabled', 1);
          `
        },
        {
          step: 'login'
        }
      ]
    }
  });

  return client;
}
```

### 4. AI-Powered Content Generation

Generate WordPress content with AI:

```javascript
async function generateAIContent(topic, count = 10) {
  const client = await startPlaygroundWeb({
    blueprint: {
      steps: [
        { step: 'login' }
      ]
    }
  });

  // Generate content with AI (pseudo-code)
  for (let i = 0; i < count; i++) {
    const content = await callAIAPI(`Write a blog post about ${topic}`);

    await client.run({
      code: `<?php
        require_once 'wordpress/wp-load.php';
        wp_insert_post([
          'post_title' => ${JSON.stringify(content.title)},
          'post_content' => ${JSON.stringify(content.body)},
          'post_status' => 'publish'
        ]);
      `
    });
  }
}
```

### 5. Multi-Site Testing

Test plugin across multiple site configurations:

```javascript
async function testMultipleConfigurations(pluginUrl) {
  const configs = [
    { name: 'Basic', plugins: [] },
    { name: 'WooCommerce', plugins: ['woocommerce'] },
    { name: 'Elementor', plugins: ['elementor'] },
    { name: 'Full Stack', plugins: ['woocommerce', 'elementor', 'yoast-seo'] }
  ];

  const results = {};

  for (const config of configs) {
    const steps = config.plugins.map(slug => ({
      step: 'installPlugin',
      pluginData: { resource: 'wordpress.org/plugins', slug },
      options: { activate: true }
    }));

    steps.push({
      step: 'installPlugin',
      pluginData: { resource: 'url', url: pluginUrl },
      options: { activate: true }
    });

    const client = await startPlaygroundWeb({ blueprint: { steps } });

    // Run tests
    const response = await client.run({
      code: `<?php
        require_once 'wordpress/wp-load.php';
        $errors = [];

        // Check for conflicts
        ob_start();
        do_action('init');
        $output = ob_get_clean();

        if (strpos($output, 'error') !== false) {
          $errors[] = $output;
        }

        echo json_encode(['success' => empty($errors), 'errors' => $errors]);
      `
    });

    results[config.name] = JSON.parse(response.text);
  }

  return results;
}
```

---

## Limitations and Known Issues

### 1. Elementor Editor Issues

**Problem**: Elementor editor may get stuck on "Loading" screen in Playground.

**Cause**: Browser-based environment has limitations with:
- Dynamic file loading
- Server-side processing
- WebSocket connections
- Some AJAX requests

**Workaround**: Use Blueprint API to create Elementor content programmatically instead of visual editor.

### 2. Multi-Line SQL Queries

**Problem**: `runSql` step treats each line as separate query.

**Workaround**: Use semicolons on same line or `runPHP` with `$wpdb`:

```json
{
  "step": "runPHP",
  "code": "<?php\nrequire_once 'wordpress/wp-load.php';\nglobal $wpdb;\n$wpdb->query(\"\n  UPDATE wp_posts\n  SET post_status = 'publish'\n  WHERE post_type = 'page'\n\");"
}
```

### 3. Networking Limitations

**Problem**: External HTTP requests may fail.

**Solution**: Enable networking feature:

```json
{
  "features": {
    "networking": true
  }
}
```

**Note**: Not all external services work due to CORS restrictions.

### 4. File Upload Size

**Problem**: Large file uploads (>50MB) may fail.

**Workaround**: Split into smaller chunks or use external hosting.

### 5. No Persistent Storage

**Problem**: Data resets on page refresh unless exported.

**Solution**: Use export/import workflow or localStorage caching:

```javascript
// Auto-save every 5 minutes
setInterval(async () => {
  const blob = await client.exportSite();
  const reader = new FileReader();
  reader.onload = () => {
    localStorage.setItem('playground-backup', reader.result);
  };
  reader.readAsDataURL(blob);
}, 5 * 60 * 1000);
```

### 6. Plugin Compatibility

**Plugins with Issues:**
- Caching plugins (use in-memory caching)
- CDN plugins (external services blocked)
- Email plugins (SMTP not fully supported)
- Payment gateways (external API limitations)

**Best Practices:**
- Test in Playground first
- Use `WP_DEBUG` to catch errors
- Monitor console logs
- Export site before major changes

### 7. Performance Considerations

**Slow Operations:**
- Large database queries
- Image processing
- ZIP extraction
- Multiple plugin installations

**Optimization Tips:**
- Use `phpExtensionBundles: ["light"]` for faster loading
- Minimize file operations
- Cache results when possible
- Use batch operations instead of loops

---

## Code Examples

### Complete Blueprint: E-Commerce Demo Site

```json
{
  "landingPage": "/shop/",
  "preferredVersions": {
    "php": "8.1",
    "wp": "6.4"
  },
  "features": {
    "networking": true
  },
  "steps": [
    {
      "step": "login",
      "username": "demo",
      "password": "demo123"
    },
    {
      "step": "installPlugin",
      "pluginData": {
        "resource": "wordpress.org/plugins",
        "slug": "woocommerce"
      },
      "options": {
        "activate": true
      }
    },
    {
      "step": "installTheme",
      "themeData": {
        "resource": "wordpress.org/themes",
        "slug": "storefront"
      },
      "options": {
        "activate": true
      }
    },
    {
      "step": "setSiteOptions",
      "options": {
        "blogname": "Demo Store",
        "blogdescription": "WooCommerce Demo Site",
        "woocommerce_store_address": "123 Demo St",
        "woocommerce_store_city": "Demo City",
        "woocommerce_default_country": "US:CA",
        "woocommerce_currency": "USD"
      }
    },
    {
      "step": "runPHP",
      "code": "<?php\nrequire_once 'wordpress/wp-load.php';\n\n// Create sample products\n$products = [\n  ['name' => 'T-Shirt', 'price' => 19.99, 'desc' => 'Comfortable cotton t-shirt'],\n  ['name' => 'Jeans', 'price' => 49.99, 'desc' => 'Classic blue jeans'],\n  ['name' => 'Sneakers', 'price' => 79.99, 'desc' => 'Athletic sneakers']\n];\n\nforeach ($products as $product) {\n  $post_id = wp_insert_post([\n    'post_title' => $product['name'],\n    'post_content' => $product['desc'],\n    'post_status' => 'publish',\n    'post_type' => 'product'\n  ]);\n  \n  update_post_meta($post_id, '_price', $product['price']);\n  update_post_meta($post_id, '_regular_price', $product['price']);\n  wp_set_object_terms($post_id, 'simple', 'product_type');\n}\n\nerror_log('Created ' . count($products) . ' products');"
    }
  ]
}
```

### Complete JavaScript: Plugin Testing Framework

```javascript
import { startPlaygroundWeb } from 'https://playground.wordpress.net/client/index.js';

class PluginTester {
  constructor(pluginUrl) {
    this.pluginUrl = pluginUrl;
    this.client = null;
  }

  async init() {
    this.client = await startPlaygroundWeb({
      blueprint: {
        preferredVersions: { php: '8.1', wp: 'latest' },
        steps: [
          {
            step: 'defineWpConfigConsts',
            consts: {
              WP_DEBUG: true,
              WP_DEBUG_LOG: true,
              WP_DEBUG_DISPLAY: false
            }
          },
          {
            step: 'installPlugin',
            pluginData: { resource: 'url', url: this.pluginUrl },
            options: { activate: true }
          },
          { step: 'login' }
        ]
      }
    });
  }

  async runTest(name, testFn) {
    console.log(`Running test: ${name}`);
    try {
      const result = await testFn(this.client);
      console.log(`✓ ${name}: PASSED`);
      return { name, passed: true, result };
    } catch (error) {
      console.error(`✗ ${name}: FAILED - ${error.message}`);
      return { name, passed: false, error: error.message };
    }
  }

  async checkActivation() {
    return this.runTest('Plugin Activation', async (client) => {
      const response = await client.run({
        code: `<?php
          require_once 'wordpress/wp-load.php';
          $plugins = get_option('active_plugins');
          echo json_encode($plugins);
        `
      });
      const active = JSON.parse(response.text);
      if (active.length === 0) throw new Error('Plugin not activated');
      return active;
    });
  }

  async checkErrors() {
    return this.runTest('No PHP Errors', async (client) => {
      const response = await client.run({
        code: `<?php
          require_once 'wordpress/wp-load.php';
          $log_file = '/wordpress/wp-content/debug.log';
          if (file_exists($log_file)) {
            echo file_get_contents($log_file);
          } else {
            echo 'No errors logged';
          }
        `
      });

      if (response.text.includes('Fatal error')) {
        throw new Error('Fatal error detected in logs');
      }
      if (response.text.includes('Warning')) {
        throw new Error('PHP warnings detected');
      }
      return 'No errors found';
    });
  }

  async checkSettingsPage(pageSlug) {
    return this.runTest('Settings Page Accessible', async (client) => {
      const response = await client.request(`/wp-admin/options-general.php?page=${pageSlug}`);
      if (response.httpStatusCode !== 200) {
        throw new Error(`Settings page returned ${response.httpStatusCode}`);
      }
      return 'Settings page accessible';
    });
  }

  async runAllTests() {
    await this.init();

    const results = await Promise.all([
      this.checkActivation(),
      this.checkErrors(),
      this.checkSettingsPage('my-plugin')
    ]);

    const passed = results.filter(r => r.passed).length;
    const total = results.length;

    console.log(`\n=== Test Results: ${passed}/${total} passed ===`);
    return results;
  }
}

// Usage
const tester = new PluginTester('https://example.com/my-plugin.zip');
const results = await tester.runAllTests();
```

---

## Additional Resources

### Official Documentation
- **Main Docs**: https://wordpress.github.io/wordpress-playground/
- **Blueprint Reference**: https://wordpress.github.io/wordpress-playground/blueprints/steps/
- **JavaScript API**: https://wordpress.github.io/wordpress-playground/developers/apis/javascript-api/
- **Troubleshooting**: https://wordpress.github.io/wordpress-playground/blueprints/troubleshoot-and-debug/

### Tools and Plugins
- **Blueprint Editor**: https://playground.wordpress.net/builder/builder.html
- **WP-NOW CLI**: Run Playground locally via command line
- **VS Code Plugin**: Playground integration for VS Code
- **Studio (WordPress.com)**: Desktop app for Playground

### Community Resources
- **GitHub Repository**: https://github.com/WordPress/wordpress-playground
- **WordPress Slack**: #playground channel
- **Make WordPress**: https://make.wordpress.org/playground/

---

## Changelog

- **January 2025**: Initial comprehensive documentation
- **January 2025**: Added bulk operations and programmatic SEO examples
- **January 2025**: Added advanced testing workflows
- **January 2025**: Added import/export specifications

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Contributors**: Research compiled from official WordPress Playground documentation, community resources, and hands-on testing.
