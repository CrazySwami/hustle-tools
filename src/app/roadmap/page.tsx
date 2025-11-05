'use client';

import { useState } from 'react';
import { CheckCircle2, Circle, Clock, Sparkles, FileText, Code, Zap, Users, Database, Globe, ChevronDown, ChevronUp } from 'lucide-react';

interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'planned';
  category: 'docs' | 'elementor' | 'ai' | 'infrastructure' | 'general';
  priority: 'high' | 'medium' | 'low';
  details?: string[];
  eta?: string;
}

const roadmapItems: RoadmapItem[] = [
  // In Progress
  {
    id: 'google-docs-integration',
    title: 'Google Docs API Integration',
    description: 'Real-time collaboration with Google Docs for document editing',
    status: 'in-progress',
    category: 'docs',
    priority: 'high',
    eta: 'Q1 2025',
    details: [
      'Real-time commenting and suggestions',
      'Create, update, edit, and delete documents',
      'Share documents with permissions (view, comment, edit)',
      'Import/export between Google Docs and Hustle Tools',
      'Collaborative editing with multiple users',
      'Version history and revision tracking',
      'Integrate with existing AI Doc Editor',
    ],
  },
  {
    id: 'hubl-generator',
    title: 'HubL Code Page/Email Generator',
    description: 'AI-powered generator for HubSpot HubL code for pages and emails',
    status: 'planned',
    category: 'general',
    priority: 'medium',
    eta: 'Q2 2025',
    details: [
      'Generate HubL templates for pages and emails',
      'Blog post and landing page templates',
      'HubDB integration and contact properties',
      'Email-specific features (responsive tables, CAN-SPAM compliance)',
      'Chat-based editing with AI assistance',
      'Live HubL preview with sample data',
      'Mobile/desktop and email client preview',
      'Export as .html files or direct upload to HubSpot',
      'Pre-built templates for newsletters, transactional emails, and landing pages',
    ],
  },
  {
    id: 'hubspot-form-styler',
    title: 'HubSpot Form Styler',
    description: 'Style raw HTML HubSpot forms with CSS and render them with live preview',
    status: 'planned',
    category: 'general',
    priority: 'medium',
    eta: 'Q2 2025',
    details: [
      'Import raw HubSpot form HTML',
      'Visual CSS editor with live preview',
      'Generate CSS with proper HubSpot form selectors',
      'Comprehensive guide on HubSpot form selector patterns',
      'Pre-built form style templates',
      'Responsive design tools (mobile/tablet/desktop preview)',
      'Custom styling for inputs, labels, buttons, error messages',
      'Support for multi-step forms and conditional fields',
      'Export styled CSS ready for HubSpot deployment',
      'AI-assisted form styling suggestions',
    ],
  },
  {
    id: 'plugin-builder',
    title: 'WordPress Plugin Builder',
    description: 'Create complete WordPress plugins with file management and testing',
    status: 'in-progress',
    category: 'elementor',
    priority: 'high',
    eta: 'Q1 2025',
    details: [
      'Multi-file project structure (PHP, CSS, JS, assets)',
      'Plugin metadata and headers',
      'Custom post types, taxonomies, and settings pages',
      'Admin UI and shortcodes',
      'Test plugins in WordPress Playground',
      'Export as installable .zip files',
      'AI-assisted plugin generation',
    ],
  },
  {
    id: 'gentec-project-generator',
    title: 'Gentec Project Generator & Multi-Agent System',
    description: 'Complete project generation system with planner agent, document tracking, and bulk widget creation',
    status: 'in-progress',
    category: 'ai',
    priority: 'high',
    eta: 'Q1 2025',
    details: [
      'Multi-agent system that can run 10-20 tools in sequence',
      'Project templates and defaults for rapid setup',
      'Bulk widget/section creation from style guides',
      'Full WordPress site generation with multiple sections',
      'Real-time import and testing in WordPress Playground',
      'Planner agent for task decomposition and scheduling',
      'Document tracker for project progress and deliverables',
      'Widget element auditing tool (ensures all elements are editable)',
      'Automated control generation for dynamic content',
      'Style guide to full site workflow',
      'Export complete widget folders with all sections',
      'Integration with existing Elementor tools',
      'Version control and project history',
    ],
  },
  {
    id: 'auto-run-notifications',
    title: 'Auto-Run Mode with Live Notifications',
    description: 'Automatic tool execution with real-time visual feedback and mobile-optimized notification system',
    status: 'in-progress',
    category: 'ai',
    priority: 'high',
    eta: 'Q1 2025',
    details: [
      'Auto-run mode: Execute 10-20 tools automatically in sequence',
      'Live notification system in prompt window area',
      'Color-coded status indicators (green=completed, yellow=in-progress, orange=attention)',
      'Tool progress overlay replacing project context temporarily',
      'Short summaries (2-3 sentences) for each tool execution',
      'Mobile-optimized: Always-visible prompt window',
      'Minimize chat content, maximize notification visibility',
      'Real-time streaming status updates',
      'Tool completion animations and transitions',
      'Agent workflow progress tracking',
      'Non-intrusive notification system',
      'Auto-scroll prevention for mobile',
      'Context badge state changes (orange for updates)',
      'Interrupt/pause controls for auto-run',
    ],
  },
  {
    id: 'agentic-planning',
    title: 'Agentic Planning & Multi-Step Workflows',
    description: 'Advanced AI agents with planning, reasoning, and multi-step execution',
    status: 'in-progress',
    category: 'ai',
    priority: 'high',
    eta: 'Q2 2025',
    details: [
      'Chain-of-thought reasoning for complex tasks',
      'Task decomposition and step-by-step execution',
      'Dynamic tool selection and orchestration',
      'Progress tracking and intermediate results',
      'Self-correction and error recovery',
      'Multi-agent collaboration (specialized agents)',
      'Visual workflow builder for custom automations',
    ],
  },
  {
    id: 'style-guide-importer',
    title: 'Style Guide Importer Enhancement',
    description: 'Fix and improve style guide importer for WordPress and HTML environments',
    status: 'in-progress',
    category: 'elementor',
    priority: 'high',
    eta: 'Q1 2025',
    details: [
      'Import CSS from WordPress theme files',
      'Extract styles from HTML/CSS environments',
      'Parse and convert CSS variables to Elementor format',
      'Auto-detect typography settings (fonts, sizes, weights)',
      'Auto-detect color palettes from CSS',
      'Support for custom CSS frameworks (Tailwind, Bootstrap, etc.)',
      'Preview imported styles before applying',
    ],
  },
  {
    id: 'client-library-docs',
    title: 'Client Library Documentation System',
    description: 'Comprehensive documentation storage and retrieval system for client projects, widgets, and Elementor pages',
    status: 'planned',
    category: 'docs',
    priority: 'high',
    eta: 'Q2 2025',
    details: [
      'Store documentation for individual widgets, components, and pages',
      'Per-client library storage with version control',
      'Elementor page/section documentation with usage examples',
      'Widget documentation with props, controls, and styling guides',
      'Search and filter documentation by client, project, or component type',
      'AI-powered documentation generation from code',
      'Automatic documentation updates when code changes',
      'Export documentation as Markdown, PDF, or HTML',
      'Link documentation to specific WordPress/Elementor installations',
      'Code snippet library with syntax highlighting',
      'Integration with Elementor editor for inline docs',
      'Component dependency tracking and relationship mapping',
      'Template and pattern library with live previews',
    ],
  },
  {
    id: 'browserbase-codesandbox-integration',
    title: 'Browserbase & CodeSandbox Integration',
    description: 'Cloud browser infrastructure and live development environments for testing, code execution, and collaboration',
    status: 'planned',
    category: 'infrastructure',
    priority: 'high',
    eta: 'Q2 2025',
    details: [
      'Browserbase: Scalable headless browser infrastructure (1000s of browsers)',
      'Browserbase: AI agent browser tools with Stagehand SDK',
      'Browserbase: Live View embedding and session recording',
      'Browserbase: Stealth features (captcha solving, proxies, fingerprinting)',
      'CodeSandbox: Live development environments for widget testing',
      'CodeSandbox: Instant WordPress/React sandbox creation',
      'CodeSandbox: Share live preview links with clients',
      'CodeSandbox: Real-time collaborative editing',
      'CodeSandbox: NPM package testing and validation',
      'CodeSandbox: GitHub integration for widget libraries',
      'WordPress site testing in real browsers',
      'Code execution in isolated environments',
      'File upload/download support',
      'Integration with Gentec Project Generator',
      'Embed live sandboxes in Hustle Tools UI',
    ],
  },
];

export default function RoadmapPage() {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const getStatusIcon = (status: RoadmapItem['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-5 w-5 text-blue-500 animate-pulse" />;
      case 'planned':
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getCategoryIcon = (category: RoadmapItem['category']) => {
    switch (category) {
      case 'docs':
        return <FileText className="h-4 w-4" />;
      case 'elementor':
        return <Code className="h-4 w-4" />;
      case 'ai':
        return <Sparkles className="h-4 w-4" />;
      case 'infrastructure':
        return <Database className="h-4 w-4" />;
      case 'general':
        return <Globe className="h-4 w-4" />;
    }
  };

  const stats = {
    inProgress: roadmapItems.filter(i => i.status === 'in-progress').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 transition-colors duration-300">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-4">
        <div className="flex items-center gap-3 justify-center">
          <Zap className="w-8 h-8 text-orange-500" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Product Roadmap</h1>
        </div>
        <p className="mt-4 text-center text-gray-600">
          Our vision for Hustle Tools - see what we've built, what we're working on, and what's coming next.
        </p>

        {/* Stats */}
        <div className="flex justify-center mt-6">
          <div className="bg-white border-2 border-gray-200 rounded-lg p-4 min-w-[200px]">
            <div className="text-2xl font-bold text-orange-500">{stats.inProgress}</div>
            <div className="text-sm text-gray-600">Features In Progress</div>
          </div>
        </div>
      </div>

      {/* Roadmap Items */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        <div className="space-y-4">
          {roadmapItems.map((item) => {
            const isExpanded = expandedItems.has(item.id);
            return (
              <div
                key={item.id}
                className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div
                  className="p-6 cursor-pointer"
                  onClick={() => toggleExpanded(item.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(item.status)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <h3 className="text-xl font-semibold mb-1">{item.title}</h3>
                          <p className="text-muted-foreground">{item.description}</p>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        {/* Category Badge */}
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted text-sm">
                          {getCategoryIcon(item.category)}
                          <span className="capitalize">{item.category}</span>
                        </span>

                        {/* Priority Badge */}
                        <span
                          className={`px-2.5 py-1 rounded-md text-sm font-medium ${
                            item.priority === 'high'
                              ? 'bg-red-500/10 text-red-500'
                              : item.priority === 'medium'
                              ? 'bg-yellow-500/10 text-yellow-500'
                              : 'bg-gray-500/10 text-gray-500'
                          }`}
                        >
                          {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)} Priority
                        </span>

                        {/* ETA */}
                        {item.eta && (
                          <span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-500 text-sm">
                            ETA: {item.eta}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && item.details && (
                    <div className="mt-4 pl-9">
                      <h4 className="font-semibold mb-2">Details:</h4>
                      <ul className="space-y-1.5">
                        {item.details.map((detail, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                            <span className="text-primary mt-1">•</span>
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border bg-muted/50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-muted-foreground mb-2">
            Have a feature request or suggestion?
          </p>
          <p className="text-sm text-muted-foreground">
            We'd love to hear from you! Reach out via the chat or submit an issue on GitHub.
          </p>
        </div>
      </div>
    </div>
  );
}
