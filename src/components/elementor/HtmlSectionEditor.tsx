"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Editor, { DiffEditor } from "@monaco-editor/react";
import {
  Section,
  createSection,
  sectionSettingsToCSS,
  getAnimationCSS,
  getAnimationClassName,
  validateSection,
} from "@/lib/section-schema";
import { useGlobalStylesheet } from "@/lib/global-stylesheet-context";
import { useTheme } from "next-themes";
import { useEditorContent } from "@/hooks/useEditorContent";
import { ElementInspector } from "./ElementInspector";
import { HTMLGeneratorDialog } from "@/components/html-generator/HTMLGeneratorDialog";
import { convertToWidgetProgrammatic } from "@/lib/programmatic-widget-converter";
import { extractCodeFromPhp, isPhpWidget } from "@/lib/php-to-html-converter";
import { convertHtmlToHubL } from "@/lib/hubspot-converter";
import { useFileGroups } from "@/hooks/useFileGroups";
import { ProjectSidebar } from "./ProjectSidebar";
import { NewGroupDialog } from "./NewGroupDialog";
import { HtmlSplitter } from "./HtmlSplitter";
import { BatchWidgetConverter } from "./BatchWidgetConverter";
import { WidgetValidationModal } from "./WidgetValidationModal";
import { GenerateProjectModal } from "./GenerateProjectModal";
import { ElementInspectorModal } from "./ElementInspectorModal";
import { HublPreviewPanel } from "./HublPreviewPanel";
import { AddWidgetDialog } from "./AddWidgetDialog";
import { PluginNamingDialog } from "./PluginNamingDialog";
import { PluginDownloadModal } from "./PluginDownloadModal";
import { AiFillHtml5, AiOutlinePlus, AiOutlineDownload } from 'react-icons/ai';
import { DiCss3, DiJavascript1, DiPhp } from 'react-icons/di';
import { SiHubspot } from 'react-icons/si';
import { FileText, RefreshCw } from 'lucide-react';

interface HtmlSectionEditorProps {
  initialSection?: Section;
  onSectionChange?: (section: Section) => void;
  activeStyleKitCss?: string;
  streamedHtml?: string;
  streamedCss?: string;
  streamedJs?: string;
  activeCodeTab?: "html" | "css" | "js" | "php" | "hubl" | "docs";
  onCodeTabChange?: (tab: "html" | "css" | "js" | "php" | "hubl" | "docs") => void;
  onSwitchToVisualEditor?: () => void;
  onSwitchToPlayground?: () => void;
  chatVisible?: boolean;
  setChatVisible?: (visible: boolean) => void;
  tabBarVisible?: boolean;
  setTabBarVisible?: (visible: boolean) => void;
  isTabVisible?: boolean; // For controlling OptionsButton portal rendering
  onEditElementInChat?: (elementData: {
    html: string;
    selector: string;
    classList: string[];
    context: string;
  }) => void;
  onSendChatMessage?: (message: string) => void;
  hotReloadEnabled?: boolean; // Hot reload toggle state from parent
  currentProject?: any; // Current project from file groups
  fileGroups?: ReturnType<typeof useFileGroups>; // Shared file groups state from parent
  onEditorReady?: (editorRefs: {
    html: any | null;
    css: any | null;
    js: any | null;
    php: any | null;
    hubl: any | null;
  }) => void; // Callback to expose Monaco editor refs to parent
  onEditorReadyStateChange?: (readyState: {
    html: boolean;
    css: boolean;
    js: boolean;
    php: boolean;
    hubl: boolean;
    docs: boolean;
  }) => void; // Callback to notify when editor ready state changes
}

export function HtmlSectionEditor({
  initialSection,
  onSectionChange,
  activeStyleKitCss = "",
  streamedHtml,
  streamedCss,
  streamedJs,
  activeCodeTab: externalActiveCodeTab,
  onCodeTabChange,
  onSwitchToVisualEditor,
  onSwitchToPlayground,
  chatVisible,
  setChatVisible,
  tabBarVisible,
  setTabBarVisible,
  isTabVisible = true,
  onEditElementInChat,
  onSendChatMessage,
  hotReloadEnabled = false,
  currentProject,
  fileGroups: parentFileGroups,
  onEditorReady,
  onEditorReadyStateChange,
}: HtmlSectionEditorProps) {
  // File Groups Management - use parent's instance if provided, otherwise create local instance
  const localFileGroups = useFileGroups();
  const fileGroups = parentFileGroups || localFileGroups;
  const [showNewGroupDialog, setShowNewGroupDialog] = useState(false);
  const [showHtmlSplitter, setShowHtmlSplitter] = useState(false);
  const [showBatchConverter, setShowBatchConverter] = useState(false);
  const [showProjectSidebar, setShowProjectSidebar] = useState(() => {
    // Close by default on mobile, open on desktop
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true; // Default to true during SSR
  });

  // Legacy section state (keep for backward compatibility with props)
  const [section, setSection] = useState<Section>(
    initialSection || createSection(),
  );
  const [internalActiveCodeTab, setInternalActiveCodeTab] = useState<
    "html" | "css" | "js" | "php" | "hubl"
  >("html");
  const [activeWidgetId, setActiveWidgetId] = useState<string | null>(null); // Track which widget file is being edited
  const [showPreview, setShowPreview] = useState(false);
  const [showHublPreview, setShowHublPreview] = useState(false); // HubL interactive preview mode
  const [showSettings, setShowSettings] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showFileTree, setShowFileTree] = useState(true); // Show by default on desktop
  const [inspectMode, setInspectMode] = useState(false); // Track inspect mode
  const [inspectSplitView, setInspectSplitView] = useState(false); // Track if inspect mode shows split view (default: full view)
  const [previewSplitWidth, setPreviewSplitWidth] = useState(50); // Code panel percentage for HTML preview
  const [previewDragging, setPreviewDragging] = useState(false);
  const [inspectedElement, setInspectedElement] = useState<{
    html: string;
    selector: string;
    classList: string[];
    tagName: string;
    attributes: Record<string, string>;
    computedStyles: Record<string, string>;
    context: string;
  } | null>(null); // Track inspected element for modal
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateModalConversionMode, setGenerateModalConversionMode] = useState(false); // Track if converting existing code
  const [isGenerating, setIsGenerating] = useState(false); // Track if generation is in progress
  const [generatingPhase, setGeneratingPhase] = useState<'html' | 'css' | 'js' | 'php' | null>(null);
  const [generatingTokens, setGeneratingTokens] = useState(0); // Track current file token count
  const [showGenerationComplete, setShowGenerationComplete] = useState(false); // Show completion notification

  // Editor ready state tracking (for streaming synchronization)
  const [editorsReady, setEditorsReady] = useState({
    html: false,
    css: false,
    js: false,
    php: false,
    hubl: false,
    docs: false
  });

  // DEBUG: Log state changes
  console.log('🔍 HtmlSectionEditor render - isGenerating:', isGenerating, 'phase:', generatingPhase, 'tokens:', generatingTokens);

  // Diff preview state
  const [showDiffPreview, setShowDiffPreview] = useState(false);
  const [diffData, setDiffData] = useState<{
    file: 'html' | 'css' | 'js' | 'php';
    originalCode: string;
    mergedCode: string;
    usage?: any;
    stats?: any;
  } | null>(null);

  // Save indicator state for PHP widget projects
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const lastSavedContentRef = useRef<{ html: string; css: string; js: string; php: string; hubl: string } | null>(null);

  // Plugin dialogs state (NEW)
  const [showAddWidgetDialog, setShowAddWidgetDialog] = useState(false);
  const [showPluginNamingDialog, setShowPluginNamingDialog] = useState(false);
  const [showPluginDownloadModal, setShowPluginDownloadModal] = useState(false);
  const [pendingWidgetCode, setPendingWidgetCode] = useState<string | null>(null); // Store widget code until plugin is named
  const [isRegeneratingDocs, setIsRegeneratingDocs] = useState(false); // Track README.md regeneration

  const menuRef = useRef<HTMLDivElement>(null);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);

  // Store Monaco editor instances for all file types
  const htmlEditorRef = useRef<any>(null);
  const cssEditorRef = useRef<any>(null);
  const jsEditorRef = useRef<any>(null);
  const phpEditorRef = useRef<any>(null);
  const hublEditorRef = useRef<any>(null);
  const docsEditorRef = useRef<any>(null); // For README.md

  const { globalCss, cssVariables } = useGlobalStylesheet();
  const { theme } = useTheme();

  // Notify parent when editor ready state changes
  useEffect(() => {
    if (onEditorReady) {
      onEditorReady({
        html: htmlEditorRef.current,
        css: cssEditorRef.current,
        js: jsEditorRef.current,
        php: phpEditorRef.current,
        hubl: hublEditorRef.current
      });
    }
    if (onEditorReadyStateChange) {
      onEditorReadyStateChange(editorsReady);
    }
  }, [editorsReady, onEditorReady, onEditorReadyStateChange]);

  // Global editor content state (for chat access)
  const { updateContent, setAllContent, html: editorHtml, css: editorCss, js: editorJs, php: editorPhp, hubl: editorHubl } = useEditorContent();

  // Use external activeCodeTab if provided, otherwise use internal
  // IMPORTANT: This must be computed BEFORE any useEffect that uses it
  const activeCodeTab = externalActiveCodeTab ?? internalActiveCodeTab;

  // Force Monaco Editor to update when Zustand state changes
  // This fixes the issue where Monaco doesn't auto-update from value prop changes
  useEffect(() => {
    if (phpEditorRef.current && activeCodeTab === 'php') {
      const currentValue = phpEditorRef.current.getValue();
      // Only update if the values are different to avoid cursor jumps
      if (currentValue !== editorPhp) {
        console.log('🔄 Force updating Monaco editor content:', {
          from: currentValue?.substring(0, 100),
          to: editorPhp?.substring(0, 100),
          activeWidgetId
        });
        phpEditorRef.current.setValue(editorPhp || '');
      }
    }
  }, [editorPhp, activeCodeTab, activeWidgetId]);

  // Deploy widget to WordPress Playground
  const handleDeployWidget = async () => {
    // Check editorPhp instead of section.php (which is legacy)
    if (!editorPhp || !editorPhp.trim()) {
      alert('⚠️ No widget PHP code to deploy. Generate a widget first using "Generate Widget" button.');
      return;
    }

    if (!window.deployAndPreviewWidget) {
      alert('WordPress Playground is not loaded. Please launch Playground first from the WordPress Playground tab.');
      return;
    }

    try {
      // Auto-switch to WordPress Playground tab FIRST
      if (onSwitchToPlayground) {
        onSwitchToPlayground();
      }

      // Small delay to let the tab switch complete
      await new Promise(resolve => setTimeout(resolve, 300));

      // Deploy widget and create preview page - use editorPhp instead of section.php
      const result = await window.deployAndPreviewWidget(editorPhp, editorCss, editorJs);

      console.log('✅ Deploy and preview complete:', result);

      // Show success message
      alert(`✅ ${result.message}\n\nYour widget is now visible in the Elementor editor!`);
    } catch (error: any) {
      alert(`❌ Deployment failed: ${error.message}`);
    }
  };

  // Convert HTML section to Elementor widget
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState('');
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [convertedWidgetName, setConvertedWidgetName] = useState('');

  // Widget validation state
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);

  // HTML Generator Dialog state
  const [showGeneratorDialog, setShowGeneratorDialog] = useState(false);
  const { designSystemSummary } = useGlobalStylesheet();

  const handleConvertToWidget = async () => {
    if (!editorHtml.trim()) {
      alert('⚠️ No HTML content to convert. Please add HTML code first.');
      return;
    }

    if (editorPhp) {
      alert('⚠️ Already in widget mode! Use "Deploy to Playground" to test this widget.');
      return;
    }

    // Calculate estimated token usage
    const totalChars = editorHtml.length + editorCss.length + editorJs.length;
    const estimatedTokens = Math.ceil(totalChars / 4); // Rough estimate: 1 token ≈ 4 chars
    const inputCost = estimatedTokens * 0.000003; // Claude Sonnet 4.5 input cost per token
    const outputCost = 2000 * 0.000015; // Estimated 2000 output tokens
    const totalCost = inputCost + outputCost;

    // Show warning if content is large
    let warningMessage = '';
    if (estimatedTokens > 10000) {
      warningMessage = `\n⚠️ Large conversion (~${estimatedTokens.toLocaleString()} tokens, ~$${totalCost.toFixed(3)})\n`;
    }

    const confirmed = confirm(
      '🔄 Convert HTML to Elementor Widget?\n\n' +
      'This will:\n' +
      '• Analyze your HTML structure\n' +
      '• Generate comprehensive Elementor controls\n' +
      '• Preserve all styling and classes\n' +
      '• Replace current code with PHP widget\n' +
      warningMessage +
      '\nContinue?'
    );

    if (!confirmed) return;

    setIsConverting(true);
    setConversionProgress('Analyzing HTML structure...');

    try {
      const response = await fetch('/api/convert-html-to-widget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: editorHtml,
          css: editorCss,
          js: editorJs,
        }),
      });

      if (!response.ok) {
        throw new Error(`Conversion failed: ${response.statusText}`);
      }

      setConversionProgress('Generating widget class...');

      // Stream the widget PHP code
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let widgetPhp = '';
      let widgetClassName = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          widgetPhp += chunk;

          // Extract widget class name for modal
          if (!widgetClassName) {
            const classMatch = widgetPhp.match(/class\s+(\w+)\s+extends/);
            if (classMatch) {
              widgetClassName = classMatch[1];
              setConvertedWidgetName(widgetClassName);
            }
          }

          // Update progress message based on content
          if (widgetPhp.includes('register_controls()')) {
            setConversionProgress('Creating Elementor controls...');
          } else if (widgetPhp.includes('protected function render()')) {
            setConversionProgress('Generating render function...');
          }

          // Update PHP field in real-time to show progress (NOT HTML!)
          updateSection({ php: widgetPhp });
        }
      }

      // Switch to PHP tab to show the generated widget
      setConversionProgress('Finalizing widget...');
      handleCodeTabChange('php');

      // Show completion modal
      setShowCompletionModal(true);

    } catch (error: any) {
      alert(`❌ Conversion failed: ${error.message}`);
      console.error('Widget conversion error:', error);
    } finally {
      setIsConverting(false);
      setConversionProgress('');
    }
  };

  // AI Widget: Generate using Claude Sonnet 4.5 with auto-deploy
  const handleQuickWidget = async () => {
    if (!editorHtml.trim()) {
      alert('⚠️ No HTML content to convert. Please add HTML code first.');
      return;
    }

    if (editorPhp) {
      alert('⚠️ Already in widget mode! Use "Deploy to Playground" to test this widget.');
      return;
    }

    const confirmed = confirm(
      '🤖 Generate Elementor Widget with AI?\n\n' +
      'This will:\n' +
      '• Use Claude Sonnet 4.5 to generate complete PHP widget\n' +
      '• Scope CSS with {{WRAPPER}} to prevent conflicts\n' +
      '• Create comprehensive Elementor controls for ALL elements\n' +
      '• Auto-deploy to WordPress Playground\n' +
      '• Widget appears immediately in Elementor editor\n' +
      '\n⏱️ Takes 10-30 seconds (AI generation)\n' +
      '💰 Cost: ~$0.05-0.15 per widget\n' +
      '\n✅ This matches your proven working batch script\n' +
      '\nContinue?'
    );

    if (!confirmed) return;

    setIsConverting(true);
    setConversionProgress('🤖 AI generating PHP widget code...');

    try {
      // Scope CSS with {{WRAPPER}} before sending to AI
      // Skip global selectors (body, html, *) and at-rules (@font-face, @keyframes, @media)
      const globalSelectors = ['body', 'html', '*', ':root'];

      const scopedCss = editorCss.replace(
        /(^|\})\s*([^{@]+)\s*\{/gm,
        (match, before, selector) => {
          const trimmedSelector = selector.trim();

          // Skip at-rules (@font-face, @keyframes, @media)
          if (trimmedSelector.startsWith('@') || /^:/.test(trimmedSelector)) {
            return match;
          }

          // Skip global selectors (body, html, *, :root)
          const hasGlobalSelector = selector.split(',').some((s: string) => {
            const sel = s.trim().split(/\s+/)[0]; // Get first part before space
            return globalSelectors.includes(sel) || globalSelectors.some(g => s.trim().startsWith(g + ' '));
          });

          if (hasGlobalSelector) {
            console.warn(`⚠️ Skipping global selector: ${trimmedSelector} (global selectors like body/html shouldn't be in widgets)`);
            return match; // Keep as-is, don't scope
          }

          // Scope all other selectors with {{WRAPPER}}
          const scoped = selector.split(',').map((s: string) => {
            const trimmed = s.trim();
            return trimmed.includes('{{WRAPPER}}') ? trimmed : `{{WRAPPER}} ${trimmed}`;
          }).join(', ');
          return `${before} ${scoped} {`;
        }
      );

      // Generate widget metadata
      const widgetName = fileGroups.activeGroup?.name.toLowerCase().replace(/[^a-z0-9]+/g, '_') || 'custom_section';
      const widgetTitle = fileGroups.activeGroup?.name || 'Custom Section';

      // Call AI widget converter API
      const response = await fetch('/api/convert-html-to-widget-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: editorHtml,
          css: scopedCss,
          js: editorJs,
          widgetName,
          widgetTitle,
          widgetDescription: `Generated widget from ${widgetName}`
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      // Read the streamed PHP response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let widgetPhp = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        widgetPhp += chunk;
        setConversionProgress(`🤖 Generating... ${widgetPhp.length} characters`);
      }

      // Clean up markdown code fences if present (AI sometimes wraps output in ```php ... ```)
      let cleanWidgetPhp = widgetPhp.trim();
      if (cleanWidgetPhp.startsWith('```')) {
        // Remove opening fence (```php or ```)
        cleanWidgetPhp = cleanWidgetPhp.replace(/^```[a-z]*\n?/, '');
        // Remove closing fence (```)
        cleanWidgetPhp = cleanWidgetPhp.replace(/\n?```\s*$/, '');
        cleanWidgetPhp = cleanWidgetPhp.trim();
      }

      // Extract widget class name for project naming
      const classMatch = cleanWidgetPhp.match(/class\s+(\w+)\s+extends/);
      const widgetClassName = classMatch ? classMatch[1] : 'Widget';
      setConvertedWidgetName(widgetClassName);

      // Create NEW PHP widget project (preserve original HTML project)
      const newProjectName = `${fileGroups.activeGroup?.name || 'Section'} (Widget)`;
      const newGroup = fileGroups.createNewGroup(newProjectName, 'php', 'empty');

      // Set the PHP widget code with SCOPED CSS and JS
      fileGroups.updateGroupFile(newGroup.id, 'php', cleanWidgetPhp);
      fileGroups.updateGroupFile(newGroup.id, 'html', editorHtml); // Preserve original HTML for reference
      fileGroups.updateGroupFile(newGroup.id, 'css', scopedCss); // SCOPED CSS with {{WRAPPER}}
      fileGroups.updateGroupFile(newGroup.id, 'js', editorJs || ''); // Widget JS

      // Switch to new PHP widget project
      fileGroups.selectGroup(newGroup.id);

      // Switch to PHP tab to show the generated widget
      handleCodeTabChange('php');

      // Auto-deploy to WordPress Playground
      setConversionProgress('🚀 Deploying to WordPress Playground...');

      // Validate widget PHP before deployment
      if (!cleanWidgetPhp || cleanWidgetPhp.trim() === '') {
        throw new Error('Generated widget PHP is empty. Cannot deploy to WordPress.');
      }

      try {
        // Call the global deployElementorWidget function from playground.js
        if (typeof window !== 'undefined' && (window as any).deployElementorWidget) {
          const deployResult = await (window as any).deployElementorWidget(
            cleanWidgetPhp,
            scopedCss,
            editorJs || '',
            widgetClassName
          );

          if (deployResult.success) {
            // Run AI validation after successful deployment
            setConversionProgress('🔍 Validating widget code with AI...');
            setShowValidationModal(true);
            setIsValidating(true);

            try {
              const validationResponse = await fetch('/api/validate-widget', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  widgetPhp: cleanWidgetPhp,
                  widgetName,
                  widgetTitle
                })
              });

              if (validationResponse.ok) {
                const validationData = await validationResponse.json();
                setValidationResult(validationData);
                console.log('✅ Validation complete:', validationData);
              } else {
                console.error('❌ Validation API error');
                setValidationResult({
                  checks: [],
                  overallScore: 0,
                  summary: 'Validation failed to complete'
                });
              }
            } catch (validationError: any) {
              console.error('❌ Validation error:', validationError);
              setValidationResult({
                checks: [],
                overallScore: 0,
                summary: `Validation error: ${validationError.message}`
              });
            } finally {
              setIsValidating(false);
            }
          } else {
            throw new Error(deployResult.message || 'Deployment failed');
          }
        } else {
          // WordPress Playground not ready - just show completion modal
          setShowCompletionModal(true);
          alert(`✅ Created new widget project: "${newProjectName}"!\n\nOriginal HTML project preserved.\n\n⚠️ CSS has been scoped with {{WRAPPER}} to prevent style conflicts.\n\n⚠️ WordPress Playground not ready. Click "Deploy to Playground" button to deploy manually.`);
        }
      } catch (deployError: any) {
        console.error('Deployment error:', deployError);
        // Show completion modal even if deployment fails
        setShowCompletionModal(true);
        alert(`✅ Widget generated successfully!\n\n` +
          `⚠️ Auto-deployment failed: ${deployError.message}\n\n` +
          `You can deploy manually using the "🚀 Deploy to WordPress" button.`
        );
      }

    } catch (error: any) {
      alert(`❌ Quick Widget generation failed: ${error.message}`);
      console.error('Quick Widget error:', error);
    } finally {
      setIsConverting(false);
      setConversionProgress('');
    }
  };

  // Convert PHP widget back to HTML/CSS/JS
  const handleConvertBackToHtml = () => {
    if (!fileGroups.activeGroup) {
      alert('⚠️ No active project.');
      return;
    }

    if (!fileGroups.activeGroup.php || !fileGroups.activeGroup.php.trim()) {
      alert('⚠️ No PHP widget code to convert. This feature works only after generating a widget.');
      return;
    }

    const confirmed = confirm(
      '🔄 Convert Widget Back to HTML?\n\n' +
      'This will:\n' +
      '• Extract HTML/CSS/JS from the PHP widget\n' +
      '• Create a NEW HTML project\n' +
      '• Keep the original PHP widget intact\n' +
      '\n✅ Your original widget will NOT be modified.\n' +
      '\nContinue?'
    );

    if (!confirmed) return;

    try {
      const extracted = extractCodeFromPhp(fileGroups.activeGroup.php);

      if (!extracted.success) {
        alert(`❌ Extraction failed: ${extracted.error || 'Could not extract code from PHP'}`);
        return;
      }

      // Create NEW HTML project (preserve original PHP widget)
      const newProjectName = `${fileGroups.activeGroup.name} (HTML)`;
      const newGroup = fileGroups.createNewGroup(newProjectName, 'html', 'empty');

      // Set extracted content
      fileGroups.updateGroupFile(newGroup.id, 'html', extracted.html);
      fileGroups.updateGroupFile(newGroup.id, 'css', extracted.css);
      fileGroups.updateGroupFile(newGroup.id, 'js', extracted.js);

      // Switch to new HTML project
      fileGroups.selectGroup(newGroup.id);

      // Switch to HTML tab
      handleCodeTabChange('html');

      alert(
        '✅ Created new HTML project!\n\n' +
        `Project: "${newProjectName}"\n\n` +
        `Extracted:\n` +
        `• HTML: ${extracted.html.length} characters\n` +
        `• CSS: ${extracted.css.length} characters\n` +
        `• JS: ${extracted.js.length} characters\n\n` +
        '✅ Original PHP widget preserved.\n' +
        'You can now edit the HTML version separately.'
      );

    } catch (error: any) {
      console.error('❌ Conversion error:', error);
      alert(`❌ Conversion failed: ${error.message}`);
    }
  };

  // Download widget PHP file
  const handleDownloadWidgetPhp = () => {
    if (!editorPhp || !editorPhp.trim()) {
      alert('⚠️ No PHP widget code to download. Generate a widget first.');
      return;
    }

    const blob = new Blob([editorPhp], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'widget.php';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download widget CSS file
  const handleDownloadWidgetCss = () => {
    if (!editorCss.trim()) {
      alert('⚠️ No CSS code to download. Add CSS code first.');
      return;
    }

    const blob = new Blob([editorCss], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'widget.css';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download widget JS file
  const handleDownloadWidgetJs = () => {
    if (!editorJs.trim()) {
      alert('⚠️ No JavaScript code to download. Add JS code first.');
      return;
    }

    const blob = new Blob([editorJs], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'widget.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download README.md file
  const handleDownloadReadme = () => {
    const manifest = fileGroups.activeGroup?.projectManifest || '';
    if (!manifest.trim()) {
      alert('⚠️ No project documentation to download. Generate docs first.');
      return;
    }

    const blob = new Blob([manifest], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'README.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Regenerate README.md with AI
  const handleRegenerateDocs = async () => {
    if (!fileGroups.activeGroup) {
      alert('⚠️ No active project. Please select or create a project first.');
      return;
    }

    setIsRegeneratingDocs(true);
    try {
      const response = await fetch('/api/analyze-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: fileGroups.activeGroup.id,
          projectName: fileGroups.activeGroup.name,
          projectType: fileGroups.activeGroup.type,
          isPlugin: fileGroups.activeGroup.isPlugin,
          files: {
            html: fileGroups.activeGroup.html,
            css: fileGroups.activeGroup.css,
            js: fileGroups.activeGroup.js,
            php: fileGroups.activeGroup.php,
            hubl: fileGroups.activeGroup.hubl,
            pluginMainFile: fileGroups.activeGroup.pluginMainFile,
            widgetFiles: fileGroups.activeGroup.widgetFiles,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate documentation');
      }

      // Stream the markdown response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullMarkdown = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          fullMarkdown += chunk;

          // Stream into Monaco editor in real-time if on docs tab
          if (activeCodeTab === 'docs' && docsEditorRef.current) {
            const model = docsEditorRef.current.getModel();
            if (model) {
              // Replace all content with accumulated markdown
              const fullRange = model.getFullModelRange();
              model.pushEditOperations(
                [],
                [{
                  range: fullRange,
                  text: fullMarkdown
                }],
                () => null
              );
              console.log(`📝 Streamed ${fullMarkdown.length} chars to docs editor`);
            } else {
              console.warn('⚠️ Docs editor model not available');
            }
          } else if (activeCodeTab === 'docs') {
            console.warn('⚠️ Docs editor ref not available');
          }
        }
      }

      // Save the complete markdown to the project
      fileGroups.updateGroup(fileGroups.activeGroup.id, { projectManifest: fullMarkdown });
      console.log('✅ README.md regenerated successfully');
    } catch (error: any) {
      console.error('❌ Failed to regenerate documentation:', error);
      alert(`Failed to regenerate documentation: ${error.message}`);
    } finally {
      setIsRegeneratingDocs(false);
    }
  };

  // Track if this is a loaded section (has initial content)
  const hasInitialContent = !!(
    initialSection?.html ||
    initialSection?.css ||
    initialSection?.js
  );

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Hot reload handler - triggered on Cmd+S / Ctrl+S
  useEffect(() => {
    const handleSave = async (e: KeyboardEvent) => {
      // Check if Cmd+S (Mac) or Ctrl+S (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();

        // Only trigger hot reload if:
        // 1. Hot reload is enabled
        // 2. Playground is running
        if (hotReloadEnabled && typeof window !== 'undefined' && (window as any).playgroundClient) {

          // PHP/Widget projects: Use dedicated updateWidgetAndRefresh function
          if (
            currentProject?.type === 'php' &&
            currentProject?.wordpressDeployment?.isDeployed
          ) {
            console.log('🔥 Hot reload triggered (Cmd+S) - PHP Widget');

            try {
              const deploymentType = currentProject.wordpressDeployment.lastDeploymentType || 'live-page';
              const pageSlug = deploymentType === 'live-page'
                ? currentProject.wordpressDeployment.livePageSlug
                : currentProject.wordpressDeployment.elementorPageSlug;

              if ((window as any).updateWidgetAndRefresh) {
                await (window as any).updateWidgetAndRefresh(
                  editorPhp,
                  editorCss,
                  editorJs,
                  currentProject.wordpressDeployment.pluginSlug,
                  pageSlug,
                  deploymentType
                );
                console.log('✅ Hot reload completed - PHP Widget');
              } else {
                console.warn('⚠️ updateWidgetAndRefresh function not available');
              }
            } catch (error: any) {
              console.error('❌ Hot reload failed:', error);
              alert(`Hot reload failed: ${error.message}`);
            }
          }
          // HTML sections: Re-deploy to last used deployment type
          else if (currentProject?.type === 'html' || currentProject?.type === 'hubspot') {
            console.log('🔥 Hot reload triggered (Cmd+S) - HTML Section');

            try {
              // Check if window.currentPageId exists (meaning we've deployed before)
              if ((window as any).currentPageId && (window as any).importHtmlSectionToPage) {
                // Use live-page as default deployment type for hot reload
                const deploymentType = 'live-page';

                const sectionName = section.name || "Untitled Section";

                const result = await (window as any).importHtmlSectionToPage({
                  name: sectionName,
                  html: editorHtml,
                  css: editorCss,
                  js: editorJs,
                  globalCss: globalCss,
                }, deploymentType);

                if (result.success) {
                  console.log('✅ Hot reload completed - HTML Section');
                } else {
                  console.warn('⚠️ Hot reload completed but with warnings');
                }
              } else {
                console.log('ℹ️ HTML section not yet deployed. Use "Deploy to Live Page" or "Deploy to Elementor" first.');
              }
            } catch (error: any) {
              console.error('❌ Hot reload failed:', error);
              // Don't show alert for HTML sections, just log
              console.log('💡 Hot reload failed. You may need to deploy manually.');
            }
          }
        } else {
          // Just a regular save without hot reload
          console.log('💾 Save triggered (Cmd+S) - hot reload not enabled or playground not running');
        }
      }
    };

    window.addEventListener('keydown', handleSave);
    return () => window.removeEventListener('keydown', handleSave);
  }, [hotReloadEnabled, currentProject, editorPhp, editorCss, editorJs, editorHtml, section.name, globalCss]);

  // Event handlers for dropdown actions (defined with useCallback for stable references)
  const handleGenerateProject = useCallback(() => {
    setGenerateModalConversionMode(false);
    setShowGenerateModal(true);
  }, []);

  const handleSaveLibrary = useCallback(() => {
    setShowSaveDialog(true);
  }, []);

  const handleConvertWidget = useCallback(() => {
    setGenerateModalConversionMode(true);
    setShowGenerateModal(true);
  }, []);

  const handlePreviewHtml = useCallback(() => {
    console.log('🎯 Preview HTML triggered from dropdown');
    setShowPreview(prev => {
      const newValue = !prev;
      if (newValue) setShowHublPreview(false);
      return newValue;
    });
  }, []);

  const handlePreviewHubl = useCallback(() => {
    console.log('🎯 Preview HubL triggered from dropdown');
    setShowHublPreview(prev => {
      const newValue = !prev;
      if (newValue) setShowPreview(false);
      return newValue;
    });
  }, []);

  const handleSplitHtml = useCallback(() => {
    console.log('🎯 Split HTML triggered from dropdown');
    setShowHtmlSplitter(true);
  }, []);

  const handleCreateNewProject = useCallback(() => {
    console.log('🎯 Create New Project triggered from dropdown');
    setShowNewGroupDialog(true);
  }, []);

  const handleToggleProjectPanel = useCallback(() => {
    console.log('🎯 Toggle Project Panel triggered from dropdown');
    setShowProjectSidebar(prev => !prev);
  }, []);

  const handleToggleFilesPanel = useCallback(() => {
    console.log('🎯 Toggle Files Panel triggered from dropdown');
    // Files panel is the same as project panel in this context
    setShowProjectSidebar(prev => !prev);
  }, []);

  // Listen for tab dropdown actions (from parent page tab bar)
  useEffect(() => {
    window.addEventListener('trigger-generate-project', handleGenerateProject);
    window.addEventListener('trigger-save-library', handleSaveLibrary);
    window.addEventListener('trigger-convert-widget', handleConvertWidget);
    window.addEventListener('trigger-preview-html', handlePreviewHtml);
    window.addEventListener('trigger-preview-hubl', handlePreviewHubl);
    window.addEventListener('split-html', handleSplitHtml);
    window.addEventListener('create-new-project', handleCreateNewProject);
    window.addEventListener('toggle-project-panel', handleToggleProjectPanel);
    window.addEventListener('toggle-files-panel', handleToggleFilesPanel);

    return () => {
      window.removeEventListener('trigger-generate-project', handleGenerateProject);
      window.removeEventListener('trigger-save-library', handleSaveLibrary);
      window.removeEventListener('trigger-convert-widget', handleConvertWidget);
      window.removeEventListener('trigger-preview-html', handlePreviewHtml);
      window.removeEventListener('trigger-preview-hubl', handlePreviewHubl);
      window.removeEventListener('split-html', handleSplitHtml);
      window.removeEventListener('create-new-project', handleCreateNewProject);
      window.removeEventListener('toggle-project-panel', handleToggleProjectPanel);
      window.removeEventListener('toggle-files-panel', handleToggleFilesPanel);
    };
  }, [handleGenerateProject, handleSaveLibrary, handleConvertWidget, handlePreviewHtml, handlePreviewHubl, handleSplitHtml, handleCreateNewProject, handleToggleProjectPanel, handleToggleFilesPanel]);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  // Debug: Log when component mounts/remounts
  useEffect(() => {
    console.log("🔄 HtmlSectionEditor mounted with initialSection:", {
      name: initialSection?.name || "New Section",
      id: initialSection?.id || "default",
      htmlLength: initialSection?.html?.length || 0,
      cssLength: initialSection?.css?.length || 0,
      jsLength: initialSection?.js?.length || 0,
    });
    console.log("🔄 Section state after mount:", {
      name: section.name,
      id: section.id,
      htmlLength: section.html?.length || 0,
      cssLength: section.css?.length || 0,
      jsLength: section.js?.length || 0,
    });
  }, []);

  // Listen for morph diff events from chat widgets
  useEffect(() => {
    const handleShowDiff = (event: CustomEvent) => {
      const { file, originalCode, mergedCode, usage, stats } = event.detail;
      console.log('📊 Received morph diff event:', { file, stats });

      setDiffData({ file, originalCode, mergedCode, usage, stats });
      setShowDiffPreview(true);

      // Close live preview if open to show the diff editor
      if (showPreview) {
        setShowPreview(false);
        console.log('🔄 Auto-closing live preview to show diff');
      }

      // Auto-switch to the correct tab
      handleCodeTabChange(file);
    };

    window.addEventListener('show-morph-diff' as any, handleShowDiff);

    return () => {
      window.removeEventListener('show-morph-diff' as any, handleShowDiff);
    };
  }, [showPreview]);

  const handleCodeTabChange = (tab: "html" | "css" | "js" | "php" | "hubl" | string) => {
    console.log('🔄 Tab change requested:', tab);

    // Check if this is a widget file tab (format: "widget-{widgetId}")
    if (typeof tab === 'string' && tab.startsWith('widget-')) {
      const widgetId = tab.replace('widget-', '');
      console.log('📦 Widget tab clicked:', { widgetId, activeGroup: fileGroups.activeGroup?.name });

      setActiveWidgetId(widgetId);
      setInternalActiveCodeTab('php'); // Widget files are PHP

      // Load widget content into editor
      if (fileGroups.activeGroup?.widgetFiles?.[widgetId]) {
        const widget = fileGroups.activeGroup.widgetFiles[widgetId];
        const widgetContent = widget.content;
        console.log('📝 Loading widget content:', {
          widgetName: widget.name,
          contentLength: widgetContent?.length || 0,
          contentPreview: widgetContent?.substring(0, 100)
        });
        updateContent('php', widgetContent);
        console.log('✅ updateContent called for widget');
      } else {
        console.error('❌ Widget not found in activeGroup.widgetFiles:', {
          widgetId,
          availableWidgets: Object.keys(fileGroups.activeGroup?.widgetFiles || {})
        });
      }
    } else {
      // Regular file tab
      console.log('📄 Regular file tab clicked:', tab);
      setActiveWidgetId(null); // Clear widget selection

      if (tab === 'php' && fileGroups.activeGroup?.isPlugin) {
        // Load main plugin file
        const mainFileContent = fileGroups.activeGroup.pluginMainFile || '';
        console.log('📝 Loading main plugin file:', {
          contentLength: mainFileContent.length,
          contentPreview: mainFileContent.substring(0, 100)
        });
        updateContent('php', mainFileContent);
        console.log('✅ updateContent called for main plugin file');
      }

      if (onCodeTabChange) {
        onCodeTabChange(tab as "html" | "css" | "js" | "php" | "hubl");
      } else {
        setInternalActiveCodeTab(tab as "html" | "css" | "js" | "php" | "hubl");
      }
    }
    // Mobile uses horizontal pills, so no need to close file tree
  };

  // Handle accepting diff changes
  const handleAcceptDiff = () => {
    if (!diffData) return;

    // Apply the merged code to the editor
    updateContent(diffData.file, diffData.mergedCode);

    // Update section
    updateSection({ [diffData.file]: diffData.mergedCode });

    // Close diff preview
    setShowDiffPreview(false);
    setDiffData(null);

    // Dispatch custom event for auto-close chat on mobile
    window.dispatchEvent(new CustomEvent('code-edit-accepted'));

    console.log(`✅ Accepted diff changes for ${diffData.file}`);
  };

  // Handle declining diff changes
  const handleDeclineDiff = () => {
    setShowDiffPreview(false);
    setDiffData(null);
    console.log('❌ Declined diff changes');
  };

  // Update section and notify parent
  const updateSection = (updates: Partial<Section>) => {
    const updatedSection = {
      ...section,
      ...updates,
      updatedAt: Date.now(),
    };
    setSection(updatedSection);
    onSectionChange?.(updatedSection);

    // Sync code changes to BOTH global state (for chat) AND file groups (for persistence)
    if ('html' in updates || 'css' in updates || 'js' in updates || 'php' in updates || 'hubl' in updates) {
      const activeGroupId = fileGroups.activeGroup?.id;
      if (activeGroupId) {
        // Persist to file groups (localStorage)
        if ('html' in updates) fileGroups.updateGroupFile(activeGroupId, 'html', updates.html || '');
        if ('css' in updates) fileGroups.updateGroupFile(activeGroupId, 'css', updates.css || '');
        if ('js' in updates) fileGroups.updateGroupFile(activeGroupId, 'js', updates.js || '');
        if ('php' in updates) fileGroups.updateGroupFile(activeGroupId, 'php', updates.php || '');
        if ('hubl' in updates) fileGroups.updateGroupFile(activeGroupId, 'hubl', updates.hubl || '');
      }

      // Also update global editor content (for chat access)
      if ('html' in updates) updateContent('html', updates.html || '');
      if ('css' in updates) updateContent('css', updates.css || '');
      if ('js' in updates) updateContent('js', updates.js || '');
      if ('php' in updates) updateContent('php', updates.php || '');
      if ('hubl' in updates) updateContent('hubl', updates.hubl || '');
    }
  };

  // Sync section content to global state ONLY when section ID changes (loading from library)
  // DO NOT sync on content changes - that would overwrite Morph/tool edits!
  // SKIP FOR PLUGINS: Plugins load content from pluginMainFile via the fileGroups useEffect below
  useEffect(() => {
    // Skip for plugins - they load content from pluginMainFile, not section.php
    if (fileGroups.activeGroup?.isPlugin) {
      console.log('⏭️ Skipping section sync for plugin project');
      return;
    }

    setAllContent({
      html: section.html || '',
      css: section.css || '',
      js: section.js || '',
      php: section.php || '',
      hubl: section.hubl || ''
    });
  }, [section.id, setAllContent, fileGroups.activeGroup?.isPlugin]);


  // Update section when streamed content changes
  useEffect(() => {
    // Don't apply streaming if we loaded a section from library (has initial content)
    if (hasInitialContent) {
      console.log("⏭️ Skipping streamed updates - section loaded from library");
      return;
    }

    // Only apply streamed updates if there's actual content (not just empty strings)
    const updates: Partial<Section> = {};
    if (streamedHtml && streamedHtml.length > 0) updates.html = streamedHtml;
    if (streamedCss && streamedCss.length > 0) updates.css = streamedCss;
    if (streamedJs && streamedJs.length > 0) updates.js = streamedJs;

    // Only update if we have actual content to apply
    if (Object.keys(updates).length > 0) {
      console.log("📥 Applying streamed updates:", Object.keys(updates));
      setSection((prev) => ({
        ...prev,
        ...updates,
        updatedAt: Date.now(),
      }));
    }
  }, [streamedHtml, streamedCss, streamedJs, hasInitialContent]);

  // Sync active file group with editor content
  useEffect(() => {
    console.log('🔄 useEffect [activeGroupId] triggered:', {
      activeGroupId: fileGroups.activeGroupId,
      activeGroupName: fileGroups.activeGroup?.name,
      activeGroupType: fileGroups.activeGroup?.type,
      currentSectionId: section.id,
      currentSectionName: section.name,
    });

    if (fileGroups.activeGroup) {
      // Load active group content into editor
      console.log('📂 Loading active group:', fileGroups.activeGroup.name);

      // For plugins, load the plugin main file into PHP editor
      const phpContent = fileGroups.activeGroup.isPlugin
        ? (fileGroups.activeGroup.pluginMainFile || '')
        : (fileGroups.activeGroup.php || '');

      console.log('📄 Loading content for group:', {
        name: fileGroups.activeGroup.name,
        isPlugin: fileGroups.activeGroup.isPlugin,
        hasPluginMainFile: !!fileGroups.activeGroup.pluginMainFile,
        pluginMainFileLength: fileGroups.activeGroup.pluginMainFile?.length || 0,
        hasPhp: !!fileGroups.activeGroup.php,
        phpLength: fileGroups.activeGroup.php?.length || 0,
        phpContentLength: phpContent.length,
        phpContentPreview: phpContent.substring(0, 100)
      });

      setAllContent({
        html: fileGroups.activeGroup.html,
        css: fileGroups.activeGroup.css,
        js: fileGroups.activeGroup.js,
        php: phpContent,
        hubl: fileGroups.activeGroup.hubl || '',
      });

      // Update section for backward compatibility
      const updatedSection = {
        ...section,
        name: fileGroups.activeGroup!.name,
        type: fileGroups.activeGroup!.type,
        html: fileGroups.activeGroup!.html,
        css: fileGroups.activeGroup!.css,
        js: fileGroups.activeGroup!.js,
        php: phpContent, // Use calculated phpContent (includes pluginMainFile for plugins)
        hubl: fileGroups.activeGroup!.hubl,
        id: fileGroups.activeGroup!.id,
        updatedAt: Date.now(),
      };
      console.log('📁 HtmlSectionEditor: Loading project from file groups:', {
        id: updatedSection.id,
        name: updatedSection.name,
        type: updatedSection.type,
        htmlLength: updatedSection.html?.length || 0,
        cssLength: updatedSection.css?.length || 0,
        jsLength: updatedSection.js?.length || 0,
        phpLength: updatedSection.php?.length || 0,
        hublLength: updatedSection.hubl?.length || 0,
      });
      setSection(updatedSection);

      // Notify parent of section change (so chat context updates)
      onSectionChange?.(updatedSection);

      // Auto-convert HTML to HubL for HubSpot projects
      if (fileGroups.activeGroup.type === 'hubspot' &&
          fileGroups.activeGroup.html &&
          !fileGroups.activeGroup.hubl) {
        console.log('🧡 HubSpot project detected with HTML but no HubL - auto-converting...');
        try {
          const result = convertHtmlToHubL(fileGroups.activeGroup.html, { kind: 'page' });
          console.log('✅ Auto-conversion successful:', result.fields.length, 'fields detected');
          fileGroups.updateGroupFile(fileGroups.activeGroup.id, 'hubl', result.moduleHtml);
          // Update local state to show the button immediately
          updateContent('hubl', result.moduleHtml);
        } catch (error) {
          console.error('❌ Auto-conversion failed:', error);
          // Fall back to copying HTML as-is
          fileGroups.updateGroupFile(fileGroups.activeGroup.id, 'hubl', fileGroups.activeGroup.html);
          updateContent('hubl', fileGroups.activeGroup.html);
        }
      }

      // Switch to appropriate tab based on group type
      if (fileGroups.activeGroup.type === 'php' && (fileGroups.activeGroup.php || fileGroups.activeGroup.pluginMainFile)) {
        handleCodeTabChange('php');
      } else if (fileGroups.activeGroup.type === 'hubspot' && fileGroups.activeGroup.hubl) {
        handleCodeTabChange('hubl');
      } else {
        handleCodeTabChange('html');
      }
    } else if (fileGroups.groups.length === 0) {
      // No groups exist, create a default one
      console.log('📦 No groups found, creating default group');
      const defaultGroup = fileGroups.createNewGroup('Untitled Project', 'html', 'empty');
      fileGroups.selectGroup(defaultGroup.id);
    }
  }, [fileGroups.activeGroupId]);

  // Save active group content when editor changes (debounced auto-save)
  useEffect(() => {
    if (!fileGroups.activeGroup) return;

    const timeoutId = setTimeout(() => {
      console.log('💾 Auto-saving active group:', fileGroups.activeGroup.name);

      // If editing a widget file, save to that widget
      if (activeWidgetId && editorPhp) {
        console.log(`💾 Saving widget file: ${activeWidgetId}`);
        fileGroups.updateWidgetInPlugin(
          fileGroups.activeGroup.id,
          activeWidgetId,
          editorPhp
        );
      } else {
        // Regular file save
        fileGroups.updateGroupFile(fileGroups.activeGroup.id, 'html', editorHtml);
        fileGroups.updateGroupFile(fileGroups.activeGroup.id, 'css', editorCss);
        fileGroups.updateGroupFile(fileGroups.activeGroup.id, 'js', editorJs);
        if (editorPhp) {
          fileGroups.updateGroupFile(fileGroups.activeGroup.id, 'php', editorPhp);
        }
        if (editorHubl) {
          fileGroups.updateGroupFile(fileGroups.activeGroup.id, 'hubl', editorHubl);
        }
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [editorHtml, editorCss, editorJs, editorPhp, editorHubl, fileGroups.activeGroup?.id, activeWidgetId]);

  // Track unsaved changes for PHP widget projects
  useEffect(() => {
    // Only track for PHP widget projects
    if (!fileGroups.activeGroup || fileGroups.activeGroup.type !== 'php') {
      setHasUnsavedChanges(false);
      return;
    }

    // Initialize last saved content on mount
    if (!lastSavedContentRef.current) {
      lastSavedContentRef.current = {
        html: editorHtml,
        css: editorCss,
        js: editorJs,
        php: editorPhp,
        hubl: editorHubl,
      };
      setHasUnsavedChanges(false);
      return;
    }

    // Compare current content with last saved
    const hasChanges =
      editorHtml !== lastSavedContentRef.current.html ||
      editorCss !== lastSavedContentRef.current.css ||
      editorJs !== lastSavedContentRef.current.js ||
      editorPhp !== lastSavedContentRef.current.php ||
      editorHubl !== lastSavedContentRef.current.hubl;

    setHasUnsavedChanges(hasChanges);
  }, [editorHtml, editorCss, editorJs, editorPhp, editorHubl, fileGroups.activeGroup?.type]);

  // Manual save function for PHP widget projects
  const handleManualSave = useCallback(async () => {
    if (!fileGroups.activeGroup || fileGroups.activeGroup.type !== 'php') {
      return;
    }

    setIsSaving(true);
    try {
      // Save to localStorage via fileGroups
      fileGroups.updateGroupFile(fileGroups.activeGroup.id, 'html', editorHtml);
      fileGroups.updateGroupFile(fileGroups.activeGroup.id, 'css', editorCss);
      fileGroups.updateGroupFile(fileGroups.activeGroup.id, 'js', editorJs);
      fileGroups.updateGroupFile(fileGroups.activeGroup.id, 'php', editorPhp);
      if (editorHubl) {
        fileGroups.updateGroupFile(fileGroups.activeGroup.id, 'hubl', editorHubl);
      }

      // Update last saved content ref
      lastSavedContentRef.current = {
        html: editorHtml,
        css: editorCss,
        js: editorJs,
        php: editorPhp,
        hubl: editorHubl,
      };

      setHasUnsavedChanges(false);
      console.log('💾 Manual save complete:', fileGroups.activeGroup.name);

      // Small delay to show "Saving..." state
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('❌ Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [editorHtml, editorCss, editorJs, editorPhp, editorHubl, fileGroups]);

  // Listen for Cmd+S to trigger manual save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+S (Mac) or Ctrl+S (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (fileGroups.activeGroup?.type === 'php') {
          handleManualSave();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleManualSave, fileGroups.activeGroup?.type]);

  // Listen for select-project event from Project Library
  useEffect(() => {
    const handleSelectProject = (event: CustomEvent) => {
      const { projectId } = event.detail;
      console.log('📂 HtmlSectionEditor: Received select-project event:', projectId);

      // Update localStorage
      fileGroups.selectGroup(projectId);

      // Immediately notify parent with the new project ID
      window.dispatchEvent(new CustomEvent('project-selected', {
        detail: { projectId }
      }));
      console.log('📢 HtmlSectionEditor: Dispatched project-selected event:', projectId);
    };

    window.addEventListener('select-project' as any, handleSelectProject);
    return () => window.removeEventListener('select-project' as any, handleSelectProject);
  }, [fileGroups]);

  // Iframe Inspector Mode - react-grab style element selection
  useEffect(() => {
    if (!inspectMode || !showPreview || !previewIframeRef.current) {
      return;
    }

    const iframe = previewIframeRef.current;
    let cleanupFn: (() => void) | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    const setupInspector = () => {
      // Clean up previous inspector if exists
      if (cleanupFn) {
        cleanupFn();
        cleanupFn = null;
      }

      let iframeDoc: Document | null = null;

      // Try to access iframe document (same-origin only)
      try {
        iframeDoc = iframe.contentDocument || iframe.contentWindow?.document || null;
      } catch (e) {
        console.warn('⚠️ Cannot access iframe (cross-origin)');
        return false;
      }

      if (!iframeDoc || !iframeDoc.body) {
        console.warn('⚠️ No iframe document or body available yet');
        return false;
      }

      console.log('✅ Inspector mode activated for iframe!');

      // Create overlay for highlighting (react-grab style)
      const overlay = iframeDoc.createElement('div');
      overlay.style.cssText = `
        position: absolute;
        border: 2px solid #3b82f6;
        background-color: rgba(59, 130, 246, 0.1);
        pointer-events: none;
        z-index: 999999;
        display: none;
        transition: all 0.1s ease;
      `;
      iframeDoc.body.appendChild(overlay);

      // Change cursor to crosshair in inspect mode
      iframeDoc.body.style.cursor = 'crosshair';

      // Track current hovered element
      let currentTarget: HTMLElement | null = null;

      // Hover handler - highlight element (react-grab style)
      const handleMouseMove = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target || target === iframeDoc?.body) {
          overlay.style.display = 'none';
          return;
        }

        currentTarget = target;

        // Position overlay over element
        const rect = target.getBoundingClientRect();
        const scrollX = iframeDoc?.defaultView?.scrollX || 0;
        const scrollY = iframeDoc?.defaultView?.scrollY || 0;

        overlay.style.display = 'block';
        overlay.style.left = `${rect.left + scrollX}px`;
        overlay.style.top = `${rect.top + scrollY}px`;
        overlay.style.width = `${rect.width}px`;
        overlay.style.height = `${rect.height}px`;
      };

      // Click handler - grab element and open modal
      const handleClick = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const target = e.target as HTMLElement;
        if (!target) return;

        try {
          // Extract element data (react-grab style)
          const html = target.outerHTML;
          const tagName = target.tagName.toLowerCase();
          const classList = Array.from(target.classList);

          // Generate selector
          let selector = tagName;
          if (target.id) {
            selector = `#${target.id}`;
          } else if (classList.length > 0) {
            selector = `${tagName}.${classList.join('.')}`;
          }

          // Get all attributes
          const attributes: Record<string, string> = {};
          Array.from(target.attributes).forEach(attr => {
            attributes[attr.name] = attr.value;
          });

          // Get computed styles (key ones)
          const computedStyles: Record<string, string> = {};
          if (iframeDoc?.defaultView) {
            const styles = iframeDoc.defaultView.getComputedStyle(target);
            const importantProps = [
              'display', 'position', 'width', 'height', 'margin', 'padding',
              'color', 'background-color', 'font-size', 'font-family', 'font-weight',
              'border', 'border-radius', 'box-shadow', 'text-align', 'flex-direction',
              'align-items', 'justify-content', 'grid-template-columns', 'gap'
            ];
            importantProps.forEach(prop => {
              const value = styles.getPropertyValue(prop);
              if (value) {
                computedStyles[prop] = value;
              }
            });
          }

          // Get surrounding context
          const parent = target.parentElement;
          const siblings = parent ? Array.from(parent.children).filter(el => el !== target) : [];
          const context = `
Parent: ${parent?.tagName || 'none'}
Siblings: ${siblings.map(el => el.tagName).join(', ') || 'none'}
Position: ${Array.from(parent?.children || []).indexOf(target) + 1} of ${parent?.children.length || 0}
          `.trim();

          // Store element data and open modal
          setInspectedElement({
            html,
            selector,
            classList,
            tagName,
            attributes,
            computedStyles,
            context
          });

          // Visual feedback - flash green (react-grab style)
          overlay.style.border = '2px solid #10b981';
          overlay.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
          setTimeout(() => {
            overlay.style.border = '2px solid #3b82f6';
            overlay.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
          }, 300);

          // Turn off inspect mode after selection
          setInspectMode(false);

          console.log('✅ Element grabbed!', { selector, tagName });
        } catch (error) {
          console.error('❌ Error grabbing element:', error);
        }
      };

      // Attach listeners to iframe document
      iframeDoc.addEventListener('mousemove', handleMouseMove);
      iframeDoc.addEventListener('click', handleClick, true); // Capture phase

      // Store cleanup function
      cleanupFn = () => {
        try {
          // Reset cursor
          if (iframeDoc?.body) {
            iframeDoc.body.style.cursor = '';
          }

          // Remove overlay
          if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
          }

          iframeDoc?.removeEventListener('mousemove', handleMouseMove);
          iframeDoc?.removeEventListener('click', handleClick, true);
        } catch (e) {
          // Ignore cleanup errors
        }
      };

      return true;
    };

    // Try to setup immediately (may not work if iframe hasn't loaded yet)
    if (!setupInspector()) {
      // If immediate setup failed, try again after a short delay
      timeoutId = setTimeout(() => {
        setupInspector();
      }, 100);
    }

    // Cleanup
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (cleanupFn) {
        cleanupFn();
      }
    };
  }, [inspectMode, showPreview, onEditElementInChat]);

  // HTML Preview resizable divider handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!previewDragging) return;
      const container = document.getElementById('html-preview-split-container');
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      // Clamp between 30% and 70%
      setPreviewSplitWidth(Math.min(Math.max(newWidth, 30), 70));
    };

    const handleMouseUp = () => {
      setPreviewDragging(false);
    };

    if (previewDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [previewDragging]);

  // Generate preview HTML with all styles and scripts (uses global state for latest content)
  const generatePreviewHTML = (): string => {
    const inlineStyles = sectionSettingsToCSS(section.settings);
    const animationClass = getAnimationClassName(section.settings.animation);
    const customClasses = section.settings.advanced.customClasses.join(" ");
    const allClasses = [animationClass, customClasses]
      .filter(Boolean)
      .join(" ");

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    /* Active Style Kit CSS */
    ${activeStyleKitCss || globalCss}

    /* Section-specific CSS */
    ${editorCss}

    /* Animation CSS */
    ${getAnimationCSS(section.settings.animation)}

    /* Reset */
    * { box-sizing: border-box; }
    body { margin: 0; padding: 16px; }
  </style>
</head>
<body>
  <div class="section-wrapper ${allClasses}" style="${inlineStyles}">
    ${editorHtml}
  </div>

  <script>
    ${editorJs}
  </script>
</body>
</html>
`;
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Top Bar - HIDDEN */}
      {false && (
        <div
          style={{
            padding: isMobile ? "6px 12px" : "8px 12px",
            background: "var(--muted)",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <input
            type="text"
            value={section.name}
            onChange={(e) => updateSection({ name: e.target.value })}
            style={{
              fontSize: "16px",
              fontWeight: 600,
              border: "1px solid transparent",
              padding: "4px 8px",
              borderRadius: "4px",
              background: "transparent",
              outline: "none",
              transition: "all 0.2s",
              maxWidth: isMobile ? "150px" : "none",
            }}
            onFocus={(e) => {
              e.target.style.border = "1px solid var(--primary)";
              e.target.style.background = "var(--background)";
            }}
            onBlur={(e) => {
              e.target.style.border = "1px solid transparent";
              e.target.style.background = "transparent";
            }}
          />

          <div style={{ display: "flex", gap: isMobile ? "6px" : "8px", alignItems: "center" }}>
            {/* Save to Library - Always visible */}
            <button
              onClick={() => setShowSaveDialog(true)}
              style={{
                padding: isMobile ? "8px 12px" : "6px 12px",
                background: "#000000",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                fontSize: isMobile ? "14px" : "13px",
                cursor: "pointer",
                fontWeight: 500,
                minHeight: isMobile ? "44px" : "auto",
              }}
            >
              💾 {isMobile ? "" : "Save to Library"}
            </button>

            {/* Deploy to Live Page - Only for PHP Widget projects */}
            {!isMobile && editorPhp && (
              <button
                onClick={async () => {
                  try {
                    // Check if playground is running
                    if (!(window as any).playgroundClient) {
                      alert(
                        "WordPress Playground is not running. Please launch it first from the WordPress Playground tab.",
                      );
                      return;
                    }

                    const deployWidget = (window as any).deployAndPreviewWidget;
                    if (!deployWidget) {
                      alert(
                        "WordPress Playground functions not loaded yet. Please wait a moment and try again.",
                      );
                      return;
                    }

                    // Deploy widget to live page
                    const result = await deployWidget(editorPhp, editorCss, editorJs, 'live-page');

                    if (result.success) {
                      console.log("✅ Widget deployed to live page");

                      // Automatically switch to WordPress Playground tab
                      if (onSwitchToPlayground) {
                        onSwitchToPlayground();
                      }
                    }
                  } catch (error: any) {
                    console.error("Deploy error:", error);
                    alert(`❌ Failed to deploy: ${error.message}`);
                  }
                }}
                style={{
                  padding: "6px 12px",
                  background: "#10b981",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "13px",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
                title="Deploy widget to live page (front-end view)"
              >
                📄 Deploy to Live Page
              </button>
            )}

            {/* Deploy to Elementor - Only for PHP Widget projects */}
            {!isMobile && editorPhp && (
              <button
                onClick={async () => {
                  console.log('🚀 Deploy to Elementor clicked:', {
                    activeGroupId: fileGroups.activeGroupId,
                    activeGroupName: fileGroups.activeGroup?.name,
                    editorPhpLength: editorPhp?.length || 0,
                    editorCssLength: editorCss?.length || 0,
                    editorJsLength: editorJs?.length || 0,
                    fileGroupPhpLength: fileGroups.activeGroup?.php?.length || 0,
                  });
                  try {
                    // Check if playground is running
                    if (!(window as any).playgroundClient) {
                      alert(
                        "WordPress Playground is not running. Please launch it first from the WordPress Playground tab.",
                      );
                      return;
                    }

                    const deployWidget = (window as any).deployAndPreviewWidget;
                    if (!deployWidget) {
                      alert(
                        "WordPress Playground functions not loaded yet. Please wait a moment and try again.",
                      );
                      return;
                    }

                    // Deploy widget to Elementor editor
                    const result = await deployWidget(editorPhp, editorCss, editorJs, 'elementor-editor');

                    if (result.success) {
                      console.log("✅ Widget deployed to Elementor editor");

                      // Automatically switch to WordPress Playground tab
                      if (onSwitchToPlayground) {
                        onSwitchToPlayground();
                      }
                    }
                  } catch (error: any) {
                    console.error("Deploy error:", error);
                    alert(`❌ Failed to deploy: ${error.message}`);
                  }
                }}
                style={{
                  padding: "6px 12px",
                  background: "#7c3aed",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "13px",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
                title="Deploy widget to Elementor editor"
              >
                🎨 Deploy to Elementor
              </button>
            )}

            {/* Settings - Desktop only */}
            {!isMobile && (
              <button
                onClick={() => setShowSettings(!showSettings)}
                style={{
                  padding: "6px 12px",
                  background: showSettings ? "#000000" : "var(--muted)",
                  color: showSettings ? "#ffffff" : "var(--foreground)",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "13px",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                {showSettings ? "✓" : ""} Settings
              </button>
            )}

            {/* HTML Preview - Desktop only */}
            {!isMobile && (
              <button
                onClick={() => {
                  console.log('🔵 HTML Preview button clicked');
                  setShowPreview(!showPreview);
                  if (!showPreview) setShowHublPreview(false);
                }}
                style={{
                  padding: "6px 12px",
                  background: showPreview ? "#10b981" : "#2d2d2d",
                  color: showPreview ? "#ffffff" : "#cccccc",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "13px",
                  cursor: "pointer",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <AiFillHtml5 size={14} color={showPreview ? "#ffffff" : "#E34F26"} />
                {showPreview ? "✓ Preview HTML" : "Preview HTML"}
              </button>
            )}

            {/* HubL Preview - Desktop only, HubSpot projects */}
            {!isMobile && fileGroups.activeGroup?.type === 'hubspot' && editorHubl && (
              <button
                onClick={() => {
                  console.log('🧡 HubL Preview button clicked');
                  setShowHublPreview(!showHublPreview);
                  if (!showHublPreview) setShowPreview(false);
                }}
                style={{
                  padding: "6px 12px",
                  background: showHublPreview ? "#FF7A59" : "#2d2d2d",
                  color: showHublPreview ? "#ffffff" : "#cccccc",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "13px",
                  cursor: "pointer",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <SiHubspot size={14} color={showHublPreview ? "#ffffff" : "#FF7A59"} />
                {showHublPreview ? "✓ HubL Preview" : "HubL Preview"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          overflow: "hidden",
        }}
      >
        {/* Code Editor Panel */}
        <div
          style={{
            width: (showPreview || showHublPreview) ? "0%" : "100%",
            display: (showPreview || showHublPreview) ? "none" : "flex",
            flexDirection: "row",
            transition: "width 0.3s ease",
          }}
        >

          {/* Code Editor Container */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Settings Panel (Collapsible) */}
            {showSettings && (
              <div
                style={{
                  maxHeight: "300px",
                  overflowY: "auto",
                  padding: "16px",
                  background: "var(--muted)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <h3
                  style={{
                    margin: "0 0 16px 0",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--foreground)",
                  }}
                >
                  Section Settings
                </h3>

                {/* Layout Settings */}
                <div style={{ marginBottom: "16px" }}>
                  <h4
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#374151",
                    }}
                  >
                    Layout
                  </h4>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "8px",
                      fontSize: "12px",
                    }}
                  >
                    {/* Padding */}
                    <div>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "4px",
                          color: "#6b7280",
                        }}
                      >
                        Padding
                      </label>
                      <input
                        type="number"
                        placeholder="All sides"
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          updateSection({
                            settings: {
                              ...section.settings,
                              layout: {
                                ...section.settings.layout,
                                padding: {
                                  top: val,
                                  right: val,
                                  bottom: val,
                                  left: val,
                                  unit: "px",
                                },
                              },
                            },
                          });
                        }}
                        style={{
                          width: "100%",
                          padding: "4px 8px",
                          border: "1px solid #d1d5db",
                          borderRadius: "4px",
                          fontSize: "12px",
                        }}
                      />
                    </div>

                    {/* Margin */}
                    <div>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "4px",
                          color: "#6b7280",
                        }}
                      >
                        Margin
                      </label>
                      <input
                        type="number"
                        placeholder="All sides"
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          updateSection({
                            settings: {
                              ...section.settings,
                              layout: {
                                ...section.settings.layout,
                                margin: {
                                  top: val,
                                  right: val,
                                  bottom: val,
                                  left: val,
                                  unit: "px",
                                },
                              },
                            },
                          });
                        }}
                        style={{
                          width: "100%",
                          padding: "4px 8px",
                          border: "1px solid #d1d5db",
                          borderRadius: "4px",
                          fontSize: "12px",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Background Settings */}
                <div style={{ marginBottom: "16px" }}>
                  <h4
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#374151",
                    }}
                  >
                    Background
                  </h4>

                  <div
                    style={{ display: "flex", gap: "8px", fontSize: "12px" }}
                  >
                    <select
                      value={section.settings.background.type}
                      onChange={(e) => {
                        updateSection({
                          settings: {
                            ...section.settings,
                            background: {
                              ...section.settings.background,
                              type: e.target.value as any,
                            },
                          },
                        });
                      }}
                      style={{
                        flex: 1,
                        padding: "4px 8px",
                        border: "1px solid #d1d5db",
                        borderRadius: "4px",
                        fontSize: "12px",
                      }}
                    >
                      <option value="none">None</option>
                      <option value="color">Color</option>
                      <option value="gradient">Gradient</option>
                      <option value="image">Image</option>
                    </select>

                    {section.settings.background.type === "color" && (
                      <input
                        type="color"
                        value={section.settings.background.color || "#ffffff"}
                        onChange={(e) => {
                          updateSection({
                            settings: {
                              ...section.settings,
                              background: {
                                ...section.settings.background,
                                color: e.target.value,
                              },
                            },
                          });
                        }}
                        style={{
                          width: "40px",
                          height: "28px",
                          border: "1px solid #d1d5db",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* Border Settings */}
                <div style={{ marginBottom: "16px" }}>
                  <h4
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#374151",
                    }}
                  >
                    Border
                  </h4>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "8px",
                      fontSize: "12px",
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "4px",
                          color: "#6b7280",
                        }}
                      >
                        Width
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          updateSection({
                            settings: {
                              ...section.settings,
                              border: {
                                ...section.settings.border,
                                width: {
                                  top: val,
                                  right: val,
                                  bottom: val,
                                  left: val,
                                  unit: "px",
                                },
                              },
                            },
                          });
                        }}
                        style={{
                          width: "100%",
                          padding: "4px 8px",
                          border: "1px solid #d1d5db",
                          borderRadius: "4px",
                          fontSize: "12px",
                        }}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "4px",
                          color: "#6b7280",
                        }}
                      >
                        Color
                      </label>
                      <input
                        type="color"
                        value={section.settings.border.color}
                        onChange={(e) => {
                          updateSection({
                            settings: {
                              ...section.settings,
                              border: {
                                ...section.settings.border,
                                color: e.target.value,
                              },
                            },
                          });
                        }}
                        style={{
                          width: "100%",
                          height: "28px",
                          border: "1px solid #d1d5db",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "4px",
                          color: "#6b7280",
                        }}
                      >
                        Radius
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          updateSection({
                            settings: {
                              ...section.settings,
                              border: {
                                ...section.settings.border,
                                radius: {
                                  topLeft: val,
                                  topRight: val,
                                  bottomRight: val,
                                  bottomLeft: val,
                                  unit: "px",
                                },
                              },
                            },
                          });
                        }}
                        style={{
                          width: "100%",
                          padding: "4px 8px",
                          border: "1px solid #d1d5db",
                          borderRadius: "4px",
                          fontSize: "12px",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Animation Settings */}
                <div>
                  <h4
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#374151",
                    }}
                  >
                    Animation
                  </h4>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2fr 1fr",
                      gap: "8px",
                      fontSize: "12px",
                    }}
                  >
                    <select
                      value={section.settings.animation.type}
                      onChange={(e) => {
                        updateSection({
                          settings: {
                            ...section.settings,
                            animation: {
                              ...section.settings.animation,
                              type: e.target.value as any,
                            },
                          },
                        });
                      }}
                      style={{
                        padding: "4px 8px",
                        border: "1px solid #d1d5db",
                        borderRadius: "4px",
                        fontSize: "12px",
                      }}
                    >
                      <option value="none">None</option>
                      <option value="fadeIn">Fade In</option>
                      <option value="fadeInUp">Fade In Up</option>
                      <option value="fadeInDown">Fade In Down</option>
                      <option value="slideInLeft">Slide In Left</option>
                      <option value="slideInRight">Slide In Right</option>
                      <option value="zoomIn">Zoom In</option>
                      <option value="bounce">Bounce</option>
                    </select>

                    <select
                      value={section.settings.animation.duration}
                      onChange={(e) => {
                        updateSection({
                          settings: {
                            ...section.settings,
                            animation: {
                              ...section.settings.animation,
                              duration: e.target.value as any,
                            },
                          },
                        });
                      }}
                      style={{
                        padding: "4px 8px",
                        border: "1px solid #d1d5db",
                        borderRadius: "4px",
                        fontSize: "12px",
                      }}
                    >
                      <option value="fast">Fast</option>
                      <option value="normal">Normal</option>
                      <option value="slow">Slow</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Code Editor Top Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: isMobile ? "8px 12px" : "8px 16px",
                background: "#2d2d2d",
                borderBottom: "1px solid #3e3e3e",
                position: "relative",
              }}
            >
              {/* Toggle Buttons (left side) */}
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                {/* Toggle Project Sidebar */}
                <button
                  onClick={() => setShowProjectSidebar(!showProjectSidebar)}
                  title={showProjectSidebar ? "Hide Projects" : "Show Projects"}
                  style={{
                    padding: "4px 8px",
                    background: showProjectSidebar ? "#2d2d2d" : "transparent",
                    border: "1px solid #3e3e3e",
                    borderRadius: "4px",
                    color: showProjectSidebar ? "#ffffff" : "#888",
                    fontSize: "11px",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  📦
                </button>

                {/* Toggle File Tree */}
                <button
                  onClick={() => setShowFileTree(!showFileTree)}
                  title={showFileTree ? "Hide Files" : "Show Files"}
                  style={{
                    padding: "4px 8px",
                    background: showFileTree ? "#2d2d2d" : "transparent",
                    border: "1px solid #3e3e3e",
                    borderRadius: "4px",
                    color: showFileTree ? "#ffffff" : "#888",
                    fontSize: "11px",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  📁
                </button>
              </div>

              {/* Current file display */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "12px" }}>
                <span style={{
                  fontSize: isMobile ? "14px" : "13px",
                  color: "#ffffff",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}>
                  {(() => {
                    const isPlugin = fileGroups.activeGroup?.isPlugin;
                    const isPhpWidget = fileGroups.activeGroup?.type === 'php';
                    const isHubSpotModule = fileGroups.activeGroup?.type === 'hubspot';
                    const pluginSlug = fileGroups.activeGroup?.pluginSlug || 'plugin';

                    if (activeCodeTab === 'html') return (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <AiFillHtml5 size={16} color="#E34F26" />
                        index.html
                      </span>
                    );
                    if (activeCodeTab === 'css') return (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <DiCss3 size={18} color="#1572B6" />
                        {isPhpWidget ? 'widget.css' : 'styles.css'}
                      </span>
                    );
                    if (activeCodeTab === 'js') return (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <DiJavascript1 size={18} color="#F7DF1E" />
                        {isPhpWidget ? 'widget.js' : 'script.js'}
                      </span>
                    );
                    if (activeCodeTab === 'php') return (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <DiPhp size={18} color={isPlugin ? "#9B59B6" : "#777BB4"} />
                        {isPlugin ? `${pluginSlug}.php` : 'widget.php'}
                      </span>
                    );
                    if (activeCodeTab === 'hubl') return (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <SiHubspot size={16} color="#FF7A59" />
                        template.hubl
                      </span>
                    );
                    if (activeCodeTab === 'docs') return (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileText size={16} color="#4CAF50" />
                        README.md
                      </span>
                    );
                    return '';
                  })()}
                </span>

                {/* Regenerate Docs Button - Only when viewing docs tab */}
                {activeCodeTab === 'docs' && (
                  <button
                    onClick={handleRegenerateDocs}
                    disabled={isRegeneratingDocs}
                    title={isRegeneratingDocs ? "Analyzing project files..." : "Regenerate documentation with AI"}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "4px 10px",
                      background: isRegeneratingDocs ? "rgba(59, 130, 246, 0.15)" : "rgba(76, 175, 80, 0.15)",
                      border: `1px solid ${isRegeneratingDocs ? "rgba(59, 130, 246, 0.3)" : "rgba(76, 175, 80, 0.3)"}`,
                      borderRadius: "4px",
                      color: isRegeneratingDocs ? "#60a5fa" : "#4CAF50",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: isRegeneratingDocs ? "not-allowed" : "pointer",
                      transition: "all 0.2s",
                      opacity: isRegeneratingDocs ? 0.7 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (!isRegeneratingDocs) {
                        e.currentTarget.style.background = "rgba(76, 175, 80, 0.25)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isRegeneratingDocs) {
                        e.currentTarget.style.background = "rgba(76, 175, 80, 0.15)";
                      }
                    }}
                  >
                    <RefreshCw
                      size={14}
                      style={{
                        animation: isRegeneratingDocs ? 'spin 1s linear infinite' : 'none'
                      }}
                    />
                    <span style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {isRegeneratingDocs ? "Analyzing..." : "Regenerate Docs"}
                    </span>
                  </button>
                )}

                {/* Save Indicator - Only for PHP widget projects */}
                {fileGroups.activeGroup?.type === 'php' && (
                  <button
                    onClick={handleManualSave}
                    disabled={isSaving}
                    title={
                      isSaving
                        ? "Saving..."
                        : hasUnsavedChanges
                        ? "Unsaved changes (Click to save or press Cmd+S)"
                        : "All changes saved"
                    }
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "4px 10px",
                      background: isSaving
                        ? "rgba(59, 130, 246, 0.15)"
                        : hasUnsavedChanges
                        ? "rgba(251, 146, 60, 0.15)"
                        : "rgba(34, 197, 94, 0.15)",
                      border: `1px solid ${
                        isSaving
                          ? "rgba(59, 130, 246, 0.3)"
                          : hasUnsavedChanges
                          ? "rgba(251, 146, 60, 0.3)"
                          : "rgba(34, 197, 94, 0.3)"
                      }`,
                      borderRadius: "4px",
                      color: isSaving
                        ? "#60a5fa"
                        : hasUnsavedChanges
                        ? "#fb923c"
                        : "#4ade80",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: isSaving ? "default" : "pointer",
                      transition: "all 0.2s",
                      opacity: isSaving ? 0.7 : 1,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "14px",
                        lineHeight: 1,
                        animation: isSaving ? "pulse 1.5s ease-in-out infinite" : "none",
                      }}
                    >
                      {isSaving ? "⏳" : hasUnsavedChanges ? "●" : "✓"}
                    </span>
                    <span style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {isSaving ? "Saving..." : hasUnsavedChanges ? "Unsaved" : "Saved"}
                    </span>
                  </button>
                )}

                {/* WordPress Plugin Actions - Only for plugin projects */}
                {fileGroups.activeGroup?.isPlugin && (
                  <>
                    {/* Add Widget Button */}
                    <button
                      onClick={() => setShowAddWidgetDialog(true)}
                      title="Add new widget to this plugin"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "4px 10px",
                        background: "rgba(139, 92, 246, 0.15)",
                        border: "1px solid rgba(139, 92, 246, 0.3)",
                        borderRadius: "4px",
                        color: "#a78bfa",
                        fontSize: "11px",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(139, 92, 246, 0.25)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(139, 92, 246, 0.15)";
                      }}
                    >
                      <AiOutlinePlus size={14} />
                      <span style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Add Widget
                      </span>
                    </button>

                    {/* Download Plugin Button */}
                    <button
                      onClick={() => setShowPluginDownloadModal(true)}
                      title="Download plugin files"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "4px 10px",
                        background: "rgba(34, 197, 94, 0.15)",
                        border: "1px solid rgba(34, 197, 94, 0.3)",
                        borderRadius: "4px",
                        color: "#4ade80",
                        fontSize: "11px",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(34, 197, 94, 0.25)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(34, 197, 94, 0.15)";
                      }}
                    >
                      <AiOutlineDownload size={14} />
                      <span style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Download
                      </span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Code Editor with Project Sidebar + File Tree */}
            <div style={{ flex: 1, overflow: "hidden", background: "#1e1e1e", display: "flex" }}>
              {/* Project Sidebar - Works on both desktop and mobile */}
              {showProjectSidebar && (
                <ProjectSidebar
                  groups={fileGroups.groups}
                  activeGroupId={fileGroups.activeGroupId}
                  onSelectGroup={fileGroups.selectGroup}
                  onCreateGroup={() => setShowNewGroupDialog(true)}
                  onSplitHtml={() => setShowHtmlSplitter(true)}
                  onClose={() => setShowProjectSidebar(false)}
                  onRenameGroup={fileGroups.renameGroup}
                  onDuplicateGroup={fileGroups.duplicateGroup}
                  onDeleteGroup={fileGroups.deleteGroup}
                  onSaveToLibrary={fileGroups.saveToLibrary}
                />
              )}

              {/* Left File Tree Panel - Mobile & Desktop */}
              {showFileTree && (
                <div style={{
                  width: isMobile ? "100vw" : "200px",
                  height: isMobile ? "100vh" : "auto",
                  position: isMobile ? "fixed" : "relative",
                  top: isMobile ? 0 : "auto",
                  left: isMobile ? 0 : "auto",
                  zIndex: isMobile ? 9999 : "auto",
                  background: "#252526",
                  borderRight: "1px solid #3e3e3e",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden"
                }}>
                  {/* File Tree Header */}
                  <div style={{
                    padding: "8px 12px",
                    background: "#2d2d2d",
                    borderBottom: "1px solid #3e3e3e",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#888",
                    textTransform: "uppercase",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}>
                    <span>Files</span>
                    {/* Close button (mobile only) */}
                    {isMobile && (
                      <button
                        onClick={() => setShowFileTree(false)}
                        style={{
                          padding: "4px 8px",
                          background: "transparent",
                          color: "#cccccc",
                          border: "1px solid #3e3e3e",
                          borderRadius: "4px",
                          fontSize: "16px",
                          cursor: "pointer",
                          lineHeight: 1
                        }}
                        title="Close"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* File List */}
                  <div style={{ flex: 1, overflow: "auto" }}>
                    {(() => {
                      const activeGroup = fileGroups.activeGroup;
                      const isPlugin = activeGroup?.isPlugin;
                      const projectType = activeGroup?.type;

                      // For WordPress Plugins, show plugin main file + all widget files
                      if (isPlugin) {
                        const pluginSlug = activeGroup.pluginSlug || 'plugin';
                        const files = [
                          {
                            tab: 'php',
                            icon: <DiPhp size={18} color="#9B59B6" />,
                            name: `${pluginSlug}.php`,
                            lang: 'PHP',
                            isMainFile: true
                          }
                        ];

                        // Add all widget files
                        if (activeGroup.widgetFiles) {
                          Object.entries(activeGroup.widgetFiles).forEach(([widgetId, widget]) => {
                            files.push({
                              tab: `widget-${widgetId}`,
                              icon: <DiPhp size={18} color="#777BB4" />,
                              name: `${widget.slug}.php`,
                              lang: 'PHP',
                              isMainFile: false,
                              widgetId,
                              widgetName: widget.name
                            });
                          });
                        }

                        // Add Project Docs tab
                        files.push({
                          tab: 'docs',
                          icon: <FileText size={16} color="#4CAF50" />,
                          name: 'README.md',
                          lang: 'Markdown',
                          isMainFile: false
                        });

                        return files;
                      }

                      // For regular PHP widgets
                      if (projectType === 'php') {
                        return [
                          { tab: 'php', icon: <DiPhp size={18} color="#777BB4" />, name: 'widget.php', lang: 'PHP' },
                          { tab: 'css', icon: <DiCss3 size={18} color="#1572B6" />, name: 'widget.css', lang: 'CSS' },
                          { tab: 'js', icon: <DiJavascript1 size={18} color="#F7DF1E" />, name: 'widget.js', lang: 'JavaScript' },
                          { tab: 'docs', icon: <FileText size={16} color="#4CAF50" />, name: 'README.md', lang: 'Markdown' }
                        ];
                      }

                      // For HubSpot templates
                      if (projectType === 'hubspot') {
                        return [
                          { tab: 'html', icon: <AiFillHtml5 size={16} color="#E34F26" />, name: 'index.html', lang: 'HTML' },
                          { tab: 'hubl', icon: <SiHubspot size={16} color="#FF7A59" />, name: 'template.hubl', lang: 'HubL' },
                          { tab: 'docs', icon: <FileText size={16} color="#4CAF50" />, name: 'README.md', lang: 'Markdown' }
                        ];
                      }

                      // Default HTML projects
                      return [
                        { tab: 'html', icon: <AiFillHtml5 size={16} color="#E34F26" />, name: 'index.html', lang: 'HTML' },
                        { tab: 'css', icon: <DiCss3 size={18} color="#1572B6" />, name: 'styles.css', lang: 'CSS' },
                        { tab: 'js', icon: <DiJavascript1 size={18} color="#F7DF1E" />, name: 'script.js', lang: 'JavaScript' },
                        { tab: 'docs', icon: <FileText size={16} color="#4CAF50" />, name: 'README.md', lang: 'Markdown' }
                      ];
                    })().map((file) => {
                      // Check if this tab is active
                      // For widget files, check if activeWidgetId matches
                      // For regular files, check if activeCodeTab matches
                      const isActive = file.tab.startsWith('widget-')
                        ? (activeWidgetId === file.tab.replace('widget-', '') && activeCodeTab === 'php')
                        : (activeCodeTab === file.tab);

                      return (
                      <button
                        key={file.tab}
                        onClick={() => handleCodeTabChange(file.tab)}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          background: isActive ? "#2d2d2d" : "transparent",
                          border: "none",
                          borderLeft: isActive ? "2px solid #007acc" : "2px solid transparent",
                          color: isActive ? "#ffffff" : "#cccccc",
                          fontSize: "13px",
                          fontWeight: isActive ? 500 : 400,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          textAlign: "left",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.background = "#2a2d2e";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.background = "transparent";
                          }
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center" }}>{file.icon}</span>
                        <span style={{ flex: 1 }}>{file.name}</span>
                      </button>
                      );
                    })}

                    {/* Preview Buttons - After file list (Desktop & Mobile) */}
                    <div style={{
                      padding: "8px",
                      borderTop: "1px solid #3e3e3e",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px"
                    }}>
                      {/* HTML Preview Button */}
                      <button
                        onClick={() => {
                          setShowPreview(!showPreview);
                          if (!showPreview) setShowHublPreview(false);
                          if (isMobile) setShowFileTree(false); // Close file tree after clicking on mobile
                        }}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          background: showPreview ? "#10b981" : "#2d2d2d",
                          color: showPreview ? "#ffffff" : "#cccccc",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "13px",
                          cursor: "pointer",
                          fontWeight: 500,
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <AiFillHtml5 size={16} color={showPreview ? "#ffffff" : "#E34F26"} />
                        <span style={{ flex: 1, textAlign: "left" }}>
                          {showPreview ? "✓ Preview HTML" : "Preview HTML"}
                        </span>
                      </button>

                      {/* HubL Preview Button - Only for HubSpot projects */}
                      {fileGroups.activeGroup?.type === 'hubspot' && editorHubl && (
                        <button
                          onClick={() => {
                            setShowHublPreview(!showHublPreview);
                            if (!showHublPreview) setShowPreview(false);
                            if (isMobile) setShowFileTree(false); // Close file tree after clicking on mobile
                          }}
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            background: showHublPreview ? "#FF7A59" : "#2d2d2d",
                            color: showHublPreview ? "#ffffff" : "#cccccc",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "13px",
                            cursor: "pointer",
                            fontWeight: 500,
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <SiHubspot size={16} color={showHublPreview ? "#ffffff" : "#FF7A59"} />
                          <span style={{ flex: 1, textAlign: "left" }}>
                            {showHublPreview ? "✓ HubL Preview" : "HubL Preview"}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Editor Area */}
              <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                {/* Accept/Decline Diff Buttons */}
                {showDiffPreview && diffData && (
                  <div style={{
                    padding: '12px 16px',
                    background: '#2d2d2d',
                    borderBottom: '1px solid #3e3e42',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}>
                    <span style={{ fontSize: '13px', color: '#cccccc' }}>
                      Review changes for {diffData.file.toUpperCase()}
                    </span>
                    {diffData.stats && (
                      <span style={{ fontSize: '12px', color: '#858585' }}>
                        ({diffData.stats.durationMs}ms)
                      </span>
                    )}
                    <div style={{ flex: 1 }} />
                    <button
                      onClick={handleDeclineDiff}
                      style={{
                        padding: '6px 16px',
                        background: 'transparent',
                        border: '1px solid #3e3e42',
                        borderRadius: '4px',
                        color: '#cccccc',
                        fontSize: '13px',
                        cursor: 'pointer',
                        fontWeight: 500,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#2a2d2e'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      Decline
                    </button>
                    <button
                      onClick={handleAcceptDiff}
                      style={{
                        padding: '6px 16px',
                        background: '#16a34a',
                        border: 'none',
                        borderRadius: '4px',
                        color: '#ffffff',
                        fontSize: '13px',
                        cursor: 'pointer',
                        fontWeight: 500,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#15803d'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#16a34a'; }}
                    >
                      Accept Changes
                    </button>
                  </div>
                )}

                {/* File Path Header */}
                {!showDiffPreview && (
                  <div style={{
                    padding: '8px 16px',
                    background: '#1e1e1e',
                    borderBottom: '1px solid #3e3e3e',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '13px',
                    color: '#cccccc',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
                  }}>
                    <span style={{ opacity: 0.7 }}>
                      {activeCodeTab === 'html' && 'index.html'}
                      {activeCodeTab === 'css' && 'styles.css'}
                      {activeCodeTab === 'js' && 'script.js'}
                      {activeCodeTab === 'php' && (
                        activeWidgetId
                          ? fileGroups.activeGroup?.widgetFiles?.[activeWidgetId]?.slug + '.php'
                          : 'widget.php'
                      )}
                      {activeCodeTab === 'hubl' && 'template.hubl'}
                      {activeCodeTab === 'docs' && 'README.md'}
                    </span>
                    <span style={{ fontSize: '11px', opacity: 0.5 }}>
                      {activeCodeTab === 'html' && 'HTML'}
                      {activeCodeTab === 'css' && 'CSS'}
                      {activeCodeTab === 'js' && 'JavaScript'}
                      {activeCodeTab === 'php' && 'PHP'}
                      {activeCodeTab === 'hubl' && 'HubL Template'}
                      {activeCodeTab === 'docs' && 'Markdown'}
                    </span>
                  </div>
                )}

                {/* Debug: Log editor value */}
                {console.log(
                  `📝 Editor rendering - ${activeCodeTab}:`,
                  section[activeCodeTab]?.substring(0, 100) || "(empty)",
                )}

                {/* Show DiffEditor when previewing, otherwise show regular Editor */}
                {showDiffPreview && diffData && diffData.file === activeCodeTab ? (
                  <DiffEditor
                    height="100%"
                    language={
                      activeCodeTab === "js"
                        ? "javascript"
                        : activeCodeTab === "php"
                        ? "php"
                        : activeCodeTab === "hubl"
                        ? "html" // HubL uses HTML-like syntax
                        : activeCodeTab
                    }
                    theme={theme === "dark" ? "vs-dark" : "light"}
                    original={diffData.originalCode}
                    modified={diffData.mergedCode}
                    options={{
                      fontSize: isMobile ? 16 : 14,
                      minimap: { enabled: false },
                      lineNumbers: isMobile ? "off" : "on",
                      scrollBeyondLastLine: false,
                      wordWrap: "on",
                      automaticLayout: true,
                      renderSideBySide: !isMobile, // Inline diff on mobile
                      readOnly: true,
                    }}
                  />
                ) : activeCodeTab === "docs" ? (
                  // Project Manifest (Markdown) - Uses Monaco Editor
                  <Editor
                    key={`docs-${fileGroups.activeGroup?.id}`}
                    height="100%"
                    language="markdown"
                    theme={theme === "dark" ? "vs-dark" : "light"}
                    value={fileGroups.activeGroup?.projectManifest || ''}
                    onChange={(value) => {
                      if (fileGroups.activeGroup && value !== undefined) {
                        fileGroups.updateGroup(fileGroups.activeGroup.id, { projectManifest: value });
                      }
                    }}
                    onMount={(editor) => {
                      docsEditorRef.current = editor;
                      setEditorsReady(prev => ({ ...prev, docs: true }));
                      console.log('✅ Docs editor mounted and ready');
                    }}
                    options={{
                      fontSize: isMobile ? 16 : 14,
                      minimap: { enabled: !isMobile },
                      lineNumbers: isMobile ? "off" : "on",
                      scrollBeyondLastLine: false,
                      wordWrap: "on",
                      automaticLayout: true,
                    }}
                  />
                ) : (
                  <Editor
                key={`${activeCodeTab}-${activeWidgetId || 'main'}`} // Force remount when switching files
                height="100%"
                language={
                  activeCodeTab === "js"
                    ? "javascript"
                    : activeCodeTab === "php"
                    ? "php"
                    : activeCodeTab === "hubl"
                    ? "html" // HubL uses HTML-like syntax
                    : activeCodeTab
                }
                theme={theme === "dark" ? "vs-dark" : "light"}
                value={
                  activeCodeTab === "html"
                    ? editorHtml
                    : activeCodeTab === "css"
                    ? editorCss
                    : activeCodeTab === "js"
                    ? editorJs
                    : activeCodeTab === "php"
                    ? editorPhp
                    : activeCodeTab === "hubl"
                    ? editorHubl
                    : ""
                }
                onChange={(value) => {
                  // Auto-detect PHP code and redirect to php tab
                  if (activeCodeTab === "html" && value && value.trim().startsWith('<?php')) {
                    console.log('🔧 PHP code detected in HTML editor, redirecting to widget.php');
                    updateSection({ php: value || "", html: "" });
                    handleCodeTabChange('php');
                  } else {
                    updateSection({ [activeCodeTab]: value || "" });
                  }
                }}
                onMount={(editor, monaco) => {
                  // Store editor instance in appropriate ref based on active tab
                  if (activeCodeTab === 'html') {
                    htmlEditorRef.current = editor;
                    setEditorsReady(prev => ({ ...prev, html: true }));
                    console.log('✅ HTML editor mounted and ready');
                  } else if (activeCodeTab === 'css') {
                    cssEditorRef.current = editor;
                    setEditorsReady(prev => ({ ...prev, css: true }));
                    console.log('✅ CSS editor mounted and ready');
                  } else if (activeCodeTab === 'js') {
                    jsEditorRef.current = editor;
                    setEditorsReady(prev => ({ ...prev, js: true }));
                    console.log('✅ JS editor mounted and ready');
                  } else if (activeCodeTab === 'php') {
                    phpEditorRef.current = editor;
                    setEditorsReady(prev => ({ ...prev, php: true }));
                    console.log('✅ PHP editor mounted and ready');
                  } else if (activeCodeTab === 'hubl') {
                    hublEditorRef.current = editor;
                    setEditorsReady(prev => ({ ...prev, hubl: true }));
                    console.log('✅ HubL editor mounted and ready');
                  }

                  // Notify parent that editors are ready
                  if (onEditorReady) {
                    onEditorReady({
                      html: htmlEditorRef.current,
                      css: cssEditorRef.current,
                      js: jsEditorRef.current,
                      php: phpEditorRef.current,
                      hubl: hublEditorRef.current,
                    });
                  }

                  // Register CSS variable autocomplete (only for CSS tab)
                  if (activeCodeTab === "css") {
                    monaco.languages.registerCompletionItemProvider("css", {
                      provideCompletionItems: (model, position) => {
                        const textUntilPosition = model.getValueInRange({
                          startLineNumber: position.lineNumber,
                          startColumn: 1,
                          endLineNumber: position.lineNumber,
                          endColumn: position.column,
                        });

                        // Trigger on "var(" or "--"
                        const shouldTrigger =
                          textUntilPosition.includes("var(") ||
                          textUntilPosition.match(/--[\w-]*$/);
                        if (!shouldTrigger) return { suggestions: [] };

                        const suggestions = cssVariables.map((variable) => ({
                          label: variable.name,
                          kind: monaco.languages.CompletionItemKind.Variable,
                          insertText: textUntilPosition.includes("var(")
                            ? variable.name + ")"
                            : variable.name,
                          detail: variable.value,
                          documentation: `CSS Variable: ${variable.name} = ${variable.value}`,
                        }));

                        return { suggestions };
                      },
                    });
                  }
                }}
                options={{
                  fontSize: isMobile ? 16 : 14, // Larger font on mobile for better readability
                  minimap: { enabled: false },
                  lineNumbers: isMobile ? "off" : "on", // Hide line numbers on mobile to save space
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  automaticLayout: true,
                  tabSize: 2,
                  insertSpaces: true,
                  suggestOnTriggerCharacters: !isMobile, // Disable auto-suggestions on mobile
                  quickSuggestions: activeCodeTab === "css" && !isMobile,
                  // Mobile-specific improvements
                  scrollbar: {
                    vertical: isMobile ? "auto" : "visible",
                    horizontal: isMobile ? "auto" : "visible",
                    verticalScrollbarSize: isMobile ? 10 : 14,
                    horizontalScrollbarSize: isMobile ? 10 : 14,
                  },
                  padding: {
                    top: isMobile ? 12 : 8,
                    bottom: isMobile ? 12 : 8,
                  },
                  lineDecorationsWidth: isMobile ? 0 : 10, // Remove left gutter decoration on mobile
                  lineNumbersMinChars: isMobile ? 0 : 3,
                  glyphMargin: !isMobile, // Remove glyph margin on mobile
                  folding: !isMobile, // Disable code folding on mobile
                  renderLineHighlight: isMobile ? "none" : "line", // Cleaner look on mobile
                  occurrencesHighlight: !isMobile, // Reduce visual noise on mobile
                  overviewRulerLanes: isMobile ? 0 : 3, // Hide overview ruler on mobile
                }}
              />
                )}

              {/* Generating Indicator - Bottom Right Corner */}
              {isGenerating && (
                <div style={{
                  position: 'absolute',
                  bottom: '16px',
                  right: '16px',
                  padding: '8px 16px',
                  background: 'var(--foreground)',
                  color: 'var(--background)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 500,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  zIndex: 1000,
                  pointerEvents: 'none',
                  border: '1px solid var(--border)',
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#10b981',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }} />
                  Generating {generatingPhase?.toUpperCase()}... ({generatingTokens.toLocaleString()} tokens)
                  <style>{`
                    @keyframes pulse {
                      0%, 100% { opacity: 1; transform: scale(1); }
                      50% { opacity: 0.6; transform: scale(0.9); }
                    }
                  `}</style>
                </div>
              )}
              </div>
            </div>
          </div>
        </div>

        {/* Preview Panel - Resizable Split View (Code | Preview) */}
        {showPreview && !showHublPreview && (
          <div
            id="html-preview-split-container"
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              background: "var(--background)",
              height: "100%",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "8px 12px",
                background: "var(--muted)",
                borderBottom: "1px solid var(--border)",
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--foreground)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>HTML Preview {inspectSplitView ? '(Split View)' : '(Full View)'}</span>
              <div style={{ display: "flex", gap: "8px" }}>
                {onEditElementInChat && (
                  <>
                    <button
                      onClick={() => {
                        const newMode = !inspectMode;
                        console.log('🔘 Inspect button clicked! New mode:', newMode);
                        setInspectMode(newMode);
                      }}
                      style={{
                        padding: "4px 12px",
                        background: inspectMode ? "#3b82f6" : "#6b7280",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "4px",
                        fontSize: "12px",
                        cursor: "pointer",
                        fontWeight: 500,
                      }}
                    >
                      {inspectMode ? "🔍 Inspecting..." : "🔍 Inspect"}
                    </button>
                    {inspectMode && (
                      <button
                        onClick={() => setInspectSplitView(!inspectSplitView)}
                        style={{
                          padding: "4px 12px",
                          background: inspectSplitView ? "#10b981" : "#6b7280",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "4px",
                          fontSize: "12px",
                          cursor: "pointer",
                          fontWeight: 500,
                        }}
                      >
                        {inspectSplitView ? "⊞ Split View" : "▢ Full View"}
                      </button>
                    )}
                  </>
                )}
                <button
                  onClick={() => setShowPreview(false)}
                  style={{
                    padding: "4px 8px",
                    background: "#000000",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "12px",
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {/* Panel Content - Split View or Full View */}
            {inspectSplitView ? (
              // Split View Mode (Code | Preview)
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "row",
                  overflow: "hidden",
                }}
              >
                {/* Left Panel - Code Editor */}
                <div
                  style={{
                    width: `${previewSplitWidth}%`,
                    display: "flex",
                    flexDirection: "column",
                    background: "var(--background)",
                    overflow: "hidden",
                  }}
                >
                  {/* Code Tab Selector */}
                  <div
                    style={{
                      display: "flex",
                      gap: "4px",
                      padding: "8px",
                      background: "var(--muted)",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {["html", "css", "js"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => handleCodeTabChange(tab as "html" | "css" | "js")}
                        style={{
                          padding: "4px 12px",
                          background: activeCodeTab === tab ? "var(--primary)" : "transparent",
                          color: activeCodeTab === tab ? "#ffffff" : "var(--foreground)",
                          border: "none",
                          borderRadius: "4px",
                          fontSize: "12px",
                          cursor: "pointer",
                          fontWeight: 500,
                        }}
                      >
                        {tab.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  {/* Monaco Editor */}
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <Editor
                      key={activeCodeTab}
                      defaultLanguage={activeCodeTab === "js" ? "javascript" : activeCodeTab}
                      value={
                        activeCodeTab === "html"
                          ? editorHtml
                          : activeCodeTab === "css"
                          ? editorCss
                          : editorJs
                      }
                      onChange={(value) => {
                        const newValue = value || "";
                        if (activeCodeTab === "html") {
                          setEditorHtml(newValue);
                        } else if (activeCodeTab === "css") {
                          setEditorCss(newValue);
                        } else if (activeCodeTab === "js") {
                          setEditorJs(newValue);
                        }
                      }}
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: false },
                        fontSize: 13,
                        lineNumbers: "on",
                        scrollBeyondLastLine: false,
                        wordWrap: "on",
                        automaticLayout: true,
                      }}
                    />
                  </div>
                </div>

                {/* Resizable Divider */}
                <div
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setPreviewDragging(true);
                  }}
                  style={{
                    width: "4px",
                    background: "var(--border)",
                    cursor: "ew-resize",
                    flexShrink: 0,
                    position: "relative",
                    transition: previewDragging ? "none" : "background 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (!previewDragging) {
                      e.currentTarget.style.background = "var(--primary)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!previewDragging) {
                      e.currentTarget.style.background = "var(--border)";
                    }
                  }}
                >
                  {/* Visual handle indicator */}
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      width: "3px",
                      height: "40px",
                      background: previewDragging ? "var(--primary)" : "var(--muted-foreground)",
                      borderRadius: "2px",
                      opacity: 0.5,
                      transition: "opacity 0.2s",
                    }}
                  />
                </div>

                {/* Right Panel - Live Preview */}
                <div
                  style={{
                    width: `${100 - previewSplitWidth}%`,
                    display: "flex",
                    flexDirection: "column",
                    background: "#ffffff",
                    overflow: "hidden",
                  }}
                >
                  <iframe
                    ref={previewIframeRef}
                    srcDoc={generatePreviewHTML()}
                    style={{
                      flex: 1,
                      border: "none",
                      width: "100%",
                    }}
                    sandbox="allow-scripts allow-same-origin"
                    title="Section Preview"
                    onLoad={() => {
                      console.log('🔍 Preview iframe loaded, ready for inspection');
                    }}
                  />
                </div>
              </div>
            ) : (
              // Full View Mode (Preview only)
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  background: "#ffffff",
                  overflow: "hidden",
                }}
              >
                <iframe
                  ref={previewIframeRef}
                  srcDoc={generatePreviewHTML()}
                  style={{
                    flex: 1,
                    border: "none",
                    width: "100%",
                  }}
                  sandbox="allow-scripts allow-same-origin"
                  title="Section Preview"
                  onLoad={() => {
                    console.log('🔍 Preview iframe loaded, ready for inspection');
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* HubL Interactive Preview - Split Panel */}
        {showHublPreview && editorHubl && (
          <HublPreviewPanel
            html={editorHtml}
            hubl={editorHubl}
            css={editorCss}
            onClose={() => setShowHublPreview(false)}
          />
        )}

      </div>

      {/* In-Progress Overlay */}
      {isConverting && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              background: "var(--card)",
              borderRadius: "12px",
              padding: "32px",
              maxWidth: "400px",
              textAlign: "center",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            }}
          >
            {/* Animated spinner */}
            <div
              style={{
                width: "60px",
                height: "60px",
                border: "4px solid var(--muted)",
                borderTop: "4px solid var(--primary)",
                borderRadius: "50%",
                margin: "0 auto 24px",
                animation: "spin 1s linear infinite",
              }}
            />

            <h3
              style={{
                margin: "0 0 12px 0",
                fontSize: "20px",
                fontWeight: 600,
                color: "var(--foreground)",
              }}
            >
              Converting to Widget
            </h3>

            <p
              style={{
                margin: 0,
                fontSize: "14px",
                color: "var(--muted-foreground)",
                lineHeight: "1.6",
              }}
            >
              {conversionProgress}
            </p>

            <style jsx global>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        </div>
      )}

      {/* Completion Modal */}
      {showCompletionModal && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              background: "var(--card)",
              borderRadius: "12px",
              padding: "32px",
              maxWidth: "500px",
              width: "90%",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            }}
          >
            {/* Success icon */}
            <div
              style={{
                width: "60px",
                height: "60px",
                background: "#10b981",
                borderRadius: "50%",
                margin: "0 auto 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "32px",
              }}
            >
              ✓
            </div>

            <h3
              style={{
                margin: "0 0 12px 0",
                fontSize: "24px",
                fontWeight: 600,
                color: "var(--foreground)",
                textAlign: "center",
              }}
            >
              Widget Created Successfully!
            </h3>

            <p
              style={{
                margin: "0 0 24px 0",
                fontSize: "15px",
                color: "var(--muted-foreground)",
                textAlign: "center",
                lineHeight: "1.6",
              }}
            >
              {convertedWidgetName ? `"${convertedWidgetName}"` : 'Your widget'} is ready to deploy.{' '}
              All HTML elements now have comprehensive Elementor controls.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* Deploy to Playground button */}
              {onSwitchToPlayground && (
                <button
                  onClick={async () => {
                    setShowCompletionModal(false);

                    // Validate PHP code exists before deployment
                    if (!editorPhp || editorPhp.trim() === '') {
                      alert('❌ No PHP widget code found. Please generate a widget first.');
                      return;
                    }

                    try {
                      const result = await window.deployElementorWidget(editorPhp, editorCss, editorJs);
                      // Switch to Playground tab
                      if (onSwitchToPlayground) {
                        onSwitchToPlayground();
                      }
                      alert(`✅ ${result.message}\n\nYour widget is now active in WordPress!\n\nGo to an Elementor page and find "${result.widgetClassName}" in the Hustle Tools category.`);
                    } catch (error: any) {
                      alert(`❌ Deployment failed: ${error.message}`);
                    }
                  }}
                  style={{
                    padding: "14px 24px",
                    background: "#7c3aed",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "15px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#6d28d9";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#7c3aed";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  🚀 Deploy & Open WordPress Playground
                </button>
              )}

              {/* Review Code button */}
              <button
                onClick={() => setShowCompletionModal(false)}
                style={{
                  padding: "12px 24px",
                  background: "var(--muted)",
                  color: "var(--foreground)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Review Widget Code
              </button>
            </div>

            {/* Info note */}
            <p
              style={{
                margin: "20px 0 0 0",
                fontSize: "12px",
                color: "var(--muted-foreground)",
                textAlign: "center",
                lineHeight: "1.5",
              }}
            >
              💡 Your HTML preview is preserved! The widget.php file is in a separate tab.{' '}
              CSS and JS are embedded in the widget for deployment.
            </p>
          </div>
        </div>
      )}

      {/* Save to Library Dialog */}
      {showSaveDialog && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "var(--card)",
              borderRadius: "8px",
              padding: "24px",
              width: "90%",
              maxWidth: "550px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h2
              style={{
                margin: "0 0 8px 0",
                fontSize: "20px",
                fontWeight: 600,
              }}
            >
              💾 Save to Library
            </h2>

            <p style={{ margin: "0 0 20px 0", fontSize: "14px", color: "var(--muted-foreground)" }}>
              Save this project to your library for easy access later
            </p>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: 500,
                }}
              >
                Project Name
              </label>
              <input
                type="text"
                value={section.name}
                onChange={(e) => updateSection({ name: e.target.value })}
                placeholder="e.g., Pricing Table, Hero Section"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  fontSize: "14px",
                  background: "var(--background)",
                  color: "var(--foreground)",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "space-between",
              }}
            >
              <button
                onClick={() => setShowSaveDialog(false)}
                style={{
                  padding: "10px 20px",
                  background: "transparent",
                  color: "var(--muted-foreground)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  fontSize: "14px",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  try {
                    if (!section.name.trim()) {
                      alert("Please enter a project name");
                      return;
                    }

                    // Save to file groups library (project library)
                    const projectType = editorPhp ? 'php' : 'html';
                    const newGroup = fileGroups.createNewGroup(section.name, projectType);

                    // Update the group with current content
                    fileGroups.updateGroupFile(newGroup.id, 'html', editorHtml);
                    fileGroups.updateGroupFile(newGroup.id, 'css', editorCss);
                    fileGroups.updateGroupFile(newGroup.id, 'js', editorJs);
                    if (editorPhp) {
                      fileGroups.updateGroupFile(newGroup.id, 'php', editorPhp);
                    }

                    alert(`✅ Project "${section.name}" saved to library!`);
                    setShowSaveDialog(false);
                  } catch (error: any) {
                    alert(`❌ Failed to save project:\n\n${error.message}`);
                  }
                }}
                style={{
                  padding: "10px 24px",
                  background: "#000000",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "14px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                💾 Save to Library
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Group Dialog */}
      {showNewGroupDialog && (
        <NewGroupDialog
          onClose={() => setShowNewGroupDialog(false)}
          onCreate={(name, type, template) => {
            let newGroup;

            if (type === 'plugin') {
              // For plugin type, create a WordPress plugin instead of regular group
              // Extract description from template parameter (we'll pass it specially)
              const description = template !== 'empty' ? template : undefined;
              newGroup = fileGroups.createNewPlugin(name, description);
              console.log('🔌 Created WordPress Plugin:', name);
            } else {
              // For other types, use regular createNewGroup
              newGroup = fileGroups.createNewGroup(name, type as 'html' | 'php' | 'hubspot', template);
              console.log('📦 Created Project:', name, 'Type:', type);
            }

            fileGroups.selectGroup(newGroup.id);
            setShowNewGroupDialog(false);
          }}
        />
      )}

      {/* HTML Splitter Dialog */}
      {showHtmlSplitter && (
        <HtmlSplitter
          onClose={() => setShowHtmlSplitter(false)}
          onImport={(sections) => {
            // Create a new file group for each selected section
            sections.forEach((section, index) => {
              const sectionName = section.classes.length > 0
                ? section.classes[0] // Use first class as name
                : `${section.type}-${index + 1}`; // Fallback to type + index

              const newGroup = fileGroups.createNewGroup(
                sectionName,
                'html', // All imported sections are HTML type
                'empty'
              );

              // Set the HTML content for this group
              fileGroups.updateGroupFile(newGroup.id, 'html', section.html);

              // If it's the first section, make it active
              if (index === 0) {
                fileGroups.selectGroup(newGroup.id);
              }
            });

            setShowHtmlSplitter(false);
            alert(`✅ Created ${sections.length} project${sections.length === 1 ? '' : 's'} from HTML page`);
          }}
        />
      )}

      {/* Batch Widget Converter Dialog */}
      {showBatchConverter && (
        <BatchWidgetConverter
          groups={fileGroups.groups}
          onClose={() => setShowBatchConverter(false)}
          onConvert={async (groupId) => {
            const group = fileGroups.groups.find(g => g.id === groupId);
            if (!group) {
              throw new Error('Group not found');
            }

            // Use programmatic Quick Widget converter
            const { widgetPhp, widgetCss, widgetJs } = await convertToWidgetProgrammatic(
              group.html,
              group.css,
              group.js,
              {
                metadata: {
                  name: group.name.toLowerCase().replace(/\s+/g, '_'),
                  title: group.name,
                },
                useAIForMetadata: true // Use AI for naming
              }
            );

            // Update group to PHP type with generated widget and scoped CSS
            fileGroups.updateGroupFile(groupId, 'php', widgetPhp);
            fileGroups.updateGroupFile(groupId, 'css', widgetCss); // SCOPED CSS
            fileGroups.updateGroupFile(groupId, 'js', widgetJs);

            // Extract widget name from PHP (look for get_name() return value)
            const nameMatch = widgetPhp.match(/return\s+['"]([^'"]+)['"]/);
            const widgetName = nameMatch ? nameMatch[1] : group.name;

            return { widgetName };
          }}
        />
      )}

      {/* Widget Validation Modal */}
      <WidgetValidationModal
        isOpen={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        validationResult={validationResult}
        isValidating={isValidating}
        widgetName={convertedWidgetName}
        onFixIssues={() => {
          if (!validationResult || !onSendChatMessage) return;

          // Build detailed message from failed checks
          const failedChecks = validationResult.checks.filter(c => !c.passed);
          const message = `🔧 Fix Widget Validation Issues

**Widget:** ${convertedWidgetName}
**Overall Score:** ${validationResult.overallScore}%

**Failed Checks:**
${failedChecks.map((check, i) => `
${i + 1}. **${check.requirement}** [${check.severity.toUpperCase()}]
   ${check.details}
`).join('\n')}

**Instructions:**
Please fix all the failed validation checks in the current PHP widget file. Use the editCodeWithMorph tool to make targeted fixes.`;

          // Send to chat
          onSendChatMessage(message);

          // Show chat if hidden
          if (!chatVisible && setChatVisible) {
            setChatVisible(true);
          }
        }}
      />

      {/* Generate Project Modal */}
      <GenerateProjectModal
        isOpen={showGenerateModal}
        onClose={() => {
          setShowGenerateModal(false);
          setGenerateModalConversionMode(false);
        }}
        onGenerationStart={() => {
          // Modal will close and generation will start
          // Set generating state so indicator shows
          setIsGenerating(true);
          setGeneratingPhase('html'); // Default to HTML phase
          console.log('🎬 Generation starting from modal');
        }}
        onGenerationEnd={() => {
          // Generation finished
          setIsGenerating(false);
          setGeneratingPhase(null);
          setShowGenerationComplete(true);
          console.log('🏁 Generation ended from modal');

          // Auto-hide completion notification after 3 seconds
          setTimeout(() => {
            setShowGenerationComplete(false);
          }, 3000);
        }}
        defaultModel={undefined}
        globalCSS={globalCss} // Pass global CSS for context
        existingCode={generateModalConversionMode ? {
          html: editorHtml,
          css: editorCss,
          js: editorJs,
        } : undefined}
        isEditorReady={(fileType) => {
          // Check if specific editor is mounted and ready
          return editorsReady[fileType as keyof typeof editorsReady] || false;
        }}
        onProjectCreate={(name, type) => {
          // Create new project and return its ID
          const newGroup = fileGroups.createNewGroup(name, type, 'empty');
          fileGroups.selectGroup(newGroup.id);
          console.log('📦 Project created:', name, 'Type:', type, 'ID:', newGroup.id);

          // Start generating state
          setIsGenerating(true);
          setGeneratingPhase(type === 'php' ? 'php' : 'html');
          console.log('🚀 Generation started! isGenerating=true, phase=', type === 'php' ? 'php' : 'html');

          // Auto-switch to the first tab
          if (type === 'php') {
            onCodeTabChange?.('php');
          } else {
            onCodeTabChange?.('html');
          }

          return newGroup.id;
        }}
        onProjectUpdate={(projectId, file, content) => {
          // Update project file with streaming content
          fileGroups.updateGroupFile(projectId, file, content);

          // Update current generating phase and auto-switch tabs
          if (content && content.trim().length > 0) {
            const tokens = Math.ceil(content.length / 4); // Estimate: 1 token ≈ 4 characters
            console.log(`📝 Streaming ${file} (${content.length} chars, ~${tokens.toLocaleString()} tokens)`);

            // Switch to the active file tab (include hubl)
            if (file === 'html' || file === 'css' || file === 'js' || file === 'php' || file === 'hubl') {
              setGeneratingPhase(file);
              setGeneratingTokens(tokens);
              // Only switch tabs for standard files (not hubl, since there's no hubl tab)
              if (file !== 'hubl') {
                onCodeTabChange?.(file);
              }
            }

            // Stream into Monaco editor in real-time using pushEditOperations
            // This provides smooth streaming like README regeneration
            const editorRef = file === 'html' ? htmlEditorRef :
                             file === 'css' ? cssEditorRef :
                             file === 'js' ? jsEditorRef :
                             file === 'php' ? phpEditorRef :
                             file === 'hubl' ? hublEditorRef : null;

            if (editorRef?.current) {
              const model = editorRef.current.getModel();
              if (model) {
                // Replace all content with new streamed content
                const fullRange = model.getFullModelRange();
                model.pushEditOperations(
                  [],
                  [{
                    range: fullRange,
                    text: content
                  }],
                  () => null
                );
                console.log(`✨ Streamed ${content.length} chars to ${file} editor via pushEditOperations`);
              } else {
                console.warn(`⚠️ ${file} editor model not available, falling back to updateContent`);
                updateContent(file, content);
              }
            } else {
              console.warn(`⚠️ ${file} editor ref not available, falling back to updateContent`);
              updateContent(file, content);
            }
          }
        }}
        onGenerate={(code) => {
          // Project is already created and populated via onProjectCreate/onProjectUpdate
          // This callback is just for final actions

          const isElementorWidget = code.php && code.php.length > 0;

          console.log('✅ Generation complete!', { isElementorWidget });

          // End generating state
          setIsGenerating(false);
          setGeneratingPhase(null);

          // Show completion notification
          setShowGenerationComplete(true);

          // Auto-hide after 3 seconds
          setTimeout(() => {
            setShowGenerationComplete(false);
          }, 3000);

          if (isElementorWidget) {
            // Switch to PHP tab to show generated widget
            onCodeTabChange?.('php');
          } else {
            // Switch to HTML tab to show generated code
            onCodeTabChange?.('html');
          }
        }}
      />

      {/* Element Inspector Modal */}
      <ElementInspectorModal
        elementData={inspectedElement}
        onClose={() => setInspectedElement(null)}
        onSubmit={(prompt, elementData) => {
          // Format element data as a message to send to chat
          const message = `${prompt}

Element Details:
- Selector: ${elementData.selector}
- Tag: ${elementData.tagName}
- Classes: ${elementData.classList.join(', ') || 'none'}

HTML:
\`\`\`html
${elementData.html}
\`\`\`

${Object.keys(elementData.attributes).length > 0 ? `Attributes:
${Object.entries(elementData.attributes).map(([k, v]) => `- ${k}="${v}"`).join('\n')}
` : ''}
${Object.keys(elementData.computedStyles).length > 0 ? `Computed Styles:
\`\`\`css
${Object.entries(elementData.computedStyles).map(([k, v]) => `${k}: ${v};`).join('\n')}
\`\`\`
` : ''}
Context:
${elementData.context}`;

          // Send to chat
          onSendChatMessage?.(message);
        }}
      />

      {/* Plugin Management Dialogs (NEW) */}
      <AddWidgetDialog
        open={showAddWidgetDialog}
        onOpenChange={setShowAddWidgetDialog}
        onSubmit={(widgetName, shouldGenerate) => {
          console.log('🔧 Adding widget to plugin:', widgetName, 'Generate:', shouldGenerate);

          if (!fileGroups.activeGroup?.id) {
            alert('No active plugin found');
            return;
          }

          // Close the dialog
          setShowAddWidgetDialog(false);

          if (shouldGenerate) {
            // Open the Generate Widget modal to create the widget code with AI
            setGenerateModalConversionMode(true);
            setShowGenerateModal(true);

            // Store the widget name for later use when widget is generated
            (window as any).__pendingWidgetName = widgetName;
            (window as any).__pendingPluginId = fileGroups.activeGroup.id;
          } else {
            // Create blank widget immediately
            const className = widgetName.replace(/[^a-zA-Z0-9]+/g, '_');
            const widgetSlug = widgetName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

            const blankWidgetCode = `<?php
/**
 * ${widgetName} Widget
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class ${className} extends \\Elementor\\Widget_Base {

    public function get_name() {
        return '${widgetSlug}';
    }

    public function get_title() {
        return esc_html__('${widgetName}', 'text-domain');
    }

    public function get_icon() {
        return 'eicon-code';
    }

    public function get_categories() {
        return ['general'];
    }

    protected function register_controls() {
        // Start controls section
        $this->start_controls_section(
            'content_section',
            [
                'label' => esc_html__('Content', 'text-domain'),
                'tab' => \\Elementor\\Controls_Manager::TAB_CONTENT,
            ]
        );

        // Add your controls here

        $this->end_controls_section();
    }

    protected function render() {
        $settings = $this->get_settings_for_display();
        ?>
        <div class="<?php echo esc_attr($this->get_name()); ?>">
            <!-- Add your widget HTML here -->
            <p><?php echo esc_html__('${widgetName}', 'text-domain'); ?></p>
        </div>
        <?php
    }
}`;

            // Add blank widget to plugin
            fileGroups.addWidgetToPlugin(
              fileGroups.activeGroup.id,
              widgetName,
              blankWidgetCode
            );

            console.log('✅ Created blank widget:', widgetName);
          }
        }}
        pluginName={fileGroups.activeGroup?.isPlugin ? fileGroups.activeGroup.pluginName : undefined}
      />

      <PluginNamingDialog
        open={showPluginNamingDialog}
        onOpenChange={setShowPluginNamingDialog}
        onSubmit={(pluginName, description) => {
          // Create new plugin and add pending widget if exists
          const plugin = fileGroups.createNewPlugin(pluginName, description);

          // If there's pending widget code, add it to the new plugin
          if (pendingWidgetCode) {
            const widgetName = prompt('Enter widget name:') || 'My Widget';
            fileGroups.addWidgetToPlugin(plugin.id, widgetName, pendingWidgetCode);
            setPendingWidgetCode(null);
          }

          // Select the new plugin
          fileGroups.selectGroup(plugin.id);
          console.log('✅ Created plugin:', pluginName);
        }}
        defaultName={fileGroups.activeGroup?.name || 'My Custom Widgets'}
      />

      <PluginDownloadModal
        open={showPluginDownloadModal}
        onOpenChange={setShowPluginDownloadModal}
        plugin={fileGroups.activeGroup?.isPlugin ? fileGroups.activeGroup : null}
      />

      {/* Generation Status Indicator - Bottom Right */}
      {isGenerating && generatingPhase && (
        <div style={{
          position: 'fixed',
          bottom: '16px',
          right: '16px',
          background: 'rgba(0, 0, 0, 0.9)',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 500,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          zIndex: 9999,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#10b981',
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
          <span>
            Generating {generatingPhase.toUpperCase()}...
            {generatingTokens > 0 && ` (${generatingTokens.toLocaleString()} tokens)`}
          </span>
          <style>{`
            @keyframes pulse {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.5; transform: scale(1.2); }
            }
          `}</style>
        </div>
      )}

      {/* Generation Complete Notification - Bottom Right */}
      {showGenerationComplete && (
        <div style={{
          position: 'fixed',
          bottom: '16px',
          right: '16px',
          background: 'rgba(16, 185, 129, 0.95)',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 500,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          zIndex: 9999,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backdropFilter: 'blur(10px)',
          animation: 'slideIn 0.3s ease-out',
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#fff',
          }} />
          <span>✓ Generation complete!</span>
          <style>{`
            @keyframes slideIn {
              from { transform: translateX(100%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
