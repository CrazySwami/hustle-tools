"use client";

import { useState, useEffect } from "react";
import { useGlobalStylesheet } from "@/lib/global-stylesheet-context";
import { useTheme } from "next-themes";
import Editor from "@monaco-editor/react";
import { PageExtractor } from "@/components/page-extractor/PageExtractor";
import { analyzeCSSWithAI } from "@/lib/css-analyzer";
import { CSSClassExplorer } from "./CSSClassExplorer";

interface UnifiedStyleKitProps {
  chatVisible?: boolean;
  setChatVisible?: (visible: boolean) => void;
  tabBarVisible?: boolean;
  setTabBarVisible?: (visible: boolean) => void;
  isTabVisible?: boolean;
  playgroundReady?: boolean;
}

type ViewMode = "css-editor" | "style-kit" | "page-extract" | "class-explorer";

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

  const [viewMode, setViewMode] = useState<ViewMode>("css-editor");
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
                <h3 className="font-semibold text-sm md:text-base">Advanced Editor</h3>
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
                className="flex-1 px-3 py-2 text-sm border border-border hover:bg-muted rounded transition-colors"
              >
                Reset
              </button>
              <button
                onClick={saveCssChanges}
                className="flex-1 px-3 py-2 text-sm border border-border hover:bg-muted rounded transition-colors"
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
                <h3 className="font-semibold text-sm md:text-base">StyleKit JSON Converter</h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={loadStyleKit}
                  disabled={!playgroundReady || loadingStyleKit}
                  className="px-3 py-1.5 text-xs border border-border hover:bg-muted rounded transition-colors disabled:opacity-50"
                >
                  Load
                </button>
                <button
                  onClick={saveStyleKit}
                  disabled={!playgroundReady || !styleKitData || loadingStyleKit}
                  className="px-3 py-1.5 text-xs border border-border hover:bg-muted rounded transition-colors disabled:opacity-50"
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
                    className="px-4 py-2 border border-border hover:bg-muted rounded transition-colors"
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
              onClose={() => setViewMode("css-editor")}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No CSS classes available. Extract CSS from a page first.
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full w-full relative overflow-hidden bg-background">
      {/* Mobile View Mode Selector */}
      {isMobile && (
        <div className="flex overflow-x-auto border-b border-border bg-muted/50 flex-shrink-0">
          <button
            onClick={() => setViewMode("css-editor")}
            className={`flex-1 min-w-[100px] px-3 py-2 text-xs font-medium transition-colors ${
              viewMode === "css-editor"
                ? "bg-background border-b-2 border-primary"
                : "text-muted-foreground"
            }`}
          >
            Advanced Editor
          </button>
          <button
            onClick={() => setViewMode("style-kit")}
            className={`flex-1 min-w-[120px] px-3 py-2 text-xs font-medium transition-colors ${
              viewMode === "style-kit"
                ? "bg-background border-b-2 border-primary"
                : "text-muted-foreground"
            }`}
          >
            StyleKit JSON
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
