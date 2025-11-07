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
  getTabContent: (tabId: string) => string;
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

/**
 * Determine project type from file group
 */
function getProjectType(project: FileGroup | null): 'elementor-plugin' | 'elementor-section' | 'hubspot' | 'unknown' {
  if (!project) return 'unknown';

  // Plugin: has pluginMainFile or multiple widget files
  if (project.pluginMainFile || (project.widgetFiles && Object.keys(project.widgetFiles).length > 0)) {
    return 'elementor-plugin';
  }

  // HubSpot: has hubl file
  if (project.hubl) {
    return 'hubspot';
  }

  // Elementor section: has HTML/CSS/JS
  if (project.html || project.css || project.js) {
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

  // Elementor Plugin: Plugin Main File, Widget Files, Docs
  if (projectType === 'elementor-plugin') {
    // Plugin main file
    if (project.pluginMainFile) {
      tabs.push({
        id: 'plugin-main-php',
        type: 'php',
        label: 'Plugin Main',
        content: project.pluginMainFile || '',
        language: 'php',
        fileName: 'plugin-main.php'
      });
    }

    // Widget files (as separate tabs)
    if (project.widgetFiles && Object.keys(project.widgetFiles).length > 0) {
      Object.entries(project.widgetFiles).forEach(([widgetId, widget]: [string, any]) => {
        tabs.push({
          id: `widget-${widgetId}`,
          type: 'php',
          label: widget.name || 'Widget',
          content: widget.content || '',
          language: 'php',
          isWidget: true,
          widgetId: widgetId,
          fileName: `${widget.slug || 'widget'}.php`
        });
      });
    }
  }

  // HubSpot: HubL, CSS, JS, Docs
  if (projectType === 'hubspot') {
    if (project.hubl !== undefined) {
      tabs.push({
        id: 'hubl',
        type: 'hubl',
        label: 'HubL',
        content: project.hubl || '',
        language: 'html',
        fileName: 'module.html'
      });
    }

    if (project.css !== undefined) {
      tabs.push({
        id: 'css',
        type: 'css',
        label: 'CSS',
        content: project.css || '',
        language: 'css',
        fileName: 'module.css'
      });
    }

    if (project.js !== undefined) {
      tabs.push({
        id: 'js',
        type: 'js',
        label: 'JavaScript',
        content: project.js || '',
        language: 'javascript',
        fileName: 'module.js'
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
  const getTabContent = useCallback((tabId: string): string => {
    const tab = tabs.find(t => t.id === tabId);
    return tab?.content || '';
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
