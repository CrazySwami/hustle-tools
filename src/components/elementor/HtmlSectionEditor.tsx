"use client";

import { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
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
  onEditElementInChat?: (elementData: {
    html: string;
    selector: string;
    classList: string[];
    context: string;
  }) => void;
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
  onEditElementInChat,
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

    if (!window.deployElementorWidget) {
      alert('WordPress Playground is not loaded. Please launch Playground first from the WordPress Playground tab.');
      return;
    }

    try {
      const result = await window.deployElementorWidget(section.php, editorCss, editorJs);
      alert(`✅ ${result.message}\n\nNext steps:\n1. Go to the WordPress Playground tab\n2. Navigate to an Elementor page\n3. Find your widget "${result.widgetClassName}" in the Hustle Tools category\n4. Drag it onto the page!`);
    } catch (error: any) {
      alert(`❌ Deployment failed: ${error.message}`);
    }
  };

  // Convert HTML section to Elementor widget
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState('');
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [convertedWidgetName, setConvertedWidgetName] = useState('');

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
            alert(`✅ Widget Generated & Deployed Successfully!\n\n` +
              `Widget: "${newProjectName}"\n` +
              `Class: ${widgetClassName}\n\n` +
              `✅ Deployed to WordPress Playground\n` +
              `✅ Original HTML project preserved\n` +
              `✅ CSS scoped with {{WRAPPER}}\n\n` +
              `Next steps:\n` +
              `1. Go to WordPress Playground tab\n` +
              `2. Edit any page with Elementor\n` +
              `3. Find your widget in the "Hustle Tools" category\n` +
              `4. Drag it onto the page!`
            );
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
      setSection(prev => ({
        ...prev,
        name: fileGroups.activeGroup!.name,
        html: fileGroups.activeGroup!.html,
        css: fileGroups.activeGroup!.css,
        js: fileGroups.activeGroup!.js,
        php: fileGroups.activeGroup!.php,
      }));

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
        options={[
          {
            label: "💾 Save to Library",
            onClick: () => setShowSaveDialog(true),
          },
          {
            label: isConverting ? "🤖 Generating with AI..." : "🤖 Generate Widget (AI)",
            onClick: handleQuickWidget,
            disabled: isConverting || !editorHtml.trim(),
          },
          {
            label: "⚡ Batch Convert Widgets",
            onClick: () => setShowBatchConverter(true),
            disabled: isConverting,
            divider: true,
          },
          ...(section.php ? [{
            label: "🚀 Deploy to WordPress",
            onClick: handleDeployWidget,
            divider: true,
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
          ...(section.php ? [{
            label: "📥 Download widget.php",
            onClick: handleDownloadWidgetPhp,
          }] : []),
          ...(editorCss.trim() ? [{
            label: "📥 Download widget.css",
            onClick: handleDownloadWidgetCss,
          }] : []),
          ...(editorJs.trim() ? [{
            label: "📥 Download widget.js",
            onClick: handleDownloadWidgetJs,
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
                {/* Debug: Log editor value */}
                {console.log(
                  `📝 Editor rendering - ${activeCodeTab}:`,
                  section[activeCodeTab]?.substring(0, 100) || "(empty)",
                )}
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

            <iframe
              ref={previewIframeRef}
              srcDoc={generatePreviewHTML()}
              style={{
                flex: 1,
                border: "none",
                width: "100%",
              }}
              sandbox="allow-scripts"
              title="Section Preview"
            />

            {/* Element Inspector - Only show when callback is provided */}
            {onEditElementInChat && (
              <ElementInspector
                previewRef={previewIframeRef}
                onEditElement={onEditElementInChat}
              />
            )}
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
                margin: "0 0 16px 0",
                fontSize: "18px",
                fontWeight: 600,
              }}
            >
              Save Section
            </h2>

            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: 500,
                }}
              >
                Section Name
              </label>
              <input
                type="text"
                value={section.name}
                onChange={(e) => updateSection({ name: e.target.value })}
                placeholder="e.g., Pricing Table, Hero Section"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              />
            </div>

            <div
              style={{
                marginBottom: "20px",
                padding: "12px",
                background: "var(--muted)",
                borderRadius: "6px",
              }}
            >
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--muted-foreground)",
                  margin: "0 0 8px 0",
                  fontWeight: 500,
                }}
              >
                {isMobile
                  ? "Save to local library:"
                  : "Choose where to save this section:"}
              </p>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                {/* Desktop-only save options */}
                {!isMobile && (
                  <>
                    <button
                      onClick={async () => {
                        try {
                          if (!section.name.trim()) {
                            alert("Please enter a section name");
                            return;
                          }

                          // Check if playground is running
                          if (!(window as any).playgroundClient) {
                            alert(
                              "WordPress Playground is not running. Please launch it first from the WordPress Playground tab.",
                            );
                            return;
                          }

                          const saveToLibrary = (window as any)
                            .saveHtmlSectionToLibrary;
                          if (!saveToLibrary) {
                            alert(
                              "WordPress Playground functions not loaded yet. Please wait a moment and try again.",
                            );
                            return;
                          }

                          const result = await saveToLibrary({
                            name: section.name,
                            html: section.html,
                            css: section.css,
                            js: section.js,
                            globalCss: globalCss,
                          });

                          if (result.success) {
                            const debug = result.debug || {};
                            const debugInfo = `\n\nDebug Info:\n- HTML: ${debug.html_length || 0} chars\n- CSS: ${debug.css_length || 0} chars\n- JS: ${debug.js_length || 0} chars\n- Combined: ${debug.combined_length || 0} chars\n- Has <style>: ${debug.has_style_tag ? "Yes" : "No"}\n- Has <script>: ${debug.has_script_tag ? "Yes" : "No"}`;
                            alert(
                              `✅ Section "${section.name}" saved to Elementor template library!\n\nTemplate ID: ${result.templateId}\n\nYou can now access it in WordPress > Templates > Saved Templates.${debugInfo}`,
                            );
                            setShowSaveDialog(false);
                          }
                        } catch (error: any) {
                          alert(
                            `❌ Failed to save to template library:\n\n${error.message}`,
                          );
                        }
                      }}
                      style={{
                        padding: "10px 16px",
                        background: "#000000",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "13px",
                        cursor: "pointer",
                        fontWeight: 500,
                        textAlign: "left",
                      }}
                    >
                      📚 Save to Elementor Template Library
                    </button>

                    <button
                      onClick={async () => {
                        try {
                          if (!section.name.trim()) {
                            alert("Please enter a section name");
                            return;
                          }

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

                          const result = await importToPage({
                            name: section.name,
                            html: section.html,
                            css: section.css,
                            js: section.js,
                            globalCss: globalCss,
                          });

                          if (result.success) {
                            alert(
                              `✅ Section "${section.name}" imported to preview page!\n\nPage ID: ${result.pageId}\n\nThe page is now open in WordPress Playground.`,
                            );
                            setShowSaveDialog(false);
                          }
                        } catch (error: any) {
                          alert(
                            `❌ Failed to import to page:\n\n${error.message}`,
                          );
                        }
                      }}
                      style={{
                        padding: "10px 16px",
                        background: "#10b981",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "13px",
                        cursor: "pointer",
                        fontWeight: 500,
                        textAlign: "left",
                      }}
                    >
                      🌐 Import to WordPress Page Preview
                    </button>
                  </>
                )}

                {/* Local library save - always available */}
                <button
                  onClick={() => {
                    try {
                      if (!section.name.trim()) {
                        alert("Please enter a section name");
                        return;
                      }

                      // Load existing sections from localStorage
                      const saved = localStorage.getItem("html-sections");
                      const sections = saved ? JSON.parse(saved) : [];

                      // Add current section
                      sections.push({
                        ...section,
                        id: `section-${Date.now()}`,
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                      });

                      // Save to localStorage
                      localStorage.setItem(
                        "html-sections",
                        JSON.stringify(sections),
                      );

                      // Dispatch storage event for other components
                      window.dispatchEvent(new Event("storage"));

                      alert(
                        `✅ Section "${section.name}" saved to local library!\n\nYou can access it in the Section Library tab.`,
                      );
                      setShowSaveDialog(false);
                    } catch (error: any) {
                      alert(
                        `❌ Failed to save to local library:\n\n${error.message}`,
                      );
                    }
                  }}
                  style={{
                    padding: isMobile ? "14px 16px" : "10px 16px",
                    background: "#10b981",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: isMobile ? "14px" : "13px",
                    cursor: "pointer",
                    fontWeight: 500,
                    textAlign: "left",
                    minHeight: isMobile ? "48px" : "auto",
                  }}
                >
                  💾 Save to Local Section Library
                </button>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowSaveDialog(false)}
                style={{
                  padding: "8px 16px",
                  background: "var(--muted)",
                  color: "var(--foreground)",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "14px",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                Cancel
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
    </div>
  );
}
