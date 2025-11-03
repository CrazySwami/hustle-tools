"use client";

import { useState, useEffect } from "react";
import { useGlobalStylesheet } from "@/lib/global-stylesheet-context";
import { useTheme } from "next-themes";
import Editor from "@monaco-editor/react";
import { analyzeCSSWithAI } from "@/lib/css-analyzer";
import { GoogleFontPicker } from "@/components/ui/GoogleFontPicker";
import { BrandfetchImporter } from "./BrandfetchImporter";
import {
  Palette,
  Code,
  Download,
  Upload,
  Wand2,
  Eye,
  FileJson,
  Globe,
  Sparkles,
  Type,
  ToggleLeft,
  Save,
  RefreshCw,
  Zap,
  Info,
  X,
} from "lucide-react";

interface UnifiedStyleKitSidebarProps {
  chatVisible?: boolean;
  setChatVisible?: (visible: boolean) => void;
  tabBarVisible?: boolean;
  setTabBarVisible?: (visible: boolean) => void;
  isTabVisible?: boolean;
  playgroundReady?: boolean;
}

type ViewMode = "preview" | "css";
type ImportMethod = "style-kit" | "brand-fetch" | null;
type EditModalElement =
  | "heading-font"
  | "body-font"
  | "primary-color"
  | "secondary-color"
  | "body-text-color"
  | "heading-text-color"
  | "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
  | "body-text"
  | "button"
  | "link"
  | null;

export function UnifiedStyleKitSidebar({
  playgroundReady = false,
}: UnifiedStyleKitSidebarProps) {
  const {
    globalCss,
    setGlobalCss,
    designSystemSummary,
    setDesignSystemSummary,
    pullFromWordPress,
    pushToWordPress,
    isLoading,
    themeName,
    themeVersion,
    cssVariables,
  } = useGlobalStylesheet();
  const { theme } = useTheme();

  const [isMobile, setIsMobile] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [editedCss, setEditedCss] = useState(globalCss);
  const [autoImportant, setAutoImportant] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [importMethod, setImportMethod] = useState<ImportMethod>(null);
  const [editingElement, setEditingElement] = useState<EditModalElement>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generatePrompt, setGeneratePrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });

  // Element inclusion checkboxes for AI context
  const [includeHeadingFont, setIncludeHeadingFont] = useState(true);
  const [includeBodyFont, setIncludeBodyFont] = useState(true);
  const [includePrimaryColor, setIncludePrimaryColor] = useState(true);
  const [includeSecondaryColor, setIncludeSecondaryColor] = useState(true);
  const [includeBodyTextColor, setIncludeBodyTextColor] = useState(true);
  const [includeHeadingTextColor, setIncludeHeadingTextColor] = useState(true);
  const [includeLinkColor, setIncludeLinkColor] = useState(true);
  const [includeLinkHoverColor, setIncludeLinkHoverColor] = useState(true);
  const [includeButtonRadius, setIncludeButtonRadius] = useState(true);

  // Elementor Style Kit state
  const [styleKitData, setStyleKitData] = useState<any>(null);
  const [loadingStyleKit, setLoadingStyleKit] = useState(false);

  // Editable style state (Site Information)
  const [headingFont, setHeadingFont] = useState("system-ui");
  const [bodyFont, setBodyFont] = useState("system-ui");
  const [primaryColor, setPrimaryColor] = useState("#3b82f6");
  const [secondaryColor, setSecondaryColor] = useState("#6b7280");
  const [bodyTextColor, setBodyTextColor] = useState("#374151");
  const [headingTextColor, setHeadingTextColor] = useState("#111827");
  const [linkColor, setLinkColor] = useState("#3b82f6");
  const [linkHoverColor, setLinkHoverColor] = useState("#2563eb");
  const [buttonBorderRadius, setButtonBorderRadius] = useState("0.375rem");
  const [companyName, setCompanyName] = useState("");
  const [companyTagline, setCompanyTagline] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");

  // Individual heading level styles
  const [h1Styles, setH1Styles] = useState({
    fontSize: "2.5rem",
    fontWeight: "700",
    lineHeight: "1.2",
    letterSpacing: "-0.02em",
    textTransform: "none" as "none" | "uppercase" | "lowercase" | "capitalize",
  });
  const [h2Styles, setH2Styles] = useState({
    fontSize: "2rem",
    fontWeight: "600",
    lineHeight: "1.3",
    letterSpacing: "-0.01em",
    textTransform: "none" as "none" | "uppercase" | "lowercase" | "capitalize",
  });
  const [h3Styles, setH3Styles] = useState({
    fontSize: "1.75rem",
    fontWeight: "600",
    lineHeight: "1.4",
    letterSpacing: "0",
    textTransform: "none" as "none" | "uppercase" | "lowercase" | "capitalize",
  });
  const [h4Styles, setH4Styles] = useState({
    fontSize: "1.5rem",
    fontWeight: "600",
    lineHeight: "1.4",
    letterSpacing: "0",
    textTransform: "none" as "none" | "uppercase" | "lowercase" | "capitalize",
  });
  const [h5Styles, setH5Styles] = useState({
    fontSize: "1.25rem",
    fontWeight: "600",
    lineHeight: "1.5",
    letterSpacing: "0",
    textTransform: "none" as "none" | "uppercase" | "lowercase" | "capitalize",
  });
  const [h6Styles, setH6Styles] = useState({
    fontSize: "1rem",
    fontWeight: "600",
    lineHeight: "1.5",
    letterSpacing: "0",
    textTransform: "none" as "none" | "uppercase" | "lowercase" | "capitalize",
  });

  // Body text detailed styles
  const [bodyTextStyles, setBodyTextStyles] = useState({
    fontSize: "1rem",
    fontWeight: "400",
    lineHeight: "1.6",
    letterSpacing: "0",
  });

  // Button detailed styles
  const [buttonStyles, setButtonStyles] = useState({
    paddingTop: "0.5rem",
    paddingRight: "1rem",
    paddingBottom: "0.5rem",
    paddingLeft: "1rem",
    backgroundColor: primaryColor,
    textColor: "#ffffff",
    borderRadius: "0.375rem",
    borderWidth: "0px",
    borderColor: "transparent",
    fontSize: "1rem",
    fontWeight: "500",
    hoverBackgroundColor: "#2563eb",
    hoverTextColor: "#ffffff",
    hoverTransform: "translateY(-1px)",
    transition: "all 0.2s ease",
  });

  // Link detailed styles
  const [linkStyles, setLinkStyles] = useState({
    color: linkColor,
    hoverColor: linkHoverColor,
    textDecoration: "underline" as "none" | "underline" | "line-through",
    hoverTextDecoration: "underline" as "none" | "underline" | "line-through",
    fontWeight: "400",
    transition: "color 0.2s ease",
  });

  // Sync edited CSS with global CSS
  useEffect(() => {
    setEditedCss(globalCss);
  }, [globalCss]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Event listeners for menu actions (triggered from navigation dropdown)
  useEffect(() => {
    const handleImportEvent = () => handleImport('style-kit');
    const handlePullEvent = () => handlePull();
    const handlePushEvent = () => handlePush();
    const handleExportEvent = () => exportCss();

    window.addEventListener('stylekit-import', handleImportEvent);
    window.addEventListener('stylekit-pull', handlePullEvent);
    window.addEventListener('stylekit-push', handlePushEvent);
    window.addEventListener('stylekit-export', handleExportEvent);

    return () => {
      window.removeEventListener('stylekit-import', handleImportEvent);
      window.removeEventListener('stylekit-pull', handlePullEvent);
      window.removeEventListener('stylekit-push', handlePushEvent);
      window.removeEventListener('stylekit-export', handleExportEvent);
    };
  }, []);

  // Toast notification
  const showToast = (message: string) => {
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  // Save CSS with optional !important
  const saveCssChanges = () => {
    let finalCss = editedCss;

    if (autoImportant) {
      finalCss = finalCss.replace(
        /([^{]+\{[^}]+?)([;\s])(\})/g,
        (match, before, sep, close) => {
          if (before.includes("!important")) return match;
          return before + " !important" + sep + close;
        }
      );
    }

    setGlobalCss(finalCss);
    showToast("CSS updated");
  };

  // Pull from WordPress
  const handlePull = async () => {
    try {
      await pullFromWordPress();

      // After pulling, parse the CSS to extract any existing color/font values
      // and update the preview state so it reflects the pulled CSS
      const cssText = globalCss;

      // Simple regex patterns to extract values from CSS
      const headingFontMatch = cssText.match(/--heading-font:\s*([^;]+);/);
      const bodyFontMatch = cssText.match(/--body-font:\s*([^;]+);/);
      const primaryColorMatch = cssText.match(/--primary-color:\s*([^;]+);/);
      const secondaryColorMatch = cssText.match(/--secondary-color:\s*([^;]+);/);

      // Update state if values found
      if (headingFontMatch) setHeadingFont(headingFontMatch[1].trim());
      if (bodyFontMatch) setBodyFont(bodyFontMatch[1].trim());
      if (primaryColorMatch) setPrimaryColor(primaryColorMatch[1].trim());
      if (secondaryColorMatch) setSecondaryColor(secondaryColorMatch[1].trim());

      showToast("Pulled from WordPress successfully");

      // Switch to CSS view to show what was pulled
      setViewMode("css");
    } catch (err: any) {
      showToast(`Pull failed: ${err.message}`);
    }
  };

  // Push to WordPress
  const handlePush = async () => {
    try {
      await pushToWordPress();

      // Show success modal with more details
      showToast("✅ Successfully pushed CSS to WordPress global stylesheet");

      // Switch to CSS view to confirm what was pushed
      setViewMode("css");
    } catch (err: any) {
      showToast(`❌ Push failed: ${err.message}`);
    }
  };

  // Export CSS
  const exportCss = () => {
    const blob = new Blob([globalCss], { type: "text/css" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "global-stylesheet.css";
    a.click();
    URL.revokeObjectURL(url);
    showToast("CSS exported");
  };

  // Open AI CSS generation modal
  const openGenerateModal = () => {
    // Pre-fill prompt with current style settings
    const contextPrompt = `Generate CSS with these settings:
- Heading Font: ${headingFont}
- Body Font: ${bodyFont}
- Primary Color: ${primaryColor}
- Secondary Color: ${secondaryColor}

Additional requirements: `;
    setGeneratePrompt(contextPrompt);
    setShowGenerateModal(true);
  };

  // Generate CSS using Claude Haiku 4.5
  const generateCssWithAI = async () => {
    if (!generatePrompt.trim()) {
      showToast("Please enter a description");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate-css", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: generatePrompt,
          headingFont,
          bodyFont,
          primaryColor,
          secondaryColor,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate CSS");
      }

      const data = await response.json();
      const generatedCss = data.css;

      // Append generated CSS
      const updatedCss = globalCss + "\n\n" + generatedCss;
      setGlobalCss(updatedCss);

      showToast("CSS generated successfully");
      setShowGenerateModal(false);
      setGeneratePrompt("");
    } catch (err: any) {
      showToast(`Generation failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle import modal
  const handleImport = async (method: ImportMethod) => {
    setImportMethod(method);
    setShowImportModal(true);
  };

  // Close import modal
  const closeImportModal = () => {
    setShowImportModal(false);
    setImportMethod(null);
  };

  // Handle element click for editing
  const handleElementClick = (element: EditModalElement, event: React.MouseEvent) => {
    event.stopPropagation();
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    setModalPosition({
      top: rect.top - 10, // 10px above the element
      left: rect.left,
    });
    setEditingElement(element);
  };

  // Close edit modal
  const closeEditModal = () => {
    setEditingElement(null);
  };

  // Save changes from preview to CSS
  const savePreviewChanges = () => {
    // Build comprehensive CSS from all state
    const newCss = `
/* Generated from Style Kit Preview */
:root {
  --heading-font: ${headingFont};
  --body-font: ${bodyFont};
  --primary-color: ${primaryColor};
  --secondary-color: ${secondaryColor};
  --body-text-color: ${bodyTextColor};
  --heading-text-color: ${headingTextColor};
  --link-color: ${linkStyles.color};
  --link-hover-color: ${linkStyles.hoverColor};
  --button-background: ${buttonStyles.backgroundColor};
  --button-text-color: ${buttonStyles.textColor};
  --button-border-radius: ${buttonStyles.borderRadius};
}

/* Typography - Individual Heading Levels */
h1 {
  font-family: ${headingFont} !important;
  color: ${headingTextColor} !important;
  font-size: ${h1Styles.fontSize} !important;
  font-weight: ${h1Styles.fontWeight} !important;
  line-height: ${h1Styles.lineHeight} !important;
  letter-spacing: ${h1Styles.letterSpacing} !important;
  text-transform: ${h1Styles.textTransform} !important;
}

h2 {
  font-family: ${headingFont} !important;
  color: ${headingTextColor} !important;
  font-size: ${h2Styles.fontSize} !important;
  font-weight: ${h2Styles.fontWeight} !important;
  line-height: ${h2Styles.lineHeight} !important;
  letter-spacing: ${h2Styles.letterSpacing} !important;
  text-transform: ${h2Styles.textTransform} !important;
}

h3 {
  font-family: ${headingFont} !important;
  color: ${headingTextColor} !important;
  font-size: ${h3Styles.fontSize} !important;
  font-weight: ${h3Styles.fontWeight} !important;
  line-height: ${h3Styles.lineHeight} !important;
  letter-spacing: ${h3Styles.letterSpacing} !important;
  text-transform: ${h3Styles.textTransform} !important;
}

h4 {
  font-family: ${headingFont} !important;
  color: ${headingTextColor} !important;
  font-size: ${h4Styles.fontSize} !important;
  font-weight: ${h4Styles.fontWeight} !important;
  line-height: ${h4Styles.lineHeight} !important;
  letter-spacing: ${h4Styles.letterSpacing} !important;
  text-transform: ${h4Styles.textTransform} !important;
}

h5 {
  font-family: ${headingFont} !important;
  color: ${headingTextColor} !important;
  font-size: ${h5Styles.fontSize} !important;
  font-weight: ${h5Styles.fontWeight} !important;
  line-height: ${h5Styles.lineHeight} !important;
  letter-spacing: ${h5Styles.letterSpacing} !important;
  text-transform: ${h5Styles.textTransform} !important;
}

h6 {
  font-family: ${headingFont} !important;
  color: ${headingTextColor} !important;
  font-size: ${h6Styles.fontSize} !important;
  font-weight: ${h6Styles.fontWeight} !important;
  line-height: ${h6Styles.lineHeight} !important;
  letter-spacing: ${h6Styles.letterSpacing} !important;
  text-transform: ${h6Styles.textTransform} !important;
}

/* Body Text */
body, p, span, div {
  font-family: ${bodyFont} !important;
  color: ${bodyTextColor} !important;
  font-size: ${bodyTextStyles.fontSize} !important;
  font-weight: ${bodyTextStyles.fontWeight} !important;
  line-height: ${bodyTextStyles.lineHeight} !important;
  letter-spacing: ${bodyTextStyles.letterSpacing} !important;
}

/* Links */
a {
  color: ${linkStyles.color} !important;
  text-decoration: ${linkStyles.textDecoration} !important;
  font-weight: ${linkStyles.fontWeight} !important;
  transition: ${linkStyles.transition} !important;
}

a:hover {
  color: ${linkStyles.hoverColor} !important;
  text-decoration: ${linkStyles.hoverTextDecoration} !important;
}

/* Buttons */
button, .btn, .button, input[type="submit"], input[type="button"] {
  padding: ${buttonStyles.paddingTop} ${buttonStyles.paddingRight} ${buttonStyles.paddingBottom} ${buttonStyles.paddingLeft} !important;
  background-color: ${buttonStyles.backgroundColor} !important;
  color: ${buttonStyles.textColor} !important;
  border-radius: ${buttonStyles.borderRadius} !important;
  border: ${buttonStyles.borderWidth} solid ${buttonStyles.borderColor} !important;
  font-size: ${buttonStyles.fontSize} !important;
  font-weight: ${buttonStyles.fontWeight} !important;
  transition: ${buttonStyles.transition} !important;
  cursor: pointer;
}

button:hover, .btn:hover, .button:hover, input[type="submit"]:hover, input[type="button"]:hover {
  background-color: ${buttonStyles.hoverBackgroundColor} !important;
  color: ${buttonStyles.hoverTextColor} !important;
  transform: ${buttonStyles.hoverTransform} !important;
}

/* Primary Buttons */
button.primary, .btn-primary {
  background-color: ${primaryColor} !important;
}

/* Secondary Buttons */
button.secondary, .btn-secondary {
  background-color: ${secondaryColor} !important;
}

/* Animations & Transitions */
* {
  transition-timing-function: ease !important;
}

/* Smooth hover animations for all interactive elements */
a, button, .btn, .button, input[type="submit"], input[type="button"] {
  transition: all 0.2s ease !important;
}
`;

    setGlobalCss(newCss);
    showToast("Changes saved to CSS");
  };

  return (
    <div className="flex h-full w-full bg-background overflow-hidden">
      {/* Left Sidebar - Hidden on mobile */}
      {!isMobile && (
      <div className="w-64 border-r border-border flex-shrink-0 overflow-y-auto">
        <div className="p-4 space-y-2">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-1">Style Kit</h2>
            <p className="text-xs text-muted-foreground">
              Manage global styles & design system
            </p>
          </div>

          {/* View Toggle - Full Width with Icons */}
          <div className="mb-4">
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              View Mode
            </label>
            <div className="space-y-1">
              <button
                onClick={() => setViewMode("preview")}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === "preview"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
              <button
                onClick={() => setViewMode("css")}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === "css"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <Code className="w-4 h-4" />
                CSS Editor
              </button>
            </div>
          </div>

          {/* Import Section */}
          <div className="mb-4 pb-4 border-b border-border">
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Import Styles
            </label>
            <div className="space-y-1">
              <button
                onClick={() => handleImport("style-kit")}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded-lg transition-colors text-left"
              >
                <FileJson className="w-4 h-4" />
                Style Kit JSON
              </button>
            </div>
          </div>

          {/* WordPress Actions */}
          <div className="mb-4 pb-4 border-b border-border">
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              WordPress
            </label>
            <div className="space-y-1">
              <button
                onClick={handlePull}
                disabled={isLoading || !playgroundReady}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded-lg transition-colors text-left disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                Pull from WP
              </button>
              <button
                onClick={handlePush}
                disabled={isLoading || !playgroundReady}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded-lg transition-colors text-left disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                Push to WP
              </button>
            </div>
          </div>

          {/* Export */}
          <div>
            <button
              onClick={exportCss}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded-lg transition-colors text-left"
            >
              <Save className="w-4 h-4" />
              Export CSS File
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Right Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {viewMode === "css" ? (
          /* CSS Editor View */
          <div className="flex flex-col h-full">
            {/* Editor Header */}
            <div className="flex items-center justify-between p-3 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                <h3 className="font-semibold text-sm">CSS Editor</h3>
                {/* Mobile View Toggle */}
                {isMobile && (
                  <button
                    onClick={() => setViewMode("preview")}
                    className="ml-2 px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded transition-colors flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    Preview
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoImportant}
                    onChange={(e) => setAutoImportant(e.target.checked)}
                    className="rounded"
                  />
                  Auto !important
                </label>
                <button
                  onClick={saveCssChanges}
                  className="px-3 py-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>

            {/* Monaco Editor */}
            <div className="flex-1 overflow-hidden">
              <Editor
                height="100%"
                defaultLanguage="css"
                value={editedCss}
                onChange={(value) => setEditedCss(value || "")}
                theme={theme === "dark" ? "vs-dark" : "light"}
                options={{
                  minimap: { enabled: true },
                  fontSize: 14,
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  automaticLayout: true,
                }}
              />
            </div>
          </div>
        ) : (
          /* Preview View - Editable Style Guide */
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-border flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  <span className="text-sm font-semibold">Preview</span>
                  {/* Mobile View Toggle */}
                  {isMobile && (
                    <button
                      onClick={() => setViewMode("css")}
                      className="ml-2 px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded transition-colors flex items-center gap-1"
                    >
                      <Code className="w-3 h-3" />
                      CSS
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Click any element to edit its styles
              </p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6" id="style-kit-preview">
              {/* Scoped preview styles - only affects #style-kit-preview */}
              <style>{`
                #style-kit-preview {
                  ${globalCss}
                }
              `}</style>

              <div className="max-w-4xl mx-auto space-y-8">
                {/* Company Info */}
                {companyName && (
                  <section className="space-y-2">
                    <h1 className="text-2xl font-bold" style={{ fontFamily: headingFont, color: headingTextColor }}>
                      {companyName}
                    </h1>
                    {companyTagline && (
                      <p className="text-lg text-muted-foreground italic">{companyTagline}</p>
                    )}
                    {companyDescription && (
                      <p className="text-sm" style={{ fontFamily: bodyFont, color: bodyTextColor }}>
                        {companyDescription}
                      </p>
                    )}
                  </section>
                )}

                {/* Typography - Individual Headings */}
                <section className="space-y-4">
                  <h2 className="text-lg font-semibold border-b pb-2">Typography</h2>

                  <div className="space-y-3">
                    {/* H1 */}
                    <div
                      className="p-3 border rounded-lg cursor-pointer hover:border-primary hover:shadow-sm transition-all"
                      onClick={(e) => handleElementClick("h1", e)}
                    >
                      <div className="text-xs text-muted-foreground mb-2">H1 - Main Heading</div>
                      <h1 style={{
                        fontFamily: headingFont,
                        color: headingTextColor,
                        fontSize: h1Styles.fontSize,
                        fontWeight: h1Styles.fontWeight,
                        lineHeight: h1Styles.lineHeight,
                        letterSpacing: h1Styles.letterSpacing,
                        textTransform: h1Styles.textTransform,
                      }}>
                        Main Page Heading
                      </h1>
                    </div>

                    {/* H2 */}
                    <div
                      className="p-3 border rounded-lg cursor-pointer hover:border-primary hover:shadow-sm transition-all"
                      onClick={(e) => handleElementClick("h2", e)}
                    >
                      <div className="text-xs text-muted-foreground mb-2">H2 - Section Heading</div>
                      <h2 style={{
                        fontFamily: headingFont,
                        color: headingTextColor,
                        fontSize: h2Styles.fontSize,
                        fontWeight: h2Styles.fontWeight,
                        lineHeight: h2Styles.lineHeight,
                        letterSpacing: h2Styles.letterSpacing,
                        textTransform: h2Styles.textTransform,
                      }}>
                        Section Heading
                      </h2>
                    </div>

                    {/* H3 */}
                    <div
                      className="p-3 border rounded-lg cursor-pointer hover:border-primary hover:shadow-sm transition-all"
                      onClick={(e) => handleElementClick("h3", e)}
                    >
                      <div className="text-xs text-muted-foreground mb-2">H3 - Subsection</div>
                      <h3 style={{
                        fontFamily: headingFont,
                        color: headingTextColor,
                        fontSize: h3Styles.fontSize,
                        fontWeight: h3Styles.fontWeight,
                        lineHeight: h3Styles.lineHeight,
                        letterSpacing: h3Styles.letterSpacing,
                        textTransform: h3Styles.textTransform,
                      }}>
                        Subsection Heading
                      </h3>
                    </div>

                    {/* H4, H5, H6 collapsed */}
                    <div
                      className="p-3 border rounded-lg cursor-pointer hover:border-primary hover:shadow-sm transition-all"
                      onClick={(e) => handleElementClick("h4", e)}
                    >
                      <div className="text-xs text-muted-foreground mb-2">H4</div>
                      <h4 style={{
                        fontFamily: headingFont,
                        color: headingTextColor,
                        fontSize: h4Styles.fontSize,
                        fontWeight: h4Styles.fontWeight,
                        lineHeight: h4Styles.lineHeight,
                        letterSpacing: h4Styles.letterSpacing,
                        textTransform: h4Styles.textTransform,
                      }}>
                        H4 Heading
                      </h4>
                    </div>

                    <div
                      className="p-3 border rounded-lg cursor-pointer hover:border-primary hover:shadow-sm transition-all"
                      onClick={(e) => handleElementClick("h5", e)}
                    >
                      <div className="text-xs text-muted-foreground mb-2">H5</div>
                      <h5 style={{
                        fontFamily: headingFont,
                        color: headingTextColor,
                        fontSize: h5Styles.fontSize,
                        fontWeight: h5Styles.fontWeight,
                        lineHeight: h5Styles.lineHeight,
                        letterSpacing: h5Styles.letterSpacing,
                        textTransform: h5Styles.textTransform,
                      }}>
                        H5 Heading
                      </h5>
                    </div>

                    <div
                      className="p-3 border rounded-lg cursor-pointer hover:border-primary hover:shadow-sm transition-all"
                      onClick={(e) => handleElementClick("h6", e)}
                    >
                      <div className="text-xs text-muted-foreground mb-2">H6</div>
                      <h6 style={{
                        fontFamily: headingFont,
                        color: headingTextColor,
                        fontSize: h6Styles.fontSize,
                        fontWeight: h6Styles.fontWeight,
                        lineHeight: h6Styles.lineHeight,
                        letterSpacing: h6Styles.letterSpacing,
                        textTransform: h6Styles.textTransform,
                      }}>
                        H6 Heading
                      </h6>
                    </div>

                    {/* Body Text */}
                    <div
                      className="p-3 border rounded-lg cursor-pointer hover:border-primary hover:shadow-sm transition-all"
                      onClick={(e) => handleElementClick("body-text", e)}
                    >
                      <div className="text-xs text-muted-foreground mb-2">Body Text</div>
                      <p style={{
                        fontFamily: bodyFont,
                        color: bodyTextColor,
                        fontSize: bodyTextStyles.fontSize,
                        fontWeight: bodyTextStyles.fontWeight,
                        lineHeight: bodyTextStyles.lineHeight,
                        letterSpacing: bodyTextStyles.letterSpacing,
                      }}>
                        This is body text. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                        Click to edit font size, weight, line height, and letter spacing.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Colors */}
                <section className="space-y-4">
                  <h2 className="text-lg font-semibold border-b pb-2">Colors</h2>

                  <div className="grid grid-cols-2 gap-4">
                    <div
                      className="p-3 border rounded-lg cursor-pointer hover:border-primary hover:shadow-sm transition-all"
                      onClick={(e) => handleElementClick("primary-color", e)}
                    >
                      <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={includePrimaryColor}
                          onChange={(e) => {
                            e.stopPropagation();
                            setIncludePrimaryColor(e.target.checked);
                          }}
                          className="rounded"
                        />
                        Primary Color
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-16 h-16 rounded-lg border shadow-sm"
                          style={{ backgroundColor: primaryColor }}
                        />
                        <div>
                          <div className="font-mono text-sm">{primaryColor}</div>
                          <div className="text-xs text-muted-foreground">Buttons, Links, CTA</div>
                        </div>
                      </div>
                    </div>

                    <div
                      className="p-3 border rounded-lg cursor-pointer hover:border-primary hover:shadow-sm transition-all"
                      onClick={(e) => handleElementClick("secondary-color", e)}
                    >
                      <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={includeSecondaryColor}
                          onChange={(e) => {
                            e.stopPropagation();
                            setIncludeSecondaryColor(e.target.checked);
                          }}
                          className="rounded"
                        />
                        Secondary Color
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-16 h-16 rounded-lg border shadow-sm"
                          style={{ backgroundColor: secondaryColor }}
                        />
                        <div>
                          <div className="font-mono text-sm">{secondaryColor}</div>
                          <div className="text-xs text-muted-foreground">Accents, Highlights</div>
                        </div>
                      </div>
                    </div>

                    <div
                      className="p-3 border rounded-lg cursor-pointer hover:border-primary hover:shadow-sm transition-all"
                      onClick={(e) => handleElementClick("body-text-color", e)}
                    >
                      <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={includeBodyTextColor}
                          onChange={(e) => {
                            e.stopPropagation();
                            setIncludeBodyTextColor(e.target.checked);
                          }}
                          className="rounded"
                        />
                        Body Text Color
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-16 h-16 rounded-lg border shadow-sm"
                          style={{ backgroundColor: bodyTextColor }}
                        />
                        <div>
                          <div className="font-mono text-sm">{bodyTextColor}</div>
                          <div className="text-xs text-muted-foreground">Paragraphs</div>
                        </div>
                      </div>
                    </div>

                    <div
                      className="p-3 border rounded-lg cursor-pointer hover:border-primary hover:shadow-sm transition-all"
                      onClick={(e) => handleElementClick("heading-text-color", e)}
                    >
                      <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={includeHeadingTextColor}
                          onChange={(e) => {
                            e.stopPropagation();
                            setIncludeHeadingTextColor(e.target.checked);
                          }}
                          className="rounded"
                        />
                        Heading Text Color
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-16 h-16 rounded-lg border shadow-sm"
                          style={{ backgroundColor: headingTextColor }}
                        />
                        <div>
                          <div className="font-mono text-sm">{headingTextColor}</div>
                          <div className="text-xs text-muted-foreground">Headings, Titles</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Buttons */}
                <section className="space-y-4">
                  <h2 className="text-lg font-semibold border-b pb-2">Buttons</h2>

                  <div
                    className="p-4 border rounded-lg cursor-pointer hover:border-primary hover:shadow-sm transition-all"
                    onClick={(e) => handleElementClick("button", e)}
                  >
                    <div className="text-xs text-muted-foreground mb-3">
                      Click to edit padding, colors, borders, hover states, and animations
                    </div>
                    <div className="space-y-4">
                      <div>
                        <div className="text-xs text-muted-foreground mb-2">Default State</div>
                        <button
                          style={{
                            backgroundColor: buttonStyles.backgroundColor,
                            borderRadius: buttonStyles.borderRadius,
                            paddingTop: buttonStyles.paddingTop,
                            paddingRight: buttonStyles.paddingRight,
                            paddingBottom: buttonStyles.paddingBottom,
                            paddingLeft: buttonStyles.paddingLeft,
                            color: buttonStyles.textColor,
                            border: `${buttonStyles.borderWidth} solid ${buttonStyles.borderColor}`,
                            fontSize: buttonStyles.fontSize,
                            fontWeight: buttonStyles.fontWeight,
                            cursor: 'pointer',
                            transition: buttonStyles.transition
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = buttonStyles.hoverBackgroundColor;
                            e.currentTarget.style.color = buttonStyles.hoverTextColor;
                            e.currentTarget.style.transform = buttonStyles.hoverTransform;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = buttonStyles.backgroundColor;
                            e.currentTarget.style.color = buttonStyles.textColor;
                            e.currentTarget.style.transform = 'none';
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          Hover Me!
                        </button>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-2">Hover State Preview</div>
                        <button
                          style={{
                            backgroundColor: buttonStyles.hoverBackgroundColor,
                            borderRadius: buttonStyles.borderRadius,
                            paddingTop: buttonStyles.paddingTop,
                            paddingRight: buttonStyles.paddingRight,
                            paddingBottom: buttonStyles.paddingBottom,
                            paddingLeft: buttonStyles.paddingLeft,
                            color: buttonStyles.hoverTextColor,
                            border: `${buttonStyles.borderWidth} solid ${buttonStyles.borderColor}`,
                            fontSize: buttonStyles.fontSize,
                            fontWeight: buttonStyles.fontWeight,
                            cursor: 'pointer',
                            transform: buttonStyles.hoverTransform,
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          Hovered State
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Links */}
                <section className="space-y-4">
                  <h2 className="text-lg font-semibold border-b pb-2">Links</h2>

                  <div
                    className="p-4 border rounded-lg cursor-pointer hover:border-primary hover:shadow-sm transition-all"
                    onClick={(e) => handleElementClick("link", e)}
                  >
                    <div className="text-xs text-muted-foreground mb-3">
                      Click to edit colors, text decoration, font weight, and hover states
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-muted-foreground mb-2">Interactive Link (Hover to see effect)</div>
                        <a
                          href="#"
                          style={{
                            color: linkStyles.color,
                            textDecoration: linkStyles.textDecoration,
                            fontWeight: linkStyles.fontWeight,
                            transition: linkStyles.transition,
                            fontSize: '1.1rem',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = linkStyles.hoverColor;
                            e.currentTarget.style.textDecoration = linkStyles.hoverTextDecoration;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = linkStyles.color;
                            e.currentTarget.style.textDecoration = linkStyles.textDecoration;
                          }}
                          onClick={(e) => e.preventDefault()}
                        >
                          Hover over this link to see the effect
                        </a>
                      </div>

                      <div>
                        <div className="text-xs text-muted-foreground mb-2">Hover State Preview</div>
                        <a
                          href="#"
                          style={{
                            color: linkStyles.hoverColor,
                            textDecoration: linkStyles.hoverTextDecoration,
                            fontWeight: linkStyles.fontWeight,
                            fontSize: '1.1rem',
                          }}
                          onClick={(e) => e.preventDefault()}
                        >
                          This shows the hovered state
                        </a>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Animations */}
                <section className="space-y-4">
                  <h2 className="text-lg font-semibold border-b pb-2">Animations</h2>

                  <div className="p-4 border rounded-lg space-y-3">
                    <div className="text-xs text-muted-foreground">Default Transitions</div>
                    <ul className="text-sm space-y-1">
                      <li>• Buttons: all 0.2s ease</li>
                      <li>• Links: color 0.2s ease</li>
                      <li>• Hover: transform translateY(-1px)</li>
                    </ul>
                  </div>
                </section>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 border-t border-border flex gap-2 flex-shrink-0">
              <button
                onClick={savePreviewChanges}
                className="flex-1 px-2 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors flex items-center justify-center gap-1 text-sm"
              >
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">Save to CSS</span>
                <span className="sm:hidden">Save</span>
              </button>
              <button
                onClick={openGenerateModal}
                className="flex-1 px-2 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-lg transition-colors flex items-center justify-center gap-1 text-sm"
              >
                <Zap className="w-4 h-4" />
                <span className="hidden sm:inline">Generate CSS</span>
                <span className="sm:hidden">Generate</span>
              </button>
              <button
                onClick={() => {
                  setImportMethod("brand-fetch");
                  setShowImportModal(true);
                }}
                className="px-2 py-2 border border-border hover:bg-muted rounded-lg transition-colors flex items-center justify-center gap-1 text-sm whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Brand Fetch</span>
                <span className="sm:hidden">Brand</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Element Modal */}
      {editingElement && (
        <div
          className="fixed inset-0 z-[9998]"
          onClick={closeEditModal}
        >
          <div
            className="absolute bg-card border border-primary rounded-lg shadow-2xl p-4 min-w-[300px] max-w-[400px]"
            style={{
              top: modalPosition.top,
              left: modalPosition.left,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-3">
              {/* Heading Font */}
              {editingElement === "heading-font" && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm">Edit Heading Font</h3>
                    <button onClick={closeEditModal} className="text-muted-foreground hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <GoogleFontPicker value={headingFont} onChange={setHeadingFont} />
                </>
              )}

              {/* Body Font */}
              {editingElement === "body-font" && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm">Edit Body Font</h3>
                    <button onClick={closeEditModal} className="text-muted-foreground hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <GoogleFontPicker value={bodyFont} onChange={setBodyFont} />
                </>
              )}

              {/* Primary Color */}
              {editingElement === "primary-color" && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm">Edit Primary Color</h3>
                    <button onClick={closeEditModal} className="text-muted-foreground hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-full h-20 rounded border border-border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm font-mono"
                  />
                </>
              )}

              {/* Secondary Color */}
              {editingElement === "secondary-color" && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm">Edit Secondary Color</h3>
                    <button onClick={closeEditModal} className="text-muted-foreground hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-full h-20 rounded border border-border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm font-mono"
                  />
                </>
              )}

              {/* Body Text Color */}
              {editingElement === "body-text-color" && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm">Edit Body Text Color</h3>
                    <button onClick={closeEditModal} className="text-muted-foreground hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="color"
                    value={bodyTextColor}
                    onChange={(e) => setBodyTextColor(e.target.value)}
                    className="w-full h-20 rounded border border-border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={bodyTextColor}
                    onChange={(e) => setBodyTextColor(e.target.value)}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm font-mono"
                  />
                </>
              )}

              {/* Heading Text Color */}
              {editingElement === "heading-text-color" && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm">Edit Heading Text Color</h3>
                    <button onClick={closeEditModal} className="text-muted-foreground hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="color"
                    value={headingTextColor}
                    onChange={(e) => setHeadingTextColor(e.target.value)}
                    className="w-full h-20 rounded border border-border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={headingTextColor}
                    onChange={(e) => setHeadingTextColor(e.target.value)}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm font-mono"
                  />
                </>
              )}

              {/* H1 Styles */}
              {editingElement === "h1" && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm">Edit H1 Styles</h3>
                    <button onClick={closeEditModal} className="text-muted-foreground hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    <div>
                      <label className="text-xs text-muted-foreground">Font Family</label>
                      <GoogleFontPicker value={headingFont} onChange={setHeadingFont} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Font Size</label>
                      <input type="text" value={h1Styles.fontSize} onChange={(e) => setH1Styles({ ...h1Styles, fontSize: e.target.value })} className="w-full px-3 py-1.5 bg-muted border border-border rounded text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Font Weight</label>
                      <select value={h1Styles.fontWeight} onChange={(e) => setH1Styles({ ...h1Styles, fontWeight: e.target.value })} className="w-full px-3 py-1.5 bg-muted border border-border rounded text-sm">
                        <option value="300">Light (300)</option>
                        <option value="400">Normal (400)</option>
                        <option value="500">Medium (500)</option>
                        <option value="600">Semi-Bold (600)</option>
                        <option value="700">Bold (700)</option>
                        <option value="800">Extra-Bold (800)</option>
                        <option value="900">Black (900)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Line Height</label>
                      <input type="text" value={h1Styles.lineHeight} onChange={(e) => setH1Styles({ ...h1Styles, lineHeight: e.target.value })} className="w-full px-3 py-1.5 bg-muted border border-border rounded text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Letter Spacing</label>
                      <input type="text" value={h1Styles.letterSpacing} onChange={(e) => setH1Styles({ ...h1Styles, letterSpacing: e.target.value })} className="w-full px-3 py-1.5 bg-muted border border-border rounded text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Text Transform</label>
                      <select value={h1Styles.textTransform} onChange={(e) => setH1Styles({ ...h1Styles, textTransform: e.target.value as any })} className="w-full px-3 py-1.5 bg-muted border border-border rounded text-sm">
                        <option value="none">None</option>
                        <option value="uppercase">Uppercase</option>
                        <option value="lowercase">Lowercase</option>
                        <option value="capitalize">Capitalize</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* H2-H6 Styles (similar structure) */}
              {editingElement === "h2" && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm">Edit H2 Styles</h3>
                    <button onClick={closeEditModal} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    <div><label className="text-xs text-muted-foreground">Font Family</label><GoogleFontPicker value={headingFont} onChange={setHeadingFont} /></div>
                    <div><label className="text-xs text-muted-foreground">Font Size</label><input type="text" value={h2Styles.fontSize} onChange={(e) => setH2Styles({ ...h2Styles, fontSize: e.target.value })} className="w-full px-3 py-1.5 bg-muted border border-border rounded text-sm" /></div>
                    <div><label className="text-xs text-muted-foreground">Font Weight</label><select value={h2Styles.fontWeight} onChange={(e) => setH2Styles({ ...h2Styles, fontWeight: e.target.value })} className="w-full px-3 py-1.5 bg-muted border border-border rounded text-sm"><option value="300">Light</option><option value="400">Normal</option><option value="500">Medium</option><option value="600">Semi-Bold</option><option value="700">Bold</option><option value="800">Extra-Bold</option></select></div>
                    <div><label className="text-xs text-muted-foreground">Line Height</label><input type="text" value={h2Styles.lineHeight} onChange={(e) => setH2Styles({ ...h2Styles, lineHeight: e.target.value })} className="w-full px-3 py-1.5 bg-muted border border-border rounded text-sm" /></div>
                    <div><label className="text-xs text-muted-foreground">Letter Spacing</label><input type="text" value={h2Styles.letterSpacing} onChange={(e) => setH2Styles({ ...h2Styles, letterSpacing: e.target.value })} className="w-full px-3 py-1.5 bg-muted border border-border rounded text-sm" /></div>
                    <div><label className="text-xs text-muted-foreground">Text Transform</label><select value={h2Styles.textTransform} onChange={(e) => setH2Styles({ ...h2Styles, textTransform: e.target.value as any })} className="w-full px-3 py-1.5 bg-muted border border-border rounded text-sm"><option value="none">None</option><option value="uppercase">Uppercase</option><option value="lowercase">Lowercase</option><option value="capitalize">Capitalize</option></select></div>
                  </div>
                </>
              )}

              {editingElement === "h3" && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm">Edit H3 Styles</h3>
                    <button onClick={closeEditModal} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    <div><label className="text-xs text-muted-foreground">Font Family</label><GoogleFontPicker value={headingFont} onChange={setHeadingFont} /></div>
                    <div><label className="text-xs text-muted-foreground">Font Size</label><input type="text" value={h3Styles.fontSize} onChange={(e) => setH3Styles({ ...h3Styles, fontSize: e.target.value })} className="w-full px-3 py-1.5 bg-muted border border-border rounded text-sm" /></div>
                    <div><label className="text-xs text-muted-foreground">Font Weight</label><select value={h3Styles.fontWeight} onChange={(e) => setH3Styles({ ...h3Styles, fontWeight: e.target.value })} className="w-full px-3 py-1.5 bg-muted border border-border rounded text-sm"><option value="300">Light</option><option value="400">Normal</option><option value="500">Medium</option><option value="600">Semi-Bold</option><option value="700">Bold</option><option value="800">Extra-Bold</option></select></div>
                    <div><label className="text-xs text-muted-foreground">Line Height</label><input type="text" value={h3Styles.lineHeight} onChange={(e) => setH3Styles({ ...h3Styles, lineHeight: e.target.value })} className="w-full px-3 py-1.5 bg-muted border border-border rounded text-sm" /></div>
                    <div><label className="text-xs text-muted-foreground">Letter Spacing</label><input type="text" value={h3Styles.letterSpacing} onChange={(e) => setH3Styles({ ...h3Styles, letterSpacing: e.target.value })} className="w-full px-3 py-1.5 bg-muted border border-border rounded text-sm" /></div>
                    <div><label className="text-xs text-muted-foreground">Text Transform</label><select value={h3Styles.textTransform} onChange={(e) => setH3Styles({ ...h3Styles, textTransform: e.target.value as any })} className="w-full px-3 py-1.5 bg-muted border border-border rounded text-sm"><option value="none">None</option><option value="uppercase">Uppercase</option><option value="lowercase">Lowercase</option><option value="capitalize">Capitalize</option></select></div>
                  </div>
                </>
              )}

              {editingElement === "h4" && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm">Edit H4 Styles</h3>
                    <button onClick={closeEditModal} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    <div><label className="text-xs text-muted-foreground">Font Family</label><GoogleFontPicker value={headingFont} onChange={setHeadingFont} /></div>
                    <div><label className="text-xs text-muted-foreground">Font Size</label><input type="text" value={h4Styles.fontSize} onChange={(e) => setH4Styles({ ...h4Styles, fontSize: e.target.value })} className="w-full px-3 py-1.5 bg-muted border border-border rounded text-sm" /></div>
                    <div><label className="text-xs text-muted-foreground">Font Weight</label><select value={h4Styles.fontWeight} onChange={(e) => setH4Styles({ ...h4Styles, fontWeight: e.target.value })} className="w-full px-3 py-1.5 bg-muted border border-border rounded text-sm"><option value="300">Light</option><option value="400">Normal</option><option value="500">Medium</option><option value="600">Semi-Bold</option><option value="700">Bold</option><option value="800">Extra-Bold</option></select></div>
                    <div><label className="text-xs text-muted-foreground">Line Height</label><input type="text" value={h4Styles.lineHeight} onChange={(e) => setH4Styles({ ...h4Styles, lineHeight: e.target.value })} className="w-full px-3 py-1.5 bg-muted border border-border rounded text-sm" /></div>
                    <div><label className="text-xs text-muted-foreground">Letter Spacing</label><input type="text" value={h4Styles.letterSpacing} onChange={(e) => setH4Styles({ ...h4Styles, letterSpacing: e.target.value })} className="w-full px-3 py-1.5 bg-muted border border-border rounded text-sm" /></div>
                    <div><label className="text-xs text-muted-foreground">Text Transform</label><select value={h4Styles.textTransform} onChange={(e) => setH4Styles({ ...h4Styles, textTransform: e.target.value as any })} className="w-full px-3 py-1.5 bg-muted border border-border rounded text-sm"><option value="none">None</option><option value="uppercase">Uppercase</option><option value="lowercase">Lowercase</option><option value="capitalize">Capitalize</option></select></div>
                  </div>
                </>
              )}

              {editingElement === "h5" && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm">Edit H5 Styles</h3>
                    <button onClick={closeEditModal} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    <div><label className="text-xs text-muted-foreground">Font Family</label><GoogleFontPicker value={headingFont} onChange={setHeadingFont} /></div>
                    <div><label className="text-xs text-muted-foreground">Font Size</label><input type="text" value={h5Styles.fontSize} onChange={(e) => setH5Styles({ ...h5Styles, fontSize: e.target.value })} className="w-full px-3 py-1.5 bg-muted border border-border rounded text-sm" /></div>
                    <div><label className="text-xs text-muted-foreground">Font Weight</label><select value={h5Styles.fontWeight} onChange={(e) => setH5Styles({ ...h5Styles, fontWeight: e.target.value })} className="w-full px-3 py-1.5 bg-muted border border-border rounded text-sm"><option value="300">Light</option><option value="400">Normal</option><option value="500">Medium</option><option value="600">Semi-Bold</option><option value="700">Bold</option><option value="800">Extra-Bold</option></select></div>
                    <div><label className="text-xs text-muted-foreground">Line Height</label><input type="text" value={h5Styles.lineHeight} onChange={(e) => setH5Styles({ ...h5Styles, lineHeight: e.target.value })} className="w-full px-3 py-1.5 bg-muted border border-border rounded text-sm" /></div>
                    <div><label className="text-xs text-muted-foreground">Letter Spacing</label><input type="text" value={h5Styles.letterSpacing} onChange={(e) => setH5Styles({ ...h5Styles, letterSpacing: e.target.value })} className="w-full px-3 py-1.5 bg-muted border border-border rounded text-sm" /></div>
                    <div><label className="text-xs text-muted-foreground">Text Transform</label><select value={h5Styles.textTransform} onChange={(e) => setH5Styles({ ...h5Styles, textTransform: e.target.value as any })} className="w-full px-3 py-1.5 bg-muted border border-border rounded text-sm"><option value="none">None</option><option value="uppercase">Uppercase</option><option value="lowercase">Lowercase</option><option value="capitalize">Capitalize</option></select></div>
                  </div>
                </>
              )}

              {editingElement === "h6" && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm">Edit H6 Styles</h3>
                    <button onClick={closeEditModal} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    <div><label className="text-xs text-muted-foreground">Font Family</label><GoogleFontPicker value={headingFont} onChange={setHeadingFont} /></div>
                    <div><label className="text-xs text-muted-foreground">Font Size</label><input type="text" value={h6Styles.fontSize} onChange={(e) => setH6Styles({ ...h6Styles, fontSize: e.target.value })} className="w-full px-3 py-1.5 bg-muted border border-border rounded text-sm" /></div>
                    <div><label className="text-xs text-muted-foreground">Font Weight</label><select value={h6Styles.fontWeight} onChange={(e) => setH6Styles({ ...h6Styles, fontWeight: e.target.value })} className="w-full px-3 py-1.5 bg-muted border border-border rounded text-sm"><option value="300">Light</option><option value="400">Normal</option><option value="500">Medium</option><option value="600">Semi-Bold</option><option value="700">Bold</option><option value="800">Extra-Bold</option></select></div>
                    <div><label className="text-xs text-muted-foreground">Line Height</label><input type="text" value={h6Styles.lineHeight} onChange={(e) => setH6Styles({ ...h6Styles, lineHeight: e.target.value })} className="w-full px-3 py-1.5 bg-muted border border-border rounded text-sm" /></div>
                    <div><label className="text-xs text-muted-foreground">Letter Spacing</label><input type="text" value={h6Styles.letterSpacing} onChange={(e) => setH6Styles({ ...h6Styles, letterSpacing: e.target.value })} className="w-full px-3 py-1.5 bg-muted border border-border rounded text-sm" /></div>
                    <div><label className="text-xs text-muted-foreground">Text Transform</label><select value={h6Styles.textTransform} onChange={(e) => setH6Styles({ ...h6Styles, textTransform: e.target.value as any })} className="w-full px-3 py-1.5 bg-muted border border-border rounded text-sm"><option value="none">None</option><option value="uppercase">Uppercase</option><option value="lowercase">Lowercase</option><option value="capitalize">Capitalize</option></select></div>
                  </div>
                </>
              )}

              {/* Body Text Styles */}
              {editingElement === "body-text" && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm">Edit Body Text Styles</h3>
                    <button onClick={closeEditModal} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    <div><label className="text-xs text-muted-foreground">Font Family</label><GoogleFontPicker value={bodyFont} onChange={setBodyFont} /></div>
                    <div><label className="text-xs text-muted-foreground">Font Size</label><input type="text" value={bodyTextStyles.fontSize} onChange={(e) => setBodyTextStyles({ ...bodyTextStyles, fontSize: e.target.value })} className="w-full px-3 py-1.5 bg-muted border border-border rounded text-sm" /></div>
                    <div><label className="text-xs text-muted-foreground">Font Weight</label><select value={bodyTextStyles.fontWeight} onChange={(e) => setBodyTextStyles({ ...bodyTextStyles, fontWeight: e.target.value })} className="w-full px-3 py-1.5 bg-muted border border-border rounded text-sm"><option value="300">Light</option><option value="400">Normal</option><option value="500">Medium</option><option value="600">Semi-Bold</option><option value="700">Bold</option></select></div>
                    <div><label className="text-xs text-muted-foreground">Line Height</label><input type="text" value={bodyTextStyles.lineHeight} onChange={(e) => setBodyTextStyles({ ...bodyTextStyles, lineHeight: e.target.value })} className="w-full px-3 py-1.5 bg-muted border border-border rounded text-sm" /></div>
                    <div><label className="text-xs text-muted-foreground">Letter Spacing</label><input type="text" value={bodyTextStyles.letterSpacing} onChange={(e) => setBodyTextStyles({ ...bodyTextStyles, letterSpacing: e.target.value })} className="w-full px-3 py-1.5 bg-muted border border-border rounded text-sm" /></div>
                  </div>
                </>
              )}

              {/* Button Styles */}
              {editingElement === "button" && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm">Edit Button Styles</h3>
                    <button onClick={closeEditModal} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    <div className="text-xs font-semibold text-muted-foreground mt-2">Padding</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="text-xs text-muted-foreground">Top</label><input type="text" value={buttonStyles.paddingTop} onChange={(e) => setButtonStyles({ ...buttonStyles, paddingTop: e.target.value })} className="w-full px-2 py-1 bg-muted border border-border rounded text-xs" /></div>
                      <div><label className="text-xs text-muted-foreground">Right</label><input type="text" value={buttonStyles.paddingRight} onChange={(e) => setButtonStyles({ ...buttonStyles, paddingRight: e.target.value })} className="w-full px-2 py-1 bg-muted border border-border rounded text-xs" /></div>
                      <div><label className="text-xs text-muted-foreground">Bottom</label><input type="text" value={buttonStyles.paddingBottom} onChange={(e) => setButtonStyles({ ...buttonStyles, paddingBottom: e.target.value })} className="w-full px-2 py-1 bg-muted border border-border rounded text-xs" /></div>
                      <div><label className="text-xs text-muted-foreground">Left</label><input type="text" value={buttonStyles.paddingLeft} onChange={(e) => setButtonStyles({ ...buttonStyles, paddingLeft: e.target.value })} className="w-full px-2 py-1 bg-muted border border-border rounded text-xs" /></div>
                    </div>
                    <div className="text-xs font-semibold text-muted-foreground mt-2">Colors</div>
                    <div><label className="text-xs text-muted-foreground">Background Color</label><input type="color" value={buttonStyles.backgroundColor} onChange={(e) => setButtonStyles({ ...buttonStyles, backgroundColor: e.target.value })} className="w-full h-10 rounded border border-border cursor-pointer" /></div>
                    <div><label className="text-xs text-muted-foreground">Text Color</label><input type="color" value={buttonStyles.textColor} onChange={(e) => setButtonStyles({ ...buttonStyles, textColor: e.target.value })} className="w-full h-10 rounded border border-border cursor-pointer" /></div>
                    <div className="text-xs font-semibold text-muted-foreground mt-2">Border</div>
                    <div><label className="text-xs text-muted-foreground">Border Radius</label><input type="text" value={buttonStyles.borderRadius} onChange={(e) => setButtonStyles({ ...buttonStyles, borderRadius: e.target.value })} className="w-full px-2 py-1 bg-muted border border-border rounded text-xs" /></div>
                    <div><label className="text-xs text-muted-foreground">Border Width</label><input type="text" value={buttonStyles.borderWidth} onChange={(e) => setButtonStyles({ ...buttonStyles, borderWidth: e.target.value })} className="w-full px-2 py-1 bg-muted border border-border rounded text-xs" /></div>
                    <div><label className="text-xs text-muted-foreground">Border Color</label><input type="color" value={buttonStyles.borderColor} onChange={(e) => setButtonStyles({ ...buttonStyles, borderColor: e.target.value })} className="w-full h-10 rounded border border-border cursor-pointer" /></div>
                    <div className="text-xs font-semibold text-muted-foreground mt-2">Typography</div>
                    <div><label className="text-xs text-muted-foreground">Font Size</label><input type="text" value={buttonStyles.fontSize} onChange={(e) => setButtonStyles({ ...buttonStyles, fontSize: e.target.value })} className="w-full px-2 py-1 bg-muted border border-border rounded text-xs" /></div>
                    <div><label className="text-xs text-muted-foreground">Font Weight</label><select value={buttonStyles.fontWeight} onChange={(e) => setButtonStyles({ ...buttonStyles, fontWeight: e.target.value })} className="w-full px-2 py-1 bg-muted border border-border rounded text-xs"><option value="400">Normal</option><option value="500">Medium</option><option value="600">Semi-Bold</option><option value="700">Bold</option></select></div>
                    <div className="text-xs font-semibold text-muted-foreground mt-2">Hover State</div>
                    <div><label className="text-xs text-muted-foreground">Hover Background</label><input type="color" value={buttonStyles.hoverBackgroundColor} onChange={(e) => setButtonStyles({ ...buttonStyles, hoverBackgroundColor: e.target.value })} className="w-full h-10 rounded border border-border cursor-pointer" /></div>
                    <div><label className="text-xs text-muted-foreground">Hover Text Color</label><input type="color" value={buttonStyles.hoverTextColor} onChange={(e) => setButtonStyles({ ...buttonStyles, hoverTextColor: e.target.value })} className="w-full h-10 rounded border border-border cursor-pointer" /></div>
                    <div><label className="text-xs text-muted-foreground">Hover Transform</label><input type="text" value={buttonStyles.hoverTransform} onChange={(e) => setButtonStyles({ ...buttonStyles, hoverTransform: e.target.value })} className="w-full px-2 py-1 bg-muted border border-border rounded text-xs" /></div>
                    <div><label className="text-xs text-muted-foreground">Transition</label><input type="text" value={buttonStyles.transition} onChange={(e) => setButtonStyles({ ...buttonStyles, transition: e.target.value })} className="w-full px-2 py-1 bg-muted border border-border rounded text-xs" /></div>
                  </div>
                </>
              )}

              {/* Link Styles */}
              {editingElement === "link" && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm">Edit Link Styles</h3>
                    <button onClick={closeEditModal} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    <div className="text-xs font-semibold text-muted-foreground mt-2">Default State</div>
                    <div><label className="text-xs text-muted-foreground">Color</label><input type="color" value={linkStyles.color} onChange={(e) => setLinkStyles({ ...linkStyles, color: e.target.value })} className="w-full h-10 rounded border border-border cursor-pointer" /></div>
                    <div><label className="text-xs text-muted-foreground">Text Decoration</label><select value={linkStyles.textDecoration} onChange={(e) => setLinkStyles({ ...linkStyles, textDecoration: e.target.value as any })} className="w-full px-2 py-1 bg-muted border border-border rounded text-xs"><option value="none">None</option><option value="underline">Underline</option><option value="line-through">Line Through</option></select></div>
                    <div className="text-xs font-semibold text-muted-foreground mt-2">Hover State</div>
                    <div><label className="text-xs text-muted-foreground">Hover Color</label><input type="color" value={linkStyles.hoverColor} onChange={(e) => setLinkStyles({ ...linkStyles, hoverColor: e.target.value })} className="w-full h-10 rounded border border-border cursor-pointer" /></div>
                    <div><label className="text-xs text-muted-foreground">Hover Decoration</label><select value={linkStyles.hoverTextDecoration} onChange={(e) => setLinkStyles({ ...linkStyles, hoverTextDecoration: e.target.value as any })} className="w-full px-2 py-1 bg-muted border border-border rounded text-xs"><option value="none">None</option><option value="underline">Underline</option><option value="line-through">Line Through</option></select></div>
                    <div className="text-xs font-semibold text-muted-foreground mt-2">Typography</div>
                    <div><label className="text-xs text-muted-foreground">Font Weight</label><select value={linkStyles.fontWeight} onChange={(e) => setLinkStyles({ ...linkStyles, fontWeight: e.target.value })} className="w-full px-2 py-1 bg-muted border border-border rounded text-xs"><option value="300">Light</option><option value="400">Normal</option><option value="500">Medium</option><option value="600">Semi-Bold</option><option value="700">Bold</option></select></div>
                    <div><label className="text-xs text-muted-foreground">Transition</label><input type="text" value={linkStyles.transition} onChange={(e) => setLinkStyles({ ...linkStyles, transition: e.target.value })} className="w-full px-2 py-1 bg-muted border border-border rounded text-xs" /></div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div
          className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4"
          onClick={closeImportModal}
        >
          <div
            className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-border flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="font-semibold text-lg">
                  {importMethod === "style-kit" && "Import Style Kit JSON"}
                  {importMethod === "brand-fetch" && "Fetch Brand Styles"}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {importMethod === "style-kit" &&
                    "Import Elementor Style Kit JSON to generate CSS"}
                  {importMethod === "brand-fetch" &&
                    "Fetch brand assets: logos, colors, fonts, and company info"}
                </p>
              </div>
              <button
                onClick={closeImportModal}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <Code className="w-5 h-5 rotate-45" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {importMethod === "style-kit" && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Paste your Elementor Style Kit JSON or upload a file.
                  </p>
                  <textarea
                    placeholder='{"system_colors": [...], "custom_colors": [...], ...}'
                    className="w-full h-64 px-3 py-2 bg-muted border border-border rounded-lg font-mono text-xs resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                    Import Style Kit
                  </button>
                </div>
              )}

              {importMethod === "brand-fetch" && (
                <BrandfetchImporter
                  onImport={async (data) => {
                    console.log("📦 Brandfetch data imported:", data);

                    // Update Site Information state
                    setCompanyName(data.companyInfo.name);
                    setCompanyTagline(data.companyInfo.tagline);
                    setCompanyDescription(data.companyInfo.description);

                    // Update style settings
                    if (data.colors.length > 0) {
                      setPrimaryColor(data.colors[0]);
                      if (data.colors.length > 1) {
                        setSecondaryColor(data.colors[1]);
                      }
                    }

                    if (data.fonts.length > 0) {
                      setHeadingFont(data.fonts[0]);
                      if (data.fonts.length > 1) {
                        setBodyFont(data.fonts[1]);
                      } else {
                        setBodyFont(data.fonts[0]);
                      }
                    }

                    // Generate comprehensive CSS with !important tags
                    let brandCss = "\n\n/* ========== Brand Styles from Brandfetch ========== */\n\n";

                    // CSS Variables
                    brandCss += ":root {\n";
                    data.colors.forEach((color, idx) => {
                      brandCss += `  --brand-color-${idx + 1}: ${color};\n`;
                    });
                    data.fonts.forEach((font, idx) => {
                      brandCss += `  --brand-font-${idx + 1}: "${font}", system-ui, sans-serif;\n`;
                    });
                    brandCss += "}\n\n";

                    // Company Info as comments
                    brandCss += `/* Company: ${data.companyInfo.name}\n`;
                    if (data.companyInfo.tagline) brandCss += `   Tagline: ${data.companyInfo.tagline}\n`;
                    if (data.companyInfo.description) brandCss += `   Description: ${data.companyInfo.description}\n`;
                    brandCss += "*/\n\n";

                    // Typography
                    brandCss += `/* Typography */\n`;
                    brandCss += `body {\n`;
                    brandCss += `  font-family: var(--brand-font-${data.fonts.length > 1 ? 2 : 1}), system-ui, sans-serif !important;\n`;
                    brandCss += `  color: ${bodyTextColor} !important;\n`;
                    brandCss += `}\n\n`;

                    brandCss += `h1, h2, h3, h4, h5, h6 {\n`;
                    brandCss += `  font-family: var(--brand-font-1), system-ui, sans-serif !important;\n`;
                    brandCss += `  color: ${headingTextColor} !important;\n`;
                    brandCss += `}\n\n`;

                    // Buttons
                    brandCss += `/* Buttons */\n`;
                    brandCss += `.btn, button, .button {\n`;
                    brandCss += `  border-radius: ${buttonBorderRadius} !important;\n`;
                    brandCss += `  padding: 0.5rem 1rem !important;\n`;
                    brandCss += `  font-weight: 500 !important;\n`;
                    brandCss += `  cursor: pointer !important;\n`;
                    brandCss += `  transition: all 0.2s ease !important;\n`;
                    brandCss += `}\n\n`;

                    brandCss += `.btn-primary, .button-primary {\n`;
                    brandCss += `  background-color: var(--brand-color-1) !important;\n`;
                    brandCss += `  color: white !important;\n`;
                    brandCss += `  border: none !important;\n`;
                    brandCss += `}\n\n`;

                    brandCss += `.btn-primary:hover, .button-primary:hover {\n`;
                    brandCss += `  opacity: 0.9 !important;\n`;
                    brandCss += `  transform: translateY(-1px) !important;\n`;
                    brandCss += `}\n\n`;

                    if (data.colors.length > 1) {
                      brandCss += `.btn-secondary, .button-secondary {\n`;
                      brandCss += `  background-color: var(--brand-color-2) !important;\n`;
                      brandCss += `  color: white !important;\n`;
                      brandCss += `  border: none !important;\n`;
                      brandCss += `}\n\n`;

                      brandCss += `.btn-secondary:hover, .button-secondary:hover {\n`;
                      brandCss += `  opacity: 0.9 !important;\n`;
                      brandCss += `  transform: translateY(-1px) !important;\n`;
                      brandCss += `}\n\n`;
                    }

                    // Links
                    brandCss += `/* Links */\n`;
                    brandCss += `a {\n`;
                    brandCss += `  color: ${linkColor} !important;\n`;
                    brandCss += `  text-decoration: underline !important;\n`;
                    brandCss += `  transition: color 0.2s ease !important;\n`;
                    brandCss += `}\n\n`;

                    brandCss += `a:hover {\n`;
                    brandCss += `  color: ${linkHoverColor} !important;\n`;
                    brandCss += `}\n\n`;

                    // Append to global CSS
                    const updatedCss = globalCss + brandCss;
                    setGlobalCss(updatedCss);

                    // Switch to Preview view
                    setViewMode("preview");

                    showToast("Brand styles imported successfully");
                    closeImportModal();
                  }}
                  onClose={closeImportModal}
                  playgroundReady={false}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI CSS Generation Modal */}
      {showGenerateModal && (
        <div
          className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4"
          onClick={() => setShowGenerateModal(false)}
        >
          <div
            className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-border flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="font-semibold text-lg">Generate CSS with AI</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Describe the CSS you want to generate using Claude Haiku 4.5
                </p>
              </div>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <Code className="w-5 h-5 rotate-45" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium block mb-2">
                  Describe the CSS you want to generate
                </label>
                <textarea
                  value={generatePrompt}
                  onChange={(e) => setGeneratePrompt(e.target.value)}
                  placeholder="E.g., Create modern card styles with shadows and hover effects, add gradient backgrounds for hero sections..."
                  className="w-full h-48 px-3 py-2 bg-muted border border-border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                  disabled={isGenerating}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Heading Font
                  </label>
                  <div className="px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm truncate">
                    {headingFont}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Body Font
                  </label>
                  <div className="px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm truncate">
                    {bodyFont}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border border-border rounded-lg">
                    <div
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: primaryColor }}
                    />
                    <span className="text-sm">{primaryColor}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Secondary Color
                  </label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border border-border rounded-lg">
                    <div
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: secondaryColor }}
                    />
                    <span className="text-sm">{secondaryColor}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowGenerateModal(false)}
                  disabled={isGenerating}
                  className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={generateCssWithAI}
                  disabled={isGenerating || !generatePrompt.trim()}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Generate CSS
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-muted-foreground">
                Powered by Claude Haiku 4.5 via Vercel AI Gateway
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showNotification && (
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-3 rounded-lg shadow-lg z-[9999] animate-in slide-in-from-bottom">
          {notificationMessage}
        </div>
      )}
    </div>
  );
}
