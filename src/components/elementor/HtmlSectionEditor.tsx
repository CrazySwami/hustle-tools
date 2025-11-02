"use client";

import { useState, useEffect, useRef } from "react";
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
import { OptionsButton } from "@/components/ui/OptionsButton";
import { useEditorContent } from "@/hooks/useEditorContent";
import { ElementInspector } from "./ElementInspector";
import { HTMLGeneratorDialog } from "@/components/html-generator/HTMLGeneratorDialog";
import { convertToWidgetProgrammatic } from "@/lib/programmatic-widget-converter";
import { extractCodeFromPhp, isPhpWidget } from "@/lib/php-to-html-converter";
import { useFileGroups } from "@/hooks/useFileGroups";
import { ProjectSidebar } from "./ProjectSidebar";
import { NewGroupDialog } from "./NewGroupDialog";
import { HtmlSplitter } from "./HtmlSplitter";
import { BatchWidgetConverter } from "./BatchWidgetConverter";
import { WidgetValidationModal } from "./WidgetValidationModal";
import { GenerateProjectModal } from "./GenerateProjectModal";
import { ElementInspectorModal } from "./ElementInspectorModal";

interface HtmlSectionEditorProps {
  initialSection?: Section;
  onSectionChange?: (section: Section) => void;
  activeStyleKitCss?: string;
  streamedHtml?: string;
  streamedCss?: string;
  streamedJs?: string;
  activeCodeTab?: "html" | "css" | "js" | "php";
  onCodeTabChange?: (tab: "html" | "css" | "js" | "php") => void;
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
}: HtmlSectionEditorProps) {
  // File Groups Management
  const fileGroups = useFileGroups();
  const [showNewGroupDialog, setShowNewGroupDialog] = useState(false);
  const [showHtmlSplitter, setShowHtmlSplitter] = useState(false);
  const [showBatchConverter, setShowBatchConverter] = useState(false);
  const [showProjectSidebar, setShowProjectSidebar] = useState(true); // Show by default on desktop

  // Legacy section state (keep for backward compatibility with props)
  const [section, setSection] = useState<Section>(
    initialSection || createSection(),
  );
  const [internalActiveCodeTab, setInternalActiveCodeTab] = useState<
    "html" | "css" | "js" | "php"
  >("html");
  const [showPreview, setShowPreview] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showFileTree, setShowFileTree] = useState(true); // Show by default on desktop
  const [inspectMode, setInspectMode] = useState(false); // Track inspect mode
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

  // Diff preview state
  const [showDiffPreview, setShowDiffPreview] = useState(false);
  const [diffData, setDiffData] = useState<{
    file: 'html' | 'css' | 'js' | 'php';
    originalCode: string;
    mergedCode: string;
    usage?: any;
    stats?: any;
  } | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);
  const { globalCss, cssVariables } = useGlobalStylesheet();
  const { theme } = useTheme();

  // Global editor content state (for chat access)
  const { updateContent, setAllContent, html: editorHtml, css: editorCss, js: editorJs, php: editorPhp } = useEditorContent();

  // Deploy widget to WordPress Playground
  const handleDeployWidget = async () => {
    if (!section.php || !section.php.trim()) {
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

      // Deploy widget and create preview page
      const result = await window.deployAndPreviewWidget(section.php, editorCss, editorJs);

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

  // Hot reload state
  const [hotReloadEnabled, setHotReloadEnabled] = useState(true);
  const [lastDeployedPhp, setLastDeployedPhp] = useState('');
  const [lastDeployedCss, setLastDeployedCss] = useState('');
  const lastChangeTimeRef = useRef<number>(0);

  const handleConvertToWidget = async () => {
    if (!editorHtml.trim()) {
      alert('⚠️ No HTML content to convert. Please add HTML code first.');
      return;
    }

    if (section.php) {
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

    if (section.php) {
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
    if (!section.php || !section.php.trim()) {
      alert('⚠️ No PHP widget code to download. Generate a widget first.');
      return;
    }

    const blob = new Blob([section.php], { type: 'text/plain' });
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

  // Use external activeCodeTab if provided, otherwise use internal
  const activeCodeTab = externalActiveCodeTab ?? internalActiveCodeTab;

  const handleCodeTabChange = (tab: "html" | "css" | "js" | "php") => {
    if (onCodeTabChange) {
      onCodeTabChange(tab);
    } else {
      setInternalActiveCodeTab(tab);
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

    // Sync code changes to global state for chat access
    if ('html' in updates || 'css' in updates || 'js' in updates || 'php' in updates) {
      if ('html' in updates) updateContent('html', updates.html || '');
      if ('css' in updates) updateContent('css', updates.css || '');
      if ('js' in updates) updateContent('js', updates.js || '');
      if ('php' in updates) updateContent('php', updates.php || '');
    }
  };

  // Sync section content to global state ONLY when section ID changes (loading from library)
  // DO NOT sync on content changes - that would overwrite Morph/tool edits!
  useEffect(() => {
    setAllContent({
      html: section.html || '',
      css: section.css || '',
      js: section.js || '',
      php: section.php || ''
    });
  }, [section.id, setAllContent]);


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
    if (fileGroups.activeGroup) {
      // Load active group content into editor
      console.log('📂 Loading active group:', fileGroups.activeGroup.name);
      setAllContent({
        html: fileGroups.activeGroup.html,
        css: fileGroups.activeGroup.css,
        js: fileGroups.activeGroup.js,
        php: fileGroups.activeGroup.php || '',
      });

      // Update section for backward compatibility
      const updatedSection = {
        ...section,
        name: fileGroups.activeGroup!.name,
        html: fileGroups.activeGroup!.html,
        css: fileGroups.activeGroup!.css,
        js: fileGroups.activeGroup!.js,
        php: fileGroups.activeGroup!.php,
        id: fileGroups.activeGroup!.id,
        updatedAt: Date.now(),
      };
      console.log('📁 HtmlSectionEditor: Loading project from file groups:', {
        id: updatedSection.id,
        name: updatedSection.name,
        htmlLength: updatedSection.html?.length || 0,
        cssLength: updatedSection.css?.length || 0,
        jsLength: updatedSection.js?.length || 0,
        phpLength: updatedSection.php?.length || 0,
      });
      setSection(updatedSection);

      // Notify parent of section change (so chat context updates)
      onSectionChange?.(updatedSection);

      // Switch to appropriate tab based on group type
      if (fileGroups.activeGroup.type === 'php' && fileGroups.activeGroup.php) {
        handleCodeTabChange('php');
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
      fileGroups.updateGroupFile(fileGroups.activeGroup.id, 'html', editorHtml);
      fileGroups.updateGroupFile(fileGroups.activeGroup.id, 'css', editorCss);
      fileGroups.updateGroupFile(fileGroups.activeGroup.id, 'js', editorJs);
      if (editorPhp) {
        fileGroups.updateGroupFile(fileGroups.activeGroup.id, 'php', editorPhp);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [editorHtml, editorCss, editorJs, editorPhp, fileGroups.activeGroup?.id]);

  // Listen for select-project event from Project Library
  useEffect(() => {
    const handleSelectProject = (event: CustomEvent) => {
      const { projectId } = event.detail;
      console.log('📂 Received select-project event:', projectId);
      fileGroups.selectGroup(projectId);
    };

    window.addEventListener('select-project' as any, handleSelectProject);

    return () => {
      window.removeEventListener('select-project' as any, handleSelectProject);
    };
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
      {/* OptionsButton - Universal floating button */}
      <OptionsButton
        isMobile={isMobile}
        isVisible={isTabVisible}
        options={[
          {
            label: "🚀 Generate New Project",
            onClick: () => {
              setGenerateModalConversionMode(false);
              setShowGenerateModal(true);
            },
            divider: true,
          },
          {
            label: "💾 Save to Library",
            onClick: () => setShowSaveDialog(true),
          },
          {
            label: "⚡ Convert to Elementor Widget",
            onClick: () => {
              setGenerateModalConversionMode(true);
              setShowGenerateModal(true);
            },
            disabled: !editorHtml.trim(),
            divider: true,
          },
          ...(section.php ? [{
            label: "🚀 Deploy to WordPress",
            onClick: handleDeployWidget,
            divider: true,
          }] : []),
          ...(section.php ? [{
            label: "✅ Validate Widget Code",
            onClick: async () => {
              if (!section.php) return;

              setShowValidationModal(true);
              setIsValidating(true);

              try {
                const validationResponse = await fetch('/api/validate-widget', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    widgetPhp: section.php,
                    widgetName: section.name || 'widget',
                    widgetTitle: section.name || 'Widget',
                  }),
                });

                if (validationResponse.ok) {
                  const validationData = await validationResponse.json();
                  setValidationResult(validationData);
                }
              } catch (error: any) {
                console.error('Validation failed:', error);
                alert(`❌ Validation failed: ${error.message}`);
              } finally {
                setIsValidating(false);
              }
            },
          }] : []),
          ...(section.php && editorHtml.trim() ? [{
            label: "🔃 Update Widget",
            onClick: handleConvertToWidget,
            disabled: isConverting,
          }] : []),
          ...(section.php ? [{
            label: "🔄 Convert Back to HTML",
            onClick: handleConvertBackToHtml,
            divider: true,
          }] : []),
          {
            label: "File Tree",
            onClick: () => setShowFileTree(!showFileTree),
            type: "toggle",
            active: showFileTree,
            divider: true,
          },
          {
            label: "Settings",
            onClick: () => setShowSettings(!showSettings),
            type: "toggle",
            active: showSettings,
          },
          {
            label: "Preview",
            onClick: () => setShowPreview(!showPreview),
            type: "toggle",
            active: showPreview,
          },
          // Add conditional options only if props are provided
          ...(setChatVisible
            ? [
                {
                  label: chatVisible ? "Hide Chat" : "Show Chat",
                  onClick: () => setChatVisible(!chatVisible),
                  divider: true,
                },
              ]
            : []),
          ...(setTabBarVisible
            ? [
                {
                  label: tabBarVisible ? "Hide Tab Bar" : "Show Tab Bar",
                  onClick: () => setTabBarVisible(!tabBarVisible),
                },
              ]
            : []),
        ]}
      />

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

          <div style={{ display: "flex", gap: isMobile ? "6px" : "8px" }}>
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

            {/* Preview in WP - Desktop only */}
            {!isMobile && (
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

                    const importToPage = (window as any)
                      .importHtmlSectionToPage;
                    if (!importToPage) {
                      alert(
                        "WordPress Playground functions not loaded yet. Please wait a moment and try again.",
                      );
                      return;
                    }

                    // Quick preview with default name if not set
                    const sectionName = section.name || "Untitled Section";

                    const result = await importToPage({
                      name: sectionName,
                      html: section.html,
                      css: section.css,
                      js: section.js,
                      globalCss: globalCss,
                    });

                    if (result.success) {
                      // Show brief success message - page already opens in playground
                      console.log(
                        "✅ Section preview updated in WordPress Playground",
                      );

                      // Automatically switch to WordPress Playground tab
                      if (onSwitchToPlayground) {
                        onSwitchToPlayground();
                      }
                    }
                  } catch (error: any) {
                    console.error("Preview error:", error);
                    alert(`❌ Failed to update preview: ${error.message}`);
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
                title="Quick preview this section in WordPress Playground"
              >
                🔄 Preview in WP
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

            {/* Preview Toggle - Different behavior on mobile */}
            <button
              onClick={() => setShowPreview(!showPreview)}
              style={{
                padding: isMobile ? "8px 12px" : "6px 12px",
                background: showPreview ? "#000000" : "var(--muted)",
                color: showPreview ? "#ffffff" : "var(--foreground)",
                border: "none",
                borderRadius: "6px",
                fontSize: isMobile ? "14px" : "13px",
                cursor: "pointer",
                fontWeight: 500,
                minHeight: isMobile ? "44px" : "auto",
              }}
            >
              {showPreview
                ? isMobile
                  ? "📝"
                  : "✓ Preview"
                : isMobile
                  ? "👁️"
                  : "Preview"}
            </button>

            {/* Deploy to Playground - Only show in PHP/Widget mode */}
            {section.php && !isMobile && (
              <button
                onClick={handleDeployWidget}
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
              >
                🚀 Deploy to Playground
              </button>
            )}

            {/* Visual Editor - Desktop only */}
            {!isMobile && onSwitchToVisualEditor && (
              <button
                onClick={() => {
                  // Save current changes before switching
                  if (onSectionChange) {
                    onSectionChange(section);
                  }
                  onSwitchToVisualEditor();
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
              >
                👁️ Visual Editor
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
            width: showPreview ? "0%" : "100%",
            display: showPreview ? "none" : "flex",
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
                    const isPhpWidget = fileGroups.activeGroup?.type === 'php';
                    if (activeCodeTab === 'html') return '📄 index.html';
                    if (activeCodeTab === 'css') return isPhpWidget ? '🎨 widget.css' : '🎨 styles.css';
                    if (activeCodeTab === 'js') return isPhpWidget ? '⚡ widget.js' : '⚡ script.js';
                    if (activeCodeTab === 'php') return '🔧 widget.php';
                    return '';
                  })()}
                </span>
              </div>

              {/* Preview Button - Fixed position on right */}
              <button
                onClick={() => setShowPreview(!showPreview)}
                style={{
                  position: "absolute",
                  right: isMobile ? "12px" : "16px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  padding: isMobile ? "8px 12px" : "6px 16px",
                  background: showPreview ? "#10b981" : "transparent",
                  color: showPreview ? "#ffffff" : "#9ca3af",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: isMobile ? "14px" : "13px",
                  cursor: "pointer",
                  fontWeight: showPreview ? 500 : 400,
                  transition: "all 0.2s",
                  minHeight: isMobile ? "40px" : "32px",
                  whiteSpace: "nowrap",
                }}
              >
                {showPreview ? "✓ Preview" : "Preview"}
              </button>
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
                      const isPhpWidget = fileGroups.activeGroup?.type === 'php';
                      const files = isPhpWidget ? [
                        { tab: 'php', icon: '🔧', name: 'widget.php', lang: 'PHP' },
                        { tab: 'css', icon: '🎨', name: 'widget.css', lang: 'CSS' },
                        { tab: 'js', icon: '⚡', name: 'widget.js', lang: 'JavaScript' }
                      ] : [
                        { tab: 'html', icon: '📄', name: 'index.html', lang: 'HTML' },
                        { tab: 'css', icon: '🎨', name: 'styles.css', lang: 'CSS' },
                        { tab: 'js', icon: '⚡', name: 'script.js', lang: 'JavaScript' }
                      ];
                      return files;
                    })().map((file) => (
                      <button
                        key={file.tab}
                        onClick={() => handleCodeTabChange(file.tab as 'html' | 'css' | 'js' | 'php')}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          background: activeCodeTab === file.tab ? "#2d2d2d" : "transparent",
                          border: "none",
                          borderLeft: activeCodeTab === file.tab ? "2px solid #007acc" : "2px solid transparent",
                          color: activeCodeTab === file.tab ? "#ffffff" : "#cccccc",
                          fontSize: "13px",
                          fontWeight: activeCodeTab === file.tab ? 500 : 400,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          textAlign: "left",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          if (activeCodeTab !== file.tab) {
                            e.currentTarget.style.background = "#2a2d2e";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (activeCodeTab !== file.tab) {
                            e.currentTarget.style.background = "transparent";
                          }
                        }}
                      >
                        <span style={{ fontSize: "16px" }}>{file.icon}</span>
                        <span style={{ flex: 1 }}>{file.name}</span>
                      </button>
                    ))}
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
                ) : (
                  <Editor
                height="100%"
                language={
                  activeCodeTab === "js"
                    ? "javascript"
                    : activeCodeTab === "php"
                    ? "php"
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

        {/* Preview Panel - Full Screen */}
        {showPreview && (
          <div
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              background: "var(--background)",
            }}
          >
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
              <span>Live Preview</span>
              <div style={{ display: "flex", gap: "8px" }}>
                {onEditElementInChat && (
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
                    try {
                      const result = await window.deployElementorWidget(section.php || '', editorCss, editorJs);
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
                    const projectType = section.php ? 'php' : 'html';
                    const newGroup = fileGroups.createNewGroup(section.name, projectType);

                    // Update the group with current content
                    fileGroups.updateGroupFile(newGroup.id, 'html', editorHtml);
                    fileGroups.updateGroupFile(newGroup.id, 'css', editorCss);
                    fileGroups.updateGroupFile(newGroup.id, 'js', editorJs);
                    if (section.php) {
                      fileGroups.updateGroupFile(newGroup.id, 'php', section.php);
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
            const newGroup = fileGroups.createNewGroup(name, type, template);
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
        defaultModel={undefined}
        existingCode={generateModalConversionMode ? {
          html: editorHtml,
          css: editorCss,
          js: editorJs,
        } : undefined}
        onProjectCreate={(name, type) => {
          // Create new project and return its ID
          const newGroup = fileGroups.createNewGroup(name, type, 'empty');
          fileGroups.selectGroup(newGroup.id);
          console.log('📦 Project created:', name, 'Type:', type, 'ID:', newGroup.id);

          // Start generating state
          setIsGenerating(true);
          setGeneratingPhase(type === 'php' ? 'php' : 'html');

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

            // Switch to the active file tab
            if (file === 'html' || file === 'css' || file === 'js' || file === 'php') {
              setGeneratingPhase(file);
              setGeneratingTokens(tokens);
              onCodeTabChange?.(file);
            }

            // Update editor content immediately for visibility
            updateContent(file, content);
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
    </div>
  );
}
