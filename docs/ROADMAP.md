# Product Roadmap Documentation

**Last Updated:** November 3, 2025

This document tracks the product roadmap for Hustle Tools, including completed features, work in progress, and planned enhancements.

---

## Table of Contents

1. [Overview](#overview)
2. [In Progress](#in-progress)
3. [Planned Features](#planned-features)
4. [Feature Details](#feature-details)

---

## Overview

The Hustle Tools roadmap is organized by status and priority:

- **Status**: `completed`, `in-progress`, `planned`
- **Category**: `docs`, `elementor`, `ai`, `infrastructure`, `general`
- **Priority**: `high`, `medium`, `low`

View the interactive roadmap at `/roadmap` in the application.

---

## In Progress

### Google Docs API Integration
- **Category**: docs
- **Priority**: high
- **ETA**: Q1 2025
- **Description**: Real-time collaboration with Google Docs for document editing

**Features:**
- Real-time commenting and suggestions
- Create, update, edit, and delete documents
- Share documents with permissions (view, comment, edit)
- Import/export between Google Docs and Hustle Tools
- Collaborative editing with multiple users
- Version history and revision tracking
- Integrate with existing AI Doc Editor

### WordPress Plugin Builder
- **Category**: elementor
- **Priority**: high
- **ETA**: Q1 2025
- **Description**: Create complete WordPress plugins with file management and testing

**Features:**
- Multi-file project structure (PHP, CSS, JS, assets)
- Plugin metadata and headers
- Custom post types, taxonomies, and settings pages
- Admin UI and shortcodes
- Test plugins in WordPress Playground
- Export as installable .zip files
- AI-assisted plugin generation

### Gentec Project Generator & Multi-Agent System
- **Category**: ai
- **Priority**: high
- **ETA**: Q1 2025
- **Description**: Complete project generation system with planner agent, document tracking, and bulk widget creation

**Features:**
- Multi-agent system that can run 10-20 tools in sequence
- Project templates and defaults for rapid setup
- Bulk widget/section creation from style guides
- Full WordPress site generation with multiple sections
- Real-time import and testing in WordPress Playground
- Planner agent for task decomposition and scheduling
- Document tracker for project progress and deliverables
- Widget element auditing tool (ensures all elements are editable)
- Automated control generation for dynamic content
- Style guide to full site workflow
- Export complete widget folders with all sections
- Integration with existing Elementor tools
- Version control and project history

### Auto-Run Mode with Live Notifications
- **Category**: ai
- **Priority**: high
- **ETA**: Q1 2025
- **Description**: Automatic tool execution with real-time visual feedback and mobile-optimized notification system

**Features:**
- Auto-run mode: Execute 10-20 tools automatically in sequence
- Live notification system in prompt window area
- Color-coded status indicators (green=completed, yellow=in-progress, orange=attention)
- Tool progress overlay replacing project context temporarily
- Short summaries (2-3 sentences) for each tool execution
- Mobile-optimized: Always-visible prompt window
- Minimize chat content, maximize notification visibility
- Real-time streaming status updates
- Tool completion animations and transitions
- Agent workflow progress tracking
- Non-intrusive notification system
- Auto-scroll prevention for mobile
- Context badge state changes (orange for updates)
- Interrupt/pause controls for auto-run

### Agentic Planning & Multi-Step Workflows
- **Category**: ai
- **Priority**: high
- **ETA**: Q2 2025
- **Description**: Advanced AI agents with planning, reasoning, and multi-step execution

**Features:**
- Chain-of-thought reasoning for complex tasks
- Task decomposition and step-by-step execution
- Dynamic tool selection and orchestration
- Progress tracking and intermediate results
- Self-correction and error recovery
- Multi-agent collaboration (specialized agents)
- Visual workflow builder for custom automations

### Style Guide Importer Enhancement
- **Category**: elementor
- **Priority**: high
- **ETA**: Q1 2025
- **Description**: Fix and improve style guide importer for WordPress and HTML environments

**Features:**
- Import CSS from WordPress theme files
- Extract styles from HTML/CSS environments
- Parse and convert CSS variables to Elementor format
- Auto-detect typography settings (fonts, sizes, weights)
- Auto-detect color palettes from CSS
- Support for custom CSS frameworks (Tailwind, Bootstrap, etc.)
- Preview imported styles before applying

---

## Planned Features

### Browserbase & CodeSandbox Integration
- **Category**: infrastructure
- **Priority**: high
- **ETA**: Q2 2025
- **Description**: Cloud browser infrastructure and live development environments for testing, code execution, and collaboration

**Browserbase Features:**
- Scalable headless browser infrastructure (1000s of browsers)
- Integration with Playwright, Puppeteer, Selenium, and Stagehand
- Live View embedding for real-time browser observation
- Session recording and debugging capabilities
- AI agent browser tools with natural language control
- Stealth features: captcha solving, residential proxies, fingerprinting

**CodeSandbox Features:**
- Live development environments for widget testing
- Instant WordPress/React sandbox creation
- Share live preview links with clients
- Real-time collaborative editing
- NPM package testing and validation
- GitHub integration for widget libraries
- WordPress site testing in real browsers
- Code execution in isolated environments
- Integration with Gentec Project Generator
- Embed live sandboxes in Hustle Tools UI

### Client Library Documentation System
- **Category**: docs
- **Priority**: high
- **ETA**: Q2 2025
- **Description**: Comprehensive documentation storage and retrieval system for client projects, widgets, and Elementor pages

**Features:**
- Store documentation for individual widgets, components, and pages
- Per-client library storage with version control
- Elementor page/section documentation with usage examples
- Widget documentation with props, controls, and styling guides
- Search and filter documentation by client, project, or component type
- AI-powered documentation generation from code
- Automatic documentation updates when code changes
- Export documentation as Markdown, PDF, or HTML
- Link documentation to specific WordPress/Elementor installations
- Code snippet library with syntax highlighting
- Integration with Elementor editor for inline docs
- Component dependency tracking and relationship mapping
- Template and pattern library with live previews

**Technical Implementation:**
- Supabase-based storage for documentation
- Per-client database tables or schemas
- Full-text search capabilities
- Version control using timestamps or semantic versioning
- AI integration for auto-generating documentation from PHP/JS code
- Link to specific Elementor installations via project ID
- Export functionality for offline documentation

### HubL Code Page/Email Generator
- **Category**: general
- **Priority**: medium
- **ETA**: Q2 2025
- **Description**: AI-powered generator for HubSpot HubL code for pages and emails

**Features:**
- Generate HubL templates for pages and emails
- Blog post and landing page templates
- HubDB integration and contact properties
- Email-specific features (responsive tables, CAN-SPAM compliance)
- Chat-based editing with AI assistance
- Live HubL preview with sample data
- Mobile/desktop and email client preview
- Export as .html files or direct upload to HubSpot
- Pre-built templates for newsletters, transactional emails, and landing pages

### HubSpot Form Styler
- **Category**: general
- **Priority**: medium
- **ETA**: Q2 2025
- **Description**: Style raw HTML HubSpot forms with CSS and render them with live preview

**Features:**
- Import raw HubSpot form HTML
- Visual CSS editor with live preview
- Generate CSS with proper HubSpot form selectors
- Comprehensive guide on HubSpot form selector patterns
- Pre-built form style templates
- Responsive design tools (mobile/tablet/desktop preview)
- Custom styling for inputs, labels, buttons, error messages
- Support for multi-step forms and conditional fields
- Export styled CSS ready for HubSpot deployment
- AI-assisted form styling suggestions

---

## Feature Details

### Client Library Documentation System - Deep Dive

This system addresses a critical need for managing documentation across multiple client projects, especially for WordPress/Elementor development agencies and freelancers.

#### Use Cases

1. **Widget Library Management**
   - Store documentation for all custom Elementor widgets
   - Include code snippets, control documentation, and styling guides
   - Track which clients are using which widgets
   - Version history for widget updates

2. **Page Template Documentation**
   - Document reusable page templates and sections
   - Include screenshots and usage instructions
   - Track template dependencies and required plugins
   - Export template documentation for client handoff

3. **Component Pattern Library**
   - Build a library of reusable patterns (headers, footers, CTAs, etc.)
   - Link patterns to specific implementation code
   - Track component dependencies and relationships
   - Generate component usage reports

4. **Client Handoff**
   - Generate comprehensive documentation for client sites
   - Include custom code explanations and maintenance guides
   - Export as PDF or HTML for offline access
   - Track documentation updates over time

#### Architecture

```
Client Library Documentation System
├── Storage Layer (Supabase)
│   ├── clients table
│   ├── projects table
│   ├── components table (widgets, pages, sections)
│   ├── documentation table (markdown content)
│   └── code_snippets table
├── Documentation Generator
│   ├── PHP parser (extract widget controls, render methods)
│   ├── JS/CSS parser (extract scripts and styles)
│   └── AI documentation writer (OpenAI/Anthropic)
├── Search & Filter
│   ├── Full-text search (Supabase/PostgreSQL)
│   ├── Tag/category filtering
│   └── Client/project filtering
└── Export System
    ├── Markdown exporter
    ├── PDF generator (using Puppeteer)
    └── HTML static site generator
```

#### Integration Points

- **Elementor Editor**: Inline documentation viewer in widget settings
- **WordPress Playground**: Test documented components in sandbox
- **AI Chat**: Query documentation via natural language
- **Project Manager**: Link docs to specific projects/clients
- **Code Editor**: Syntax-highlighted code snippets with copy button

### Auto-Run Mode with Live Notifications - Deep Dive

This feature transforms the multi-agent workflow experience by providing automatic tool execution with real-time visual feedback, eliminating the need to monitor chat messages while maintaining full visibility of agent progress.

#### The Problem

Current multi-agent workflows require:
- Manually scrolling through chat to see tool execution
- Reading verbose tool outputs and messages
- Mobile users miss updates when keyboard is visible
- No quick way to see "what's happening now"
- Chat history clutters the view during long workflows

#### The Solution

**Auto-Run Mode** with a smart notification system that:
- Runs 10-20 tools automatically without manual approval
- Shows live progress in the prompt window area
- Uses color coding for instant status recognition
- Provides concise 2-3 sentence summaries
- Keeps prompt window always visible (especially on mobile)
- Minimizes chat clutter while maximizing visibility

#### UI Design

**Prompt Window Notification Area:**

```
┌─────────────────────────────────────────────────────────┐
│ 🟡 Tool 3/15: Generating Hero Widget                     │
│ Creating HTML structure with Elementor controls.         │
│ Estimated completion: 15 seconds                         │
└─────────────────────────────────────────────────────────┘
│                                                           │
│ [Type your message or wait for auto-run to complete...] │
└─────────────────────────────────────────────────────────┘
```

**Status Color Coding:**
- 🟢 **Green**: Tool completed successfully (flashes for 1 second)
- 🟡 **Yellow**: Tool currently executing / streaming
- 🟠 **Orange**: Attention needed (review required)
- 🔴 **Red**: Error occurred (auto-run paused)
- ⚪ **Gray**: Waiting in queue

**Mobile Optimization:**

```
Mobile View (with keyboard open):
┌──────────────────────────────┐
│ 🟡 3/15: Creating CSS...     │ ← Always visible
│ Applying style guide colors  │
│ and typography settings      │
├──────────────────────────────┤
│ [Your message here...]  [>]  │ ← Keyboard doesn't hide
└──────────────────────────────┘
        ↑ Chat history hidden
```

#### Technical Implementation

**Notification State Management:**

```typescript
interface ToolNotification {
  toolNumber: number;
  totalTools: number;
  toolName: string;
  status: 'queued' | 'running' | 'completed' | 'error' | 'attention';
  summary: string; // 2-3 sentences max
  progress?: number; // 0-100
  estimatedTime?: number; // seconds
}

// Notification store
const useNotificationStore = create<{
  currentNotification: ToolNotification | null;
  setNotification: (notification: ToolNotification) => void;
  clearNotification: () => void;
}>((set) => ({
  currentNotification: null,
  setNotification: (notification) => set({ currentNotification: notification }),
  clearNotification: () => set({ currentNotification: null }),
}));
```

**Auto-Run Manager:**

```typescript
class AutoRunManager {
  async executeToolChain(tools: Tool[]) {
    for (let i = 0; i < tools.length; i++) {
      const tool = tools[i];
      
      // Update notification: Starting
      notificationStore.setNotification({
        toolNumber: i + 1,
        totalTools: tools.length,
        toolName: tool.name,
        status: 'running',
        summary: this.generateSummary(tool, 'starting'),
        progress: 0,
      });

      // Execute tool with streaming
      try {
        await this.executeWithProgress(tool, (progress) => {
          // Update progress in real-time
          notificationStore.setNotification({
            ...notificationStore.currentNotification,
            progress,
            summary: this.generateSummary(tool, 'progress'),
          });
        });

        // Completed - flash green
        notificationStore.setNotification({
          toolNumber: i + 1,
          totalTools: tools.length,
          toolName: tool.name,
          status: 'completed',
          summary: this.generateSummary(tool, 'completed'),
          progress: 100,
        });

        // Hold green for 1 second
        await this.sleep(1000);

      } catch (error) {
        // Error - show red, pause auto-run
        notificationStore.setNotification({
          toolNumber: i + 1,
          totalTools: tools.length,
          toolName: tool.name,
          status: 'error',
          summary: `Error: ${error.message}. Review and continue.`,
        });
        break; // Pause auto-run
      }
    }

    // All completed
    notificationStore.clearNotification();
  }

  generateSummary(tool: Tool, phase: string): string {
    // AI-generated or template-based summary
    // Max 2-3 sentences, plain language
    switch (phase) {
      case 'starting':
        return `Starting ${tool.name}. ${tool.description}.`;
      case 'progress':
        return `Processing ${tool.name}. ${tool.currentAction}.`;
      case 'completed':
        return `Completed ${tool.name}. ${tool.result}.`;
    }
  }
}
```

**Notification Component:**

```typescript
function ToolNotificationBar() {
  const notification = useNotificationStore(s => s.currentNotification);
  const [isVisible, setIsVisible] = useState(false);

  if (!notification) return null;

  const statusColors = {
    queued: 'bg-gray-100 text-gray-700',
    running: 'bg-yellow-100 text-yellow-800 animate-pulse',
    completed: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800',
    attention: 'bg-orange-100 text-orange-800',
  };

  return (
    <div className={cn(
      'absolute top-0 left-0 right-0 z-50 p-3 rounded-t-lg',
      'transition-all duration-300',
      statusColors[notification.status]
    )}>
      {/* Status Icon */}
      <div className="flex items-start gap-2">
        <StatusIcon status={notification.status} />
        
        {/* Tool Info */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">
            Tool {notification.toolNumber}/{notification.totalTools}: {notification.toolName}
          </div>
          <div className="text-xs mt-1 line-clamp-2">
            {notification.summary}
          </div>
        </div>

        {/* Progress */}
        {notification.progress !== undefined && (
          <div className="text-xs font-mono">
            {notification.progress}%
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {notification.status === 'running' && (
        <div className="w-full h-1 bg-gray-200 rounded-full mt-2">
          <div
            className="h-full bg-yellow-500 rounded-full transition-all duration-300"
            style={{ width: `${notification.progress || 0}%` }}
          />
        </div>
      )}
    </div>
  );
}
```

**Mobile-Specific Optimizations:**

```typescript
// Prevent auto-scroll on mobile when notification updates
useEffect(() => {
  if (isMobile && notification) {
    // Lock scroll position
    const promptInput = document.querySelector('[data-prompt-input]');
    if (promptInput) {
      promptInput.scrollIntoView({ behavior: 'instant', block: 'end' });
    }
  }
}, [notification, isMobile]);

// Keep prompt window always visible
<div className={cn(
  'fixed bottom-0 left-0 right-0',
  'bg-background border-t',
  'z-40', // Below notification (z-50)
  isMobile && 'pb-safe-area-bottom'
)}>
  <ToolNotificationBar />
  <PromptInput />
</div>
```

#### User Experience Flow

**Desktop Experience:**

1. User starts Gentec project: "Generate 15 widgets from this style guide"
2. Planner Agent decomposes into 15 tool calls
3. Auto-run begins
4. Notification bar appears above prompt, cycling through:
   - 🟡 "Tool 1/15: Parsing Style Guide..." (yellow, pulsing)
   - 🟢 "Tool 1/15: Style Guide Parsed" (green, 1 second)
   - 🟡 "Tool 2/15: Generating Hero Widget..." (yellow, pulsing)
   - 🟢 "Tool 2/15: Hero Widget Generated" (green, 1 second)
   - ... continues for all 15 tools
5. Chat history collapses, user sees only notifications
6. User can still type messages (overrides auto-run)
7. Final notification: 🟢 "All 15 widgets generated successfully!"

**Mobile Experience:**

1. User initiates same workflow on mobile
2. Keyboard opens for initial input
3. Auto-run starts
4. Notification bar stays at top of viewport (above keyboard)
5. Prompt input always visible at bottom
6. Chat history automatically hidden during auto-run
7. User can see progress without scrolling
8. Tap notification to expand details (optional)
9. Swipe down to dismiss and view chat history

#### Integration with Gentec Workflow

**Scenario: Generate 15 Widgets**

```
Tool 1/15: 🟡 Parsing Style Guide
→ "Extracting colors, typography, and spacing. Found 12 colors..."

Tool 2/15: 🟡 Creating Project Structure  
→ "Setting up widget folders and base files. Creating 15 directories..."

Tool 3/15: 🟡 Generating Hero Widget HTML
→ "Building responsive hero section with CTA. Adding 5 Elementor controls..."

Tool 4/15: 🟢 Hero Widget HTML Complete
→ "Generated 247 lines. All elements have edit controls."

Tool 5/15: 🟡 Generating Hero Widget CSS
→ "Applying style guide colors and typography. Creating responsive styles..."

... continues through all widgets ...

Tool 15/15: 🟢 Exporting Widget Package
→ "Created installable .zip with all 15 widgets. Ready for WordPress."

✅ Complete: All 15 widgets generated and tested!
```

#### Benefits

**For Users:**
- ✅ No need to watch chat scroll
- ✅ Know exactly what's happening now
- ✅ Mobile-friendly always-visible progress
- ✅ Quick glance shows status
- ✅ Can walk away and check back

**For Mobile:**
- ✅ Notification never hidden by keyboard
- ✅ No scrolling to see progress
- ✅ Prompt input always accessible
- ✅ Less screen real estate wasted

**For Long Workflows:**
- ✅ Track progress across 10-20 tools
- ✅ Estimated time remaining
- ✅ Pause/resume capability
- ✅ Error handling with context

---

### Gentec Project Generator - Deep Dive

This system represents a comprehensive workflow automation tool designed to generate complete WordPress sites with multiple widgets and sections in a single automated run.

#### Use Cases

1. **Full Site Generation**
   - Generate complete WordPress sites from style guides
   - Create 10-20 widgets/sections in one workflow
   - Bulk widget creation with consistent styling
   - All sections stored in organized widget folders

2. **Project Management**
   - Planner agent breaks down complex projects into steps
   - Document tracker maintains progress logs
   - Version control for all project iterations
   - Export complete project packages

3. **Widget Element Auditing**
   - Scan all widgets to identify editable elements
   - Ensure every text/image/link has Elementor controls
   - Generate missing controls automatically
   - Validate widget completeness before deployment

4. **Real-Time Testing**
   - Import generated widgets into WordPress Playground
   - Test functionality without affecting production
   - Iterate on designs with instant feedback
   - Export tested widgets as production-ready packages

#### Architecture

```
Gentec Project Generator
├── Planner Agent
│   ├── Project analysis and decomposition
│   ├── Tool sequencing (10-20 tools)
│   ├── Dependency management
│   └── Progress tracking
├── Document Tracker
│   ├── Markdown documentation generation
│   ├── Progress logs and milestones
│   ├── Widget inventory
│   └── Element audit reports
├── Bulk Widget Generator
│   ├── Style guide parser
│   ├── Section template engine
│   ├── Control generator
│   └── File structure builder (HTML/CSS/JS/PHP)
├── Element Auditor
│   ├── HTML parser (identify all dynamic elements)
│   ├── Control validator (ensure all elements editable)
│   ├── Missing control detector
│   └── Auto-fix generator
├── WordPress Integration
│   ├── Playground import/export
│   ├── Real-time testing environment
│   ├── Widget activation system
│   └── Production export (.zip)
└── Version Control
    ├── Project snapshots
    ├── Widget history
    └── Rollback capability
```

#### Technical Implementation

**Multi-Agent Workflow:**
- Sequential tool execution with state management
- Error recovery and retry logic
- Progress checkpoints for long-running tasks
- Parallel execution where possible (widget generation)

**Element Auditing Algorithm:**
1. Parse all HTML in widget
2. Identify dynamic elements (text, images, links, buttons)
3. Cross-reference with existing Elementor controls
4. Generate missing controls with appropriate types
5. Validate control functionality
6. Report audit results to Document Tracker

**Document Tracking:**
- Auto-generated project documentation
- Widget inventory with screenshots
- Element audit reports (completeness %)
- Control mapping documentation
- Deployment checklists

#### Integration Points

- **Elementor Editor**: Direct import of generated widgets
- **Style Guide System**: Source for design tokens
- **WordPress Playground**: Real-time testing environment
- **Project Library**: Storage for reusable sections
- **Document System**: Progress tracking and reports

#### Workflow Example

1. User provides style guide and project requirements
2. Planner Agent decomposes into 15 widget creation tasks
3. Bulk Generator creates all widgets from style guide
4. Element Auditor validates all widgets (100% editable check)
5. Missing controls auto-generated
6. Document Tracker logs all progress
7. Widgets imported to WordPress Playground for testing
8. User reviews in real-time
9. Approved widgets exported as production package
10. Complete documentation generated

---

### Browserbase & CodeSandbox Integration - Deep Dive

This integration combines two powerful cloud platforms to enable comprehensive development, testing, and deployment workflows for WordPress widgets and full sites.

---

### CodeSandbox Integration

CodeSandbox provides instant cloud development environments that enable live coding, testing, and collaboration - perfect for the Gentec project workflow.

**Reference:** [CodeSandbox](https://codesandbox.io/)

#### Why CodeSandbox for Gentec Projects

CodeSandbox is **ideal** for what you need because it provides:

1. **Live Development Environments**: Spin up full WordPress/React/HTML environments instantly
2. **Real-time Sharing**: Share live preview links with clients for instant feedback
3. **No Setup Required**: Zero configuration - just generate and run
4. **GitHub Integration**: Push widgets directly to repositories
5. **Collaborative Editing**: Multiple people can edit simultaneously
6. **Instant Deployment**: Deploy sandboxes as live sites

#### Use Cases for Gentec Workflow

1. **Widget Development & Testing**
   - Generate widget code in Hustle Tools
   - Automatically create CodeSandbox with widget + WordPress setup
   - Test widget in live environment immediately
   - Share sandbox link with client for approval
   - Export approved widget to production

2. **Full Site Generation**
   - Gentec Project Generator creates 15-20 widgets
   - Each widget deployed to CodeSandbox for testing
   - Client reviews live site with all widgets active
   - Make real-time adjustments based on feedback
   - Export final package when approved

3. **Client Collaboration**
   - Share editable sandbox with clients
   - Clients can test functionality themselves
   - Real-time feedback and iteration
   - Track changes and version history
   - Export when ready for deployment

4. **NPM Package Testing**
   - Test widget packages before publishing
   - Validate dependencies work correctly
   - Ensure cross-browser compatibility
   - Generate usage documentation with live examples

#### CodeSandbox Architecture

```
CodeSandbox Integration
├── Sandbox Creation API
│   ├── Template-based creation (WordPress, React, HTML)
│   ├── File system management
│   ├── NPM dependency installation
│   └── Environment configuration
├── Live Preview
│   ├── Instant URL generation
│   ├── Real-time hot reload
│   ├── Multiple viewport testing
│   └── Embed preview in Hustle Tools
├── Collaboration
│   ├── Shareable links (view/edit modes)
│   ├── Real-time multiplayer editing
│   ├── Comment and annotation system
│   └── Version history and snapshots
├── Deployment
│   ├── GitHub sync and export
│   ├── Vercel/Netlify deployment
│   ├── Download as .zip
│   └── Production build optimization
└── Hustle Tools Integration
    ├── Auto-generate sandboxes from widgets
    ├── Embed live preview in UI
    ├── Client approval workflow
    └── Export to production
```

#### Technical Implementation

**Create Sandbox from Generated Widget:**
```typescript
import { createSandbox } from '@codesandbox/sdk';

// After Gentec generates widget
async function deployWidgetToSandbox(widget: GeneratedWidget) {
  const sandbox = await createSandbox({
    template: 'wordpress',
    files: {
      // Widget PHP file
      'wp-content/plugins/gentec-widgets/hero-widget.php': {
        content: widget.phpCode,
      },
      // Widget CSS
      'wp-content/plugins/gentec-widgets/css/hero.css': {
        content: widget.cssCode,
      },
      // Widget JS
      'wp-content/plugins/gentec-widgets/js/hero.js': {
        content: widget.jsCode,
      },
      // Test page
      'test-page.html': {
        content: generateTestPage(widget),
      },
    },
  });

  // Return shareable URL
  return {
    editUrl: sandbox.editorUrl,
    previewUrl: sandbox.previewUrl,
    embedUrl: sandbox.embedUrl,
  };
}
```

**Embed Live Preview in Hustle Tools:**
```typescript
// Widget preview component
function WidgetPreview({ sandboxUrl }: { sandboxUrl: string }) {
  return (
    <div className="widget-preview">
      <iframe
        src={sandboxUrl}
        style={{ width: '100%', height: '600px', border: 0 }}
        sandbox="allow-scripts allow-same-origin"
      />
      <div className="preview-actions">
        <Button onClick={() => window.open(sandboxUrl, '_blank')}>
          Open in CodeSandbox
        </Button>
        <Button onClick={() => exportWidget()}>
          Export Widget
        </Button>
      </div>
    </div>
  );
}
```

**Bulk Widget Deployment:**
```typescript
// Deploy all Gentec widgets at once
async function deployGentecProject(widgets: GeneratedWidget[]) {
  const sandboxes = await Promise.all(
    widgets.map(widget => deployWidgetToSandbox(widget))
  );

  // Create master sandbox with all widgets
  const projectSandbox = await createSandbox({
    template: 'wordpress',
    files: {
      ...combineAllWidgetFiles(widgets),
      'index.html': generateProjectHomepage(widgets),
    },
  });

  return {
    individualWidgets: sandboxes,
    fullProject: projectSandbox,
  };
}
```

#### Integration with Gentec Workflow

**Complete Workflow:**
1. User provides style guide and requirements
2. Planner Agent breaks down into 15 widget tasks
3. Bulk Generator creates all widgets
4. **CodeSandbox auto-creates sandbox for each widget**
5. **Client receives live preview links for all widgets**
6. Element Auditor validates in live environment
7. **Client tests and provides feedback in real-time**
8. Document Tracker logs all changes
9. **Export approved widgets from CodeSandbox**
10. Production deployment

#### Benefits for Gentec Projects

| Need | CodeSandbox Solution |
|------|---------------------|
| Instant testing | Live environment in seconds |
| Client approval | Share preview links instantly |
| No local setup | Everything runs in cloud |
| Collaboration | Real-time editing with team |
| Version control | GitHub integration built-in |
| Quick iterations | Hot reload for instant feedback |
| Documentation | Live examples for every widget |
| Production-ready | One-click deployment |

---

### Browserbase Integration - Deep Dive

Browserbase provides enterprise-grade browser infrastructure that enables Hustle Tools to run reliable browser automation at scale without managing infrastructure. This integration brings powerful capabilities for testing, automation, and AI agents.

**Reference:** [Browserbase Documentation](https://www.browserbase.com/)

#### Use Cases

1. **WordPress Testing at Scale**
   - Test generated widgets in real Chrome browsers
   - Run parallel tests across multiple browser instances
   - Capture screenshots and recordings of widget behavior
   - Validate responsive designs across viewports

2. **AI Agent Browser Tools**
   - Give AI agents full browser access using [Stagehand SDK](https://www.browserbase.com/)
   - Natural language browser control ("navigate to example.com")
   - Extract data from websites dynamically
   - Form filling and submission automation

3. **Code Execution & Validation**
   - Execute JavaScript/CSS in real browser environments
   - Validate widget functionality before export
   - Test Elementor controls in live contexts
   - Debug rendering issues with session recordings

4. **Web Scraping & Research**
   - Stealth scraping with captcha solving
   - Residential proxy network for geo-restricted content
   - Extract design patterns from competitor sites
   - Import styles and components from live websites

#### Architecture Integration

```
Browserbase Integration
├── Browser Management API
│   ├── Session creation (1000s of concurrent browsers)
│   ├── Context persistence (cookies, localStorage)
│   ├── Session recording and replay
│   └── Live View embedding
├── Automation Frameworks
│   ├── Playwright adapter
│   ├── Puppeteer adapter
│   ├── Selenium WebDriver
│   └── Stagehand (AI-native framework)
├── Stealth & Security
│   ├── Captcha solver integration
│   ├── Residential proxy network
│   ├── Browser fingerprint randomization
│   └── SOC-2 & HIPAA compliance
└── Hustle Tools Integration
    ├── WordPress Playground testing
    ├── Widget validation pipeline
    ├── Screenshot/PDF generation
    └── AI agent tool execution
```

#### Technical Implementation

**Browser Session Management:**
```typescript
// Example integration with Browserbase
import { Browserbase } from '@browserbase/sdk';

const bb = new Browserbase({
  apiKey: process.env.BROWSERBASE_API_KEY
});

// Create session for WordPress testing
const session = await bb.sessions.create({
  projectId: 'gentec-widgets',
  browserSettings: {
    viewport: { width: 1920, height: 1080 },
    fingerprint: 'random',
  }
});

// Test widget in real browser
const result = await session.run(async (page) => {
  await page.goto('http://localhost:8000/wp-admin');
  await page.click('#elementor-preview-loading');
  // Validate widget rendering
  const screenshot = await page.screenshot();
  return { success: true, screenshot };
});
```

**AI Agent Browser Tool:**
```typescript
// Browserbase as AI agent tool
const browserTool = tool({
  description: 'Execute browser automation',
  parameters: z.object({
    action: z.enum(['navigate', 'click', 'extract', 'screenshot']),
    target: z.string(),
  }),
  execute: async ({ action, target }) => {
    const session = await bb.sessions.create();
    return await session.run(async (page) => {
      switch (action) {
        case 'navigate':
          await page.goto(target);
          return { url: page.url() };
        case 'screenshot':
          return await page.screenshot({ encoding: 'base64' });
        case 'extract':
          return await page.textContent(target);
      }
    });
  }
});
```

**Live View Embedding:**
- Embed real-time browser view in Hustle Tools UI
- Allow users to interact with browser directly
- Human-in-the-loop for agent oversight
- Debug sessions with visual feedback

#### Integration Points

- **Gentec Project Generator**: Automated widget testing in browsers
- **WordPress Playground**: Enhanced testing with real Chrome
- **AI Chat**: Browser automation as AI tool
- **Elementor Editor**: Live preview and validation
- **Style Guide Importer**: Extract styles from live websites

#### Benefits Over WordPress Playground

| Feature | WordPress Playground | Browserbase |
|---------|---------------------|-------------|
| Browser Type | WebAssembly emulation | Real Chrome/Firefox |
| Scale | Single instance | 1000s concurrent |
| Speed | Slower (WASM overhead) | Native performance |
| Plugins | Limited | Full WordPress install |
| Debugging | Basic | Session replay, Live View |
| AI Integration | None | Native Stagehand SDK |
| Stealth | N/A | Captcha solving, proxies |

#### Cost Considerations

- **Free Tier**: 100 hours/month (development testing)
- **Pro**: $99/month for 500 hours (production)
- **Enterprise**: Custom pricing for unlimited scale
- **Cost Optimization**: Use for critical testing only, WordPress Playground for quick iterations

#### Workflow Example

1. User generates 10 widgets via Gentec Project Generator
2. Each widget automatically deployed to test WordPress site
3. Browserbase spawns 10 parallel browser sessions
4. Validates each widget renders correctly
5. Captures screenshots and session recordings
6. Element Auditor validates all controls work
7. AI reviews screenshots for visual issues
8. Failed widgets flagged for manual review
9. Passed widgets exported to production
10. Session recordings saved for documentation

---

### When to Use: CodeSandbox vs Browserbase vs WordPress Playground

| Feature | CodeSandbox | Browserbase | WordPress Playground |
|---------|-------------|-------------|---------------------|
| **Primary Use** | Development & Sharing | Browser Automation | Quick Testing |
| **Setup Time** | Instant | Seconds | Instant |
| **Environment** | Full dev environment | Real browser instances | WASM WordPress |
| **Sharing** | ✅ Live shareable links | ❌ Session-based | ❌ Local only |
| **Collaboration** | ✅ Real-time editing | ❌ Async only | ❌ None |
| **Client Preview** | ✅ Perfect for clients | ⚠️ Technical only | ❌ Developer-focused |
| **Code Editing** | ✅ Full IDE | ❌ Not designed for | ⚠️ Basic |
| **AI Agents** | ⚠️ Basic API | ✅ Stagehand SDK | ❌ None |
| **Scale** | 1000s concurrent | 1000s concurrent | Single instance |
| **Cost** | Free tier generous | $99/mo for 500hrs | Free |
| **GitHub Sync** | ✅ Native | ❌ Manual | ❌ None |
| **Deployment** | ✅ One-click | ❌ Not applicable | ❌ Export only |
| **Best For** | Client demos, sharing | Automated testing | Developer iteration |

### Recommended Workflow Combination

**Phase 1: Development (CodeSandbox)**
- Generate widgets in Hustle Tools
- Deploy to CodeSandbox for each widget
- Share preview links with client
- Iterate based on feedback
- Real-time collaboration with team

**Phase 2: Validation (Browserbase)**
- Run automated tests across widgets
- Validate all controls work correctly
- Screenshot generation for docs
- Cross-browser testing
- AI agents validate functionality

**Phase 3: Quick Iteration (WordPress Playground)**
- Developer makes quick fixes
- Test in local WordPress environment
- Rapid iteration without cloud costs
- Final validation before export

**Phase 4: Production Export**
- Export approved widgets from CodeSandbox
- Package as installable WordPress plugin
- Deploy to client's production site
- Document in Client Library System

---

## Contributing

To propose a new feature for the roadmap:

1. Open an issue on GitHub with the `feature-request` label
2. Include:
   - Feature description
   - Use cases
   - Priority justification
   - Technical considerations
3. Team will review and add to roadmap if approved

---

## Changelog

- **2025-11-03**: Added Auto-Run Mode with Live Notifications system
- **2025-11-03**: Added CodeSandbox integration to Browserbase feature
- **2025-11-03**: Added comprehensive comparison guide (CodeSandbox vs Browserbase vs WordPress Playground)
- **2025-11-03**: Added Gentec Project Generator & Multi-Agent System
- **2025-11-03**: Added Client Library Documentation System
- **2025-11-03**: Initial roadmap documentation created

