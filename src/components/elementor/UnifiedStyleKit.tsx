"use client";

import { useState, useEffect } from "react";
import { useGlobalStylesheet } from "@/lib/global-stylesheet-context";
import { useTheme } from "next-themes";
import Editor from "@monaco-editor/react";
import { PageExtractor } from "@/components/page-extractor/PageExtractor";
import { analyzeCSSWithAI } from "@/lib/css-analyzer";
import { CSSClassExplorer } from "./CSSClassExplorer";
import { Palette, Code, Download, Upload, Wand2, Eye, Settings } from "lucide-react";

interface UnifiedStyleKitProps {
  chatVisible?: boolean;
  setChatVisible?: (visible: boolean) => void;
  tabBarVisible?: boolean;
  setTabBarVisible?: (visible: boolean) => void;
  isTabVisible?: boolean;
  playgroundReady?: boolean;
}

type ViewMode = "preview" | "css-editor" | "style-kit" | "page-extract" | "class-explorer";

export function UnifiedStyleKit({
  chatVisible,
  setChatVisible,
  tabBarVisible,
  setTabBarVisible,
  isTabVisible = true,
  playgroundReady = false,
}: UnifiedStyleKitProps) {
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

  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [isMobile, setIsMobile] = useState(false);
  const [editedCss, setEditedCss] = useState(globalCss);
  const [autoImportant, setAutoImportant] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  // Elementor Style Kit state
  const [styleKitData, setStyleKitData] = useState<any>(null);
  const [loadingStyleKit, setLoadingStyleKit] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Sync edited CSS with global CSS
  useEffect(() => {
    setEditedCss(globalCss);
  }, [globalCss]);

  // Load Elementor Style Kit
  const loadStyleKit = async () => {
    if (!playgroundReady) {
      showToast("WordPress Playground not ready. Please wait...");
      return;
    }

    setLoadingStyleKit(true);
    try {
      const result = await (window as any).getElementorStyleKit();
      setStyleKitData(result);
      showToast("Style Kit loaded successfully");
    } catch (err: any) {
      showToast(`Failed to load Style Kit: ${err.message}`);
    } finally {
      setLoadingStyleKit(false);
    }
  };

  // Save Elementor Style Kit
  const saveStyleKit = async () => {
    if (!playgroundReady || !styleKitData) return;

    setLoadingStyleKit(true);
    try {
      await (window as any).setElementorStyleKit(styleKitData);
      showToast("Style Kit saved to WordPress");
    } catch (err: any) {
      showToast(`Failed to save Style Kit: ${err.message}`);
    } finally {
      setLoadingStyleKit(false);
    }
  };

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
      // Add !important to all rules that don't already have it
      finalCss = finalCss.replace(
        /([^{]+\{[^}]+?)([;\s])(\})/g,
        (match, before, sep, close) => {
          if (before.includes("!important")) return match;
          return before + " !important" + sep + close;
        }
      );
    }

    setGlobalCss(finalCss);
    showToast("CSS updated - previews will refresh");
  };

  // Pull from WordPress
  const handlePull = async () => {
    try {
      await pullFromWordPress();
      showToast("Pulled stylesheet from WordPress");
    } catch (err: any) {
      showToast(`Pull failed: ${err.message}`);
    }
  };

  // Push to WordPress
  const handlePush = async () => {
    try {
      await pushToWordPress();
      showToast("Pushed stylesheet to WordPress");
    } catch (err: any) {
      showToast(`Push failed: ${err.message}`);
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

  // Render view mode content
  const renderContent = () => {
    switch (viewMode) {
      case "css-editor":
        return (
          <div className="flex flex-col h-full">
            {/* Editor Header */}
            <div className="flex items-center justify-between p-3 md:p-4 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                <h3 className="font-semibold text-sm md:text-base">CSS Editor</h3>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-xs md:text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoImportant}
                    onChange={(e) => setAutoImportant(e.target.checked)}
                    className="rounded"
                  />
                  <span className="hidden sm:inline">Auto !important</span>
                  <span className="sm:hidden">!imp</span>
                </label>
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
                  minimap: { enabled: !isMobile },
                  fontSize: isMobile ? 12 : 14,
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  automaticLayout: true,
                }}
              />
            </div>

            {/* Editor Footer */}
            <div className="p-3 md:p-4 border-t border-border flex gap-2 flex-shrink-0">
              <button
                onClick={() => setEditedCss(globalCss)}
                className="flex-1 px-3 py-2 text-sm bg-muted hover:bg-muted/80 rounded-lg transition-colors"
              >
                Reset
              </button>
              <button
                onClick={saveCssChanges}
                className="flex-1 px-3 py-2 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        );

      case "style-kit":
        return (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Style Kit Header */}
            <div className="flex items-center justify-between p-3 md:p-4 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                <h3 className="font-semibold text-sm md:text-base">Elementor Style Kit</h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={loadStyleKit}
                  disabled={!playgroundReady || loadingStyleKit}
                  className="px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 rounded-lg transition-colors disabled:opacity-50"
                >
                  Load
                </button>
                <button
                  onClick={saveStyleKit}
                  disabled={!playgroundReady || !styleKitData || loadingStyleKit}
                  className="px-3 py-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>

            {/* Style Kit Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {!playgroundReady ? (
                <div className="text-center text-muted-foreground py-8">
                  WordPress Playground not ready. Please launch WordPress first.
                </div>
              ) : !styleKitData ? (
                <div className="text-center text-muted-foreground py-8">
                  <button
                    onClick={loadStyleKit}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                  >
                    Load Style Kit
                  </button>
                </div>
              ) : (
                <div className="space-y-4 max-w-2xl mx-auto">
                  <p className="text-sm text-muted-foreground">
                    Elementor Style Kit integration coming soon. For now, use the CSS Editor to manage global styles.
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case "page-extract":
        return (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Page Extractor Header */}
            <div className="flex items-center justify-between p-3 md:p-4 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4" />
                <h3 className="font-semibold text-sm md:text-base">Extract CSS from Page</h3>
              </div>
            </div>

            {/* Page Extractor Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <PageExtractor
                onCssExtracted={async (extractedCss: string, sourceUrl?: string) => {
                  const separator = "\n\n/* ========== Extracted CSS ========== */\n\n";
                  const updatedCss = globalCss + separator + extractedCss;
                  setGlobalCss(updatedCss);

                  try {
                    const summary = await analyzeCSSWithAI(extractedCss, sourceUrl);
                    setDesignSystemSummary(summary);
                  } catch (error) {
                    console.error("Failed to analyze CSS:", error);
                  }

                  showToast("CSS extracted and added to stylesheet");
                  setViewMode("css-editor");
                }}
              />
            </div>
          </div>
        );

      case "class-explorer":
        return designSystemSummary ? (
          <div className="flex flex-col h-full overflow-hidden">
            <CSSClassExplorer
              designSystemSummary={designSystemSummary}
              onClose={() => setViewMode("preview")}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No CSS classes available. Extract CSS from a page first.
          </div>
        );

      case "preview":
      default:
        return (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Preview Header */}
            <div className="p-3 md:p-4 border-b border-border flex-shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-sm md:text-base font-semibold">Style Guide Preview</span>
                {themeName && (
                  <span className="text-xs text-muted-foreground">
                    {themeName} {themeVersion && `v${themeVersion}`}
                  </span>
                )}
              </div>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              <style>{globalCss}</style>

              <div className="max-w-4xl mx-auto space-y-8">
                {/* Typography */}
                <section>
                  <h2 className="text-lg font-semibold mb-4 pb-2 border-b">Typography</h2>
                  <h1>Heading 1</h1>
                  <h2>Heading 2</h2>
                  <h3>Heading 3</h3>
                  <h4>Heading 4</h4>
                  <h5>Heading 5</h5>
                  <h6>Heading 6</h6>
                  <p className="mt-4">
                    Body text with <a href="#">a link</a>. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  </p>
                </section>

                {/* CSS Variables */}
                {cssVariables.length > 0 && (
                  <section>
                    <h2 className="text-lg font-semibold mb-4 pb-2 border-b">CSS Variables</h2>
                    <div className="grid grid-cols-1 gap-2">
                      {cssVariables.slice(0, 10).map((variable, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-2 bg-muted rounded text-xs font-mono"
                        >
                          <div className="font-semibold text-primary min-w-[120px]">{variable.name}</div>
                          <div className="text-muted-foreground truncate">{variable.value}</div>
                        </div>
                      ))}
                      {cssVariables.length > 10 && (
                        <div className="text-xs text-muted-foreground text-center py-2">
                          +{cssVariables.length - 10} more variables
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {/* Color Swatches */}
                {cssVariables.filter((v) => v.name.includes("color") || v.name.includes("bg")).length > 0 && (
                  <section>
                    <h2 className="text-lg font-semibold mb-4 pb-2 border-b">Colors</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {cssVariables
                        .filter((v) => v.name.includes("color") || v.name.includes("bg"))
                        .slice(0, 8)
                        .map((variable, idx) => (
                          <div key={idx} className="flex flex-col gap-2">
                            <div
                              className="w-full h-16 rounded border"
                              style={{ background: variable.value }}
                            />
                            <div className="text-xs">
                              <div className="font-semibold truncate">{variable.name}</div>
                              <div className="text-muted-foreground truncate">{variable.value}</div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </section>
                )}

                {/* Buttons */}
                <section>
                  <h2 className="text-lg font-semibold mb-4 pb-2 border-b">Buttons</h2>
                  <div className="flex flex-wrap gap-2">
                    <button className="btn-primary">Primary</button>
                    <button className="btn-secondary">Secondary</button>
                    <button className="btn-outline">Outline</button>
                    <button className="btn-ghost">Ghost</button>
                  </div>
                </section>

                {/* Spacing */}
                <section>
                  <h2 className="text-lg font-semibold mb-4 pb-2 border-b">Spacing Scale</h2>
                  <div className="space-y-2">
                    {[4, 8, 12, 16, 24, 32].map((size) => (
                      <div key={size} className="flex items-center gap-3">
                        <div className="w-12 text-xs text-muted-foreground">{size}px</div>
                        <div
                          className="h-6 bg-primary rounded"
                          style={{ width: `${size}px` }}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full w-full relative overflow-hidden bg-background">
      {/* Mobile View Mode Selector */}
      {isMobile && (
        <div className="flex overflow-x-auto border-b border-border bg-muted/50 flex-shrink-0">
          <button
            onClick={() => setViewMode("preview")}
            className={`flex-1 min-w-[80px] px-3 py-2 text-xs font-medium transition-colors ${
              viewMode === "preview"
                ? "bg-background border-b-2 border-primary"
                : "text-muted-foreground"
            }`}
          >
            <Eye className="w-4 h-4 mx-auto mb-1" />
            Preview
          </button>
          <button
            onClick={() => setViewMode("css-editor")}
            className={`flex-1 min-w-[80px] px-3 py-2 text-xs font-medium transition-colors ${
              viewMode === "css-editor"
                ? "bg-background border-b-2 border-primary"
                : "text-muted-foreground"
            }`}
          >
            <Code className="w-4 h-4 mx-auto mb-1" />
            CSS
          </button>
          <button
            onClick={() => setViewMode("style-kit")}
            className={`flex-1 min-w-[80px] px-3 py-2 text-xs font-medium transition-colors ${
              viewMode === "style-kit"
                ? "bg-background border-b-2 border-primary"
                : "text-muted-foreground"
            }`}
          >
            <Palette className="w-4 h-4 mx-auto mb-1" />
            Kit
          </button>
          <button
            onClick={() => setViewMode("page-extract")}
            className={`flex-1 min-w-[80px] px-3 py-2 text-xs font-medium transition-colors ${
              viewMode === "page-extract"
                ? "bg-background border-b-2 border-primary"
                : "text-muted-foreground"
            }`}
          >
            <Wand2 className="w-4 h-4 mx-auto mb-1" />
            Extract
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">{renderContent()}</div>

      {/* Toast Notification */}
      {showNotification && (
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-3 rounded-lg shadow-lg z-[9999] animate-in slide-in-from-bottom">
          {notificationMessage}
        </div>
      )}

    </div>
  );
}
