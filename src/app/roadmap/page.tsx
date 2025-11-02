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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold">Product Roadmap</h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-3xl">
            Our vision for Hustle Tools - see what we've built, what we're working on, and what's coming next.
          </p>

          {/* Stats */}
          <div className="flex justify-center mt-6">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 min-w-[200px]">
              <div className="text-2xl font-bold text-blue-500">{stats.inProgress}</div>
              <div className="text-sm text-muted-foreground">Features In Progress</div>
            </div>
          </div>
        </div>
      </div>

      {/* Roadmap Items */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="space-y-4">
          {roadmapItems.map((item) => {
            const isExpanded = expandedItems.has(item.id);
            return (
              <div
                key={item.id}
                className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
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
