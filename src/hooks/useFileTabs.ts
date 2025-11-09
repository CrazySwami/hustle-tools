import { useState, useMemo, useCallback } from 'react';
import type { FileGroup } from '@/types';

/**
 * useFileTabs - Unified tab management for project files
 *
 * Replaces the complex 3-layer state management in HtmlSectionEditor.
 * Single source of truth for tab state, eliminates parent/child conflicts.
 *
 * Key features:
 * - Automatically generates tab list based on project type
 * - Widget files become first-class tabs (not special cases)
 * - Consistent tab IDs: 'html', 'css', 'js', 'php', 'widget-abc123', etc.
 * - Handles content updates via callback
 */

export type FileType = 'html' | 'css' | 'js' | 'php' | 'hubl' | 'docs';

export interface FileTab {
  id: string; // 'html', 'css', 'widget-abc123', etc.
  type: FileType;
  label: string;
  content: string;
  isWidget?: boolean;
  widgetId?: string;
  language: string;
  fileName?: string; // For display purposes
  displayId?: string;
}

interface UseFileTabsOptions {
  project: FileGroup | null;
  onTabContentChange?: (tabId: string, content: string) => void;
  defaultTab?: string;
}

interface UseFileTabsReturn {
  tabs: FileTab[];
  activeTabId: string;
  activeTab: FileTab | null;
  switchTab: (tabId: string) => void;
  updateTabContent: (tabId: string, content: string) => void;
  getTabContent: (tabId: string) => string | undefined;
}

/**
 * Get Monaco language identifier for file type
 */
function getLanguageForType(type: FileType): string {
  const languageMap: Record<FileType, string> = {
    html: 'html',
    css: 'css',
    js: 'javascript',
    php: 'php',
    hubl: 'html', // HubL uses HTML syntax
    docs: 'markdown'
  };
  return languageMap[type] || 'plaintext';
}

function formatIdLabel(id: string): string {
  return id
    .replace(/\.[^/.]+$/, '')
    .replace(/[-_/]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    || id;
}

/**
 * Determine project type from file group
 */
function getProjectType(project: FileGroup | null): 'elementor-plugin' | 'elementor-section' | 'hubspot' | 'unknown' {
  if (!project) return 'unknown';

  // Treat anything marked as a plugin (or PHP group) as an Elementor plugin
  if (
    project.isPlugin ||
    project.type === 'php' ||
    !!project.pluginMainFile ||
    (project.widgetFiles && Object.keys(project.widgetFiles).length > 0)
  ) {
    return 'elementor-plugin';
  }

  // HubSpot projects are explicitly typed or include HubL output
  if (project.type === 'hubspot' || project.hubl !== undefined) {
    return 'hubspot';
  }

  // Default to HTML/Elementor sections (html/css/js based projects)
  if (project.type === 'html' || project.html !== undefined || project.css !== undefined || project.js !== undefined) {
    return 'elementor-section';
  }

  return 'unknown';
}

/**
 * Generate tab list based on project structure
 */
function generateTabs(project: FileGroup | null): FileTab[] {
  if (!project) return [];

  const tabs: FileTab[] = [];
  const projectType = getProjectType(project);

  // Elementor Section: HTML, CSS, JS, Docs
  if (projectType === 'elementor-section') {
    if (project.html !== undefined) {
      tabs.push({
        id: 'html',
        type: 'html',
        label: 'HTML',
        content: project.html || '',
        language: 'html',
        fileName: 'section.html'
      });
    }

    if (project.css !== undefined) {
      tabs.push({
        id: 'css',
        type: 'css',
        label: 'CSS',
        content: project.css || '',
        language: 'css',
        fileName: 'section.css'
      });
    }

    if (project.js !== undefined) {
      tabs.push({
        id: 'js',
        type: 'js',
        label: 'JavaScript',
        content: project.js || '',
        language: 'javascript',
        fileName: 'section.js'
      });
    }
  }

  // HubSpot: HTML, HubL, Docs
  if (projectType === 'hubspot') {
    if (project.html !== undefined) {
      tabs.push({
        id: 'html',
        type: 'html',
        label: 'HTML',
        content: project.html || '',
        language: 'html',
        fileName: 'module.html'
      });
    }

    if (project.hubl !== undefined) {
      tabs.push({
        id: 'hubl',
        type: 'hubl',
        label: 'HubL',
        content: project.hubl || '',
        language: 'html',
        fileName: 'module.hubl'
      });
    }
  }

  const hasCustomFiles = project.files && Object.keys(project.files).length > 0;

  // Elementor Plugin fallback (legacy storage without custom file map)
  if (!hasCustomFiles && projectType === 'elementor-plugin') {
    const widgetEntries = project.widgetFiles ? Object.entries(project.widgetFiles) : [];

    if (widgetEntries.length > 0) {
      widgetEntries.forEach(([widgetId, widget]: [string, any]) => {
        tabs.push({
          id: `widget:${widgetId}`,
          type: 'php',
          label: widget.name || 'Widget',
          content: widget.content || '',
          language: 'php',
          isWidget: true,
          widgetId: widgetId,
          fileName: `${widget.slug || 'widget'}.php`
        });
      });
    } else if (project.isPlugin && project.generationState === 'generating') {
      const pendingWidgetId = `widget_${project.id}_pending`;
      tabs.push({
        id: `widget:${pendingWidgetId}`,
        type: 'php',
        label: 'Widget (generating...)',
        content: '',
        language: 'php',
        isWidget: true,
        widgetId: pendingWidgetId,
        fileName: 'widget.php'
      });
    }

    if (project.pluginMainFile) {
      tabs.push({
        id: 'plugin-main.php',
        type: 'php',
        label: 'Plugin Main',
        content: project.pluginMainFile || '',
        language: 'php',
        fileName: 'plugin-main.php'
      });
    }
  }

  // Docs tab (available for all project types)
  if (project.projectManifest !== undefined) {
    tabs.push({
      id: 'docs',
      type: 'docs',
      label: 'README',
      content: project.projectManifest || '',
      language: 'markdown',
      fileName: 'README.md'
    });
  }

  // Custom files (multi-section HTML, extra widgets, etc.)
  if (project.files && Object.keys(project.files).length > 0) {
    const entries = Object.values(project.files).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    entries.forEach((file) => {
      const normalizedId = file.id;
      if (tabs.some(tab => tab.id === normalizedId)) {
        return;
      }
      const tabType = (file.type as FileType) || 'docs';
      const isWidgetEntry = !!(file.metadata?.widgetId || normalizedId.startsWith('widget:'));
      tabs.push({
        id: normalizedId,
        type: tabType,
        label: file.label || formatIdLabel(file.id),
        content: file.content || '',
        language: file.language || getLanguageForType(tabType),
        fileName: file.id,
        displayId: file.id,
        isWidget: isWidgetEntry,
        widgetId: isWidgetEntry
          ? (file.metadata?.widgetId || normalizedId.replace(/^widget:/, ''))
          : undefined
      });
    });
  }

  return tabs;
}

/**
 * Main hook for file tab management
 */
export function useFileTabs({
  project,
  onTabContentChange,
  defaultTab = 'html'
}: UseFileTabsOptions): UseFileTabsReturn {
  // Generate tabs from project structure
  const tabs = useMemo(() => generateTabs(project), [project]);

  // Active tab state
  const [activeTabId, setActiveTabId] = useState<string>(() => {
    // Initialize with defaultTab if it exists, otherwise first available tab
    if (tabs.some(tab => tab.id === defaultTab)) {
      return defaultTab;
    }
    return tabs[0]?.id || 'html';
  });

  // Update active tab when tabs change (e.g., project switched)
  // But only if current tab no longer exists
  useMemo(() => {
    if (!tabs.some(tab => tab.id === activeTabId)) {
      const newActiveTab = tabs[0]?.id || 'html';
      setActiveTabId(newActiveTab);
    }
  }, [tabs, activeTabId]);

  // Get active tab object
  const activeTab = useMemo(() => {
    return tabs.find(tab => tab.id === activeTabId) || null;
  }, [tabs, activeTabId]);

  // Switch to a different tab
  const switchTab = useCallback((tabId: string) => {
    console.log('🔄 useFileTabs: Switching to tab:', tabId);

    // Validate tab exists
    const targetTab = tabs.find(tab => tab.id === tabId);
    if (!targetTab) {
      console.warn('⚠️ useFileTabs: Tab not found:', tabId);
      return;
    }

    setActiveTabId(tabId);
  }, [tabs]);

  // Update tab content
  const updateTabContent = useCallback((tabId: string, content: string) => {
    console.log('💾 useFileTabs: Updating content for tab:', tabId, `(${content.length} chars)`);

    // Notify parent component
    if (onTabContentChange) {
      onTabContentChange(tabId, content);
    }
  }, [onTabContentChange]);

  // Get content for a specific tab
  const getTabContent = useCallback((tabId: string): string | undefined => {
    const tab = tabs.find(t => t.id === tabId);
    return tab?.content;
  }, [tabs]);

  return {
    tabs,
    activeTabId,
    activeTab,
    switchTab,
    updateTabContent,
    getTabContent
  };
}

/**
 * Helper: Convert tab ID to file type (for backwards compatibility)
 */
export function tabIdToFileType(tabId: string): FileType {
  if (tabId.startsWith('widget-')) return 'php';
  return tabId as FileType;
}

/**
 * Helper: Extract widget ID from tab ID
 */
export function extractWidgetId(tabId: string): string | null {
  if (tabId.startsWith('widget-')) {
    return tabId.replace('widget-', '');
  }
  return null;
}
