"use client";

import { useState, useRef, useEffect } from "react";
import { useGlobalStylesheet } from "@/lib/global-stylesheet-context";
import { useTheme } from "next-themes";
import { OptionsButton, type OptionItem } from "@/components/ui/OptionsButton";
import Editor from "@monaco-editor/react";
import { PageExtractor } from "@/components/page-extractor/PageExtractor";
import { analyzeCSSWithAI } from "@/lib/css-analyzer";
import { CSSClassExplorer } from "./CSSClassExplorer";

interface StyleGuideProps {
  chatVisible?: boolean;
  setChatVisible?: (visible: boolean) => void;
  tabBarVisible?: boolean;
  setTabBarVisible?: (visible: boolean) => void;
  isTabVisible?: boolean;
}

export function StyleGuide({
  chatVisible,
  setChatVisible,
  tabBarVisible,
  setTabBarVisible,
  isTabVisible = true,
}: StyleGuideProps = {}) {
  const {
    globalCss,
    setGlobalCss,
    designSystemSummary,
    setDesignSystemSummary,
    pullFromWordPress,
    pushToWordPress,
    isLoading,
    error,
    themeName,
    themeVersion,
    cssVariables,
    lastUpdated,
  } = useGlobalStylesheet();
  const { theme } = useTheme();

  const [showUpdateNotification, setShowUpdateNotification] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showPageExtractor, setShowPageExtractor] = useState(false);
  const [showClassExplorer, setShowClassExplorer] = useState(false);
  const [editedCss, setEditedCss] = useState(globalCss);
  const lastUpdateRef = useRef(lastUpdated);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Show notification when CSS updates (and propagates to previews)
  useEffect(() => {
    if (lastUpdated !== lastUpdateRef.current) {
      lastUpdateRef.current = lastUpdated;
      setShowUpdateNotification(true);

      // Auto-hide after 3 seconds
      const timer = setTimeout(() => {
        setShowUpdateNotification(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [lastUpdated]);

  // Handlers
  const handlePullFromWordPress = async () => {
    try {
      await pullFromWordPress();
    } catch (err: any) {
      console.error("Pull error:", err);
      alert(`Failed to pull stylesheet: ${err.message}`);
    }
  };

  const handlePushToWordPress = async () => {
    try {
      await pushToWordPress();
      alert("✅ Stylesheet pushed to WordPress successfully!");
    } catch (err: any) {
      console.error("Push error:", err);
      alert(`Failed to push stylesheet: ${err.message}`);
    }
  };

  const handleResetToDefault = async () => {
    if (
      !confirm(
        "Reset to WordPress theme default? This will discard all custom changes.",
      )
    ) {
      return;
    }

    try {
      await pullFromWordPress();
    } catch (err: any) {
      console.error("Reset error:", err);
      alert(`Failed to reset: ${err.message}`);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        position: "relative",
        overflow: "hidden",
        background: "var(--background)",
      }}
    >
      {/* Preview Header */}
      <div
        style={{
          padding: "12px 16px",
          background: "var(--muted)",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--foreground)",
          }}
        >
          Global Stylesheet Preview
        </span>
        {themeName && (
          <span style={{ fontSize: "12px", color: "#6b7280" }}>
            {themeName} {themeVersion && `v${themeVersion}`}
          </span>
        )}
      </div>

      {/* Preview Content */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px",
          background: "var(--background)",
        }}
      >
        {/* Apply global CSS */}
        <style>{globalCss}</style>

        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h1
            style={{ marginBottom: "8px", fontSize: "32px", fontWeight: 700 }}
          >
            Style Guide
          </h1>

          {themeName && (
            <p
              style={{
                color: "#6b7280",
                fontSize: "14px",
                marginBottom: "32px",
              }}
            >
              Theme: <strong>{themeName}</strong>{" "}
              {themeVersion && `(v${themeVersion})`}
            </p>
          )}

          {/* Typography Section */}
          <section style={{ marginBottom: "48px" }}>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: 600,
                marginBottom: "16px",
                color: "#111827",
                borderBottom: "2px solid #e5e7eb",
                paddingBottom: "8px",
              }}
            >
              Typography
            </h2>

            <h1>Heading 1</h1>
            <h2>Heading 2</h2>
            <h3>Heading 3</h3>
            <h4>Heading 4</h4>
            <h5>Heading 5</h5>
            <h6>Heading 6</h6>

            <p style={{ marginTop: "16px" }}>
              This is body text. Lorem ipsum dolor sit amet, consectetur
              adipiscing elit.
              <a href="#" style={{ marginLeft: "4px" }}>
                This is a link
              </a>
              .
            </p>

            <p style={{ fontSize: "14px", color: "#6b7280" }}>
              This is small text with muted color.
            </p>
          </section>

          {/* CSS Variables Section */}
          <section style={{ marginBottom: "48px" }}>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: 600,
                marginBottom: "16px",
                color: "#111827",
                borderBottom: "2px solid #e5e7eb",
                paddingBottom: "8px",
              }}
            >
              CSS Variables
            </h2>

            {cssVariables.length > 0 ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr",
                  gap: "8px",
                }}
              >
                {cssVariables.map((variable, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "200px 1fr",
                      gap: "12px",
                      padding: "8px 12px",
                      background: "#f9fafb",
                      border: "1px solid #e5e7eb",
                      borderRadius: "4px",
                      fontSize: "13px",
                      fontFamily: "monospace",
                    }}
                  >
                    <div style={{ fontWeight: 600, color: "#059669" }}>
                      {variable.name}
                    </div>
                    <div style={{ color: "#6b7280", wordBreak: "break-all" }}>
                      {variable.value}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "#6b7280", fontSize: "14px" }}>
                No CSS variables found. Add some to your stylesheet using{" "}
                <code>:root {"{ --primary-color: #0066cc; }"}</code>
              </p>
            )}
          </section>

          {/* Colors Section */}
          <section style={{ marginBottom: "48px" }}>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: 600,
                marginBottom: "16px",
                color: "#111827",
                borderBottom: "2px solid #e5e7eb",
                paddingBottom: "8px",
              }}
            >
              Color Swatches
            </h2>

            {cssVariables.length > 0 ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                  gap: "16px",
                }}
              >
                {cssVariables
                  .filter(
                    (v) =>
                      v.name.includes("color") ||
                      v.name.includes("bg") ||
                      v.name.includes("text"),
                  )
                  .map((variable, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          height: "60px",
                          background: variable.value,
                          border: "1px solid #e5e7eb",
                          borderRadius: "4px",
                        }}
                      />
                      <div style={{ fontSize: "12px" }}>
                        <div style={{ fontWeight: 600, color: "#111827" }}>
                          {variable.name}
                        </div>
                        <div style={{ color: "#6b7280" }}>{variable.value}</div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p style={{ color: "#6b7280", fontSize: "14px" }}>
                No CSS color variables found.
              </p>
            )}
          </section>

          {/* Buttons Section */}
          <section style={{ marginBottom: "48px" }}>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: 600,
                marginBottom: "16px",
                color: "#111827",
                borderBottom: "2px solid #e5e7eb",
                paddingBottom: "8px",
              }}
            >
              Buttons
            </h2>

            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
                marginBottom: "16px",
              }}
            >
              <button className="btn-primary">Primary Button</button>
              <button className="btn-secondary">Secondary Button</button>
              <button className="btn-outline">Outline Button</button>
              <button className="btn-ghost">Ghost Button</button>
            </div>

            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
                marginBottom: "16px",
              }}
            >
              <button className="btn-primary btn-sm">Small</button>
              <button className="btn-primary btn-md">Medium</button>
              <button className="btn-primary btn-lg">Large</button>
            </div>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <button className="btn-primary" disabled>
                Disabled
              </button>
            </div>
          </section>

          {/* Forms Section */}
          <section style={{ marginBottom: "48px" }}>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: 600,
                marginBottom: "16px",
                color: "#111827",
                borderBottom: "2px solid #e5e7eb",
                paddingBottom: "8px",
              }}
            >
              Form Elements
            </h2>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                maxWidth: "400px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  Text Input
                </label>
                <input
                  type="text"
                  placeholder="Enter text..."
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  Textarea
                </label>
                <textarea
                  placeholder="Enter text..."
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    fontSize: "14px",
                    resize: "vertical",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  Select
                </label>
                <select
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    fontSize: "14px",
                  }}
                >
                  <option>Option 1</option>
                  <option>Option 2</option>
                  <option>Option 3</option>
                </select>
              </div>

              <div
                style={{ display: "flex", gap: "8px", alignItems: "center" }}
              >
                <input type="checkbox" id="checkbox1" />
                <label htmlFor="checkbox1" style={{ fontSize: "14px" }}>
                  Checkbox
                </label>
              </div>

              <div
                style={{ display: "flex", gap: "8px", alignItems: "center" }}
              >
                <input type="radio" id="radio1" name="radio" />
                <label htmlFor="radio1" style={{ fontSize: "14px" }}>
                  Radio Button
                </label>
              </div>
            </div>
          </section>

          {/* Spacing Section */}
          <section style={{ marginBottom: "48px" }}>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: 600,
                marginBottom: "16px",
                color: "#111827",
                borderBottom: "2px solid #e5e7eb",
                paddingBottom: "8px",
              }}
            >
              Spacing Scale
            </h2>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {[4, 8, 12, 16, 24, 32, 48, 64].map((size) => (
                <div
                  key={size}
                  style={{ display: "flex", alignItems: "center", gap: "16px" }}
                >
                  <div
                    style={{
                      width: "60px",
                      fontSize: "14px",
                      color: "#6b7280",
                    }}
                  >
                    {size}px
                  </div>
                  <div
                    style={{
                      width: `${size}px`,
                      height: "24px",
                      background: "#3b82f6",
                      borderRadius: "2px",
                    }}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Borders & Shadows Section */}
          <section style={{ marginBottom: "48px" }}>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: 600,
                marginBottom: "16px",
                color: "#111827",
                borderBottom: "2px solid #e5e7eb",
                paddingBottom: "8px",
              }}
            >
              Borders & Shadows
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "16px",
              }}
            >
              <div
                style={{
                  padding: "24px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  textAlign: "center",
                  fontSize: "14px",
                }}
              >
                Border Radius: 4px
              </div>

              <div
                style={{
                  padding: "24px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  textAlign: "center",
                  fontSize: "14px",
                }}
              >
                Border Radius: 8px
              </div>

              <div
                style={{
                  padding: "24px",
                  border: "1px solid #d1d5db",
                  boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                  textAlign: "center",
                  fontSize: "14px",
                }}
              >
                Shadow: sm
              </div>

              <div
                style={{
                  padding: "24px",
                  border: "1px solid #d1d5db",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  textAlign: "center",
                  fontSize: "14px",
                }}
              >
                Shadow: md
              </div>

              <div
                style={{
                  padding: "24px",
                  border: "1px solid #d1d5db",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                  textAlign: "center",
                  fontSize: "14px",
                }}
              >
                Shadow: lg
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Update Notification Toast */}
      {showUpdateNotification && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            background: "#10b981",
            color: "#ffffff",
            padding: "12px 20px",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            fontSize: "14px",
            fontWeight: 500,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            animation: "slideIn 0.3s ease-out",
          }}
        >
          <span style={{ fontSize: "18px" }}>✓</span>
          Previews updated with new stylesheet
        </div>
      )}

      {/* Options Button */}
      <OptionsButton
        isMobile={isMobile}
        isVisible={isTabVisible}
        options={[
          // Edit CSS
          {
            label: "✏️ Edit CSS",
            onClick: () => {
              setEditedCss(globalCss);
              setShowEditor(true);
            },
          },
          // Page Extractor
          {
            label: "🔍 Extract CSS from Page",
            onClick: () => setShowPageExtractor(true),
          },
          // CSS Class Explorer
          {
            label: "📚 Browse CSS Classes",
            onClick: () => setShowClassExplorer(true),
            disabled: !designSystemSummary,
            divider: true,
          },
          // Pull from WordPress
          {
            label: "⬇️ Pull from WordPress",
            onClick: handlePullFromWordPress,
            disabled: isLoading,
          },
          // Push to WordPress
          {
            label: "⬆️ Push to WordPress",
            onClick: handlePushToWordPress,
            disabled: isLoading,
          },
          // Reset
          {
            label: "🔄 Reset to Default",
            onClick: handleResetToDefault,
            disabled: isLoading,
            divider: true,
          },
          // Chat toggle
          ...(setChatVisible
            ? [
                {
                  label: chatVisible ? "Hide Chat" : "Show Chat",
                  onClick: () => setChatVisible(!chatVisible),
                  type: "toggle" as const,
                  active: chatVisible,
                },
              ]
            : []),
          // Tab bar toggle
          ...(setTabBarVisible
            ? [
                {
                  label: tabBarVisible ? "Hide Tab Bar" : "Show Tab Bar",
                  onClick: () => setTabBarVisible(!tabBarVisible),
                  type: "toggle" as const,
                  active: tabBarVisible,
                },
              ]
            : []),
        ]}
      />

      {/* CSS Editor Modal */}
      {showEditor && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
          onClick={() => setShowEditor(false)}
        >
          <div
            style={{
              background: "var(--background)",
              borderRadius: "12px",
              width: "90%",
              maxWidth: "1000px",
              height: "80%",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>
                Edit Global Stylesheet
              </h3>
              <button
                onClick={() => setShowEditor(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "var(--muted-foreground)",
                  padding: "0 8px",
                }}
              >
                ×
              </button>
            </div>

            {/* Monaco Editor */}
            <div style={{ flex: 1, overflow: "hidden" }}>
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

            {/* Footer */}
            <div
              style={{
                padding: "16px 20px",
                borderTop: "1px solid var(--border)",
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowEditor(false)}
                style={{
                  padding: "8px 16px",
                  background: "var(--muted)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 500,
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setGlobalCss(editedCss);
                  setShowEditor(false);
                }}
                style={{
                  padding: "8px 16px",
                  background: "#3b82f6",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 500,
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Extractor Modal */}
      {showPageExtractor && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
          onClick={() => setShowPageExtractor(false)}
        >
          <div
            style={{
              background: "var(--background)",
              borderRadius: "12px",
              width: "90%",
              maxWidth: "1200px",
              height: "85%",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>
                Extract CSS from Page
              </h3>
              <button
                onClick={() => setShowPageExtractor(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "var(--muted-foreground)",
                  padding: "0 8px",
                }}
              >
                ×
              </button>
            </div>

            {/* PageExtractor Component */}
            <div style={{ flex: 1, overflow: "auto", padding: "20px" }}>
              <PageExtractor
                onCssExtracted={async (extractedCss: string, sourceUrl?: string) => {
                  // Append extracted CSS to global stylesheet
                  const separator = "\n\n/* ========== Extracted CSS ========== */\n\n";
                  const updatedCss = globalCss + separator + extractedCss;
                  setGlobalCss(updatedCss);

                  // Analyze CSS and create design system summary
                  try {
                    console.log('🔍 Analyzing CSS to create design system summary...');
                    const summary = await analyzeCSSWithAI(extractedCss, sourceUrl);
                    setDesignSystemSummary(summary);
                    console.log('✅ Design system summary created:', summary);
                  } catch (error) {
                    console.error('❌ Failed to analyze CSS:', error);
                    // Still allow CSS to be saved even if analysis fails
                  }

                  setShowPageExtractor(false);

                  // Show success notification
                  setShowUpdateNotification(true);
                  setTimeout(() => setShowUpdateNotification(false), 3000);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* CSS Class Explorer */}
      {showClassExplorer && designSystemSummary && (
        <CSSClassExplorer
          designSystemSummary={designSystemSummary}
          onClose={() => setShowClassExplorer(false)}
        />
      )}

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
