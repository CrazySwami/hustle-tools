'use client';

import { useState, useEffect, useMemo } from 'react';
import type { HubSpotModuleField } from '@/lib/hubspot-converter';

interface HublPreviewPanelProps {
  html: string;
  hubl: string;
  css: string;
  onClose: () => void;
  convertHtmlToHubL?: (html: string, options?: { kind?: 'page' | 'section' }) => {
    moduleHtml: string;
    fields: HubSpotModuleField[];
    fieldsJson: string;
    meta: any;
  };
}

interface HublField {
  name: string;
  label: string;
  type: string;
  defaultValue: any;
}

/**
 * HubL Interactive Preview Panel
 *
 * Displays a split-pane interface similar to the HubSpot converter:
 * - Left (35%): Editable fields extracted from HubL
 * - Right (65%): Live preview with field values applied
 */
export function HublPreviewPanel({ html, hubl, css, onClose, convertHtmlToHubL }: HublPreviewPanelProps) {
  const [splitWidth, setSplitWidth] = useState(35); // Left panel percentage (desktop) or top panel percentage (mobile)
  const [isDragging, setIsDragging] = useState(false);
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Extract fields using converter function (same as standalone converter)
  const fields = useMemo(() => {
    if (!convertHtmlToHubL) {
      console.warn('convertHtmlToHubL not provided, falling back to regex extraction');
      return [];
    }

    try {
      const result = convertHtmlToHubL(html, { kind: 'page' });
      console.log('🔧 HublPreviewPanel: Extracted fields from converter:', result.fields.length);

      // Convert HubSpotModuleField[] to HublField[]
      return result.fields.map(field => ({
        name: field.name,
        label: field.label,
        type: field.type,
        defaultValue: field.default || getDefaultValueForType(field.type)
      }));
    } catch (error) {
      console.error('❌ HublPreviewPanel: Field extraction failed:', error);
      return [];
    }
  }, [html, convertHtmlToHubL]);

  // Helper to get default value based on field type
  function getDefaultValueForType(type: string): any {
    switch (type) {
      case 'color': return '#3498db';
      case 'image': return 'https://via.placeholder.com/400x300';
      case 'text': return 'Sample text';
      case 'richtext': return 'Sample content';
      case 'url': return '#';
      case 'number': return 20;
      case 'boolean': return false;
      default: return '';
    }
  }

  // Initialize field values with defaults
  useEffect(() => {
    const initialValues: Record<string, any> = {};
    fields.forEach(field => {
      initialValues[field.name] = field.defaultValue;
    });
    setFieldValues(initialValues);
  }, [fields]);

  // Generate preview HTML with field values applied
  const previewHTML = useMemo(() => {
    // Use HTML as the base (it has inline styles intact)
    // The HubL version has tokens, but we want to preserve inline styles
    let processedHtml = html;

    console.log('🔄 Processing HTML preview with field values:', fieldValues);

    // Replace field placeholders with actual values
    // Note: The HTML from the converter has the default values already in place
    // We just need to replace them with the user's input
    fields.forEach(field => {
      const value = fieldValues[field.name] ?? field.defaultValue;
      console.log(`  Replacing ${field.name} with:`, value);

      // For text fields, replace the default text
      if (field.type === 'text' || field.type === 'richtext') {
        // Escape special regex characters in the default value
        const escapedDefault = String(field.defaultValue).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedDefault, 'g');
        processedHtml = processedHtml.replace(regex, String(value));
      }
      // For image fields, replace the default URL
      else if (field.type === 'image') {
        const escapedDefault = String(field.defaultValue).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedDefault, 'g');
        processedHtml = processedHtml.replace(regex, String(value));
      }
      // For colors, replace in style attributes
      else if (field.type === 'color') {
        const escapedDefault = String(field.defaultValue).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedDefault, 'gi');
        processedHtml = processedHtml.replace(regex, String(value));
      }
      // Skip number fields to preserve original dimensions
    });

    // Build complete HTML document with CSS and minimal styles (preserve inline styles)
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            /* Minimal reset - preserve inline styles */
            html, body {
              margin: 0;
              padding: 0;
              font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
            }
            img {
              max-width: 100%;
              height: auto;
            }
            *, *:before, *:after {
              box-sizing: border-box;
            }

            /* Custom CSS from editor */
            ${css}
          </style>
        </head>
        <body>
          ${processedHtml}
        </body>
      </html>
    `;
  }, [html, fields, fieldValues]);

  // Draggable divider handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const container = document.getElementById('hubl-split-container');
      if (!container) return;

      const containerRect = container.getBoundingClientRect();

      if (isMobile) {
        // Vertical split for mobile (top/bottom)
        const newHeight = ((e.clientY - containerRect.top) / containerRect.height) * 100;
        // Clamp between 20% and 60%
        setSplitWidth(Math.min(Math.max(newHeight, 20), 60));
      } else {
        // Horizontal split for desktop (left/right)
        const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
        // Clamp between 20% and 60%
        setSplitWidth(Math.min(Math.max(newWidth, 20), 60));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isMobile]);

  return (
    <div
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
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span>HubL Interactive Preview</span>
          <span style={{ fontSize: "11px", opacity: 0.7 }}>
            ({fields.length} field{fields.length !== 1 ? 's' : ''} detected)
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            padding: "4px 8px",
            background: "#FF7A59",
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

      {/* Split Panel Container */}
      <div
        id="hubl-split-container"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: isMobile ? "column" : "row", // Stack vertically on mobile
          position: "relative",
          overflow: "hidden",
          userSelect: isDragging ? "none" : "auto",
        }}
      >
        {/* Top/Left Panel - Editable Fields */}
        <div
          style={{
            ...(isMobile
              ? { height: `${splitWidth}%`, width: "100%" }
              : { width: `${splitWidth}%`, height: "100%" }
            ),
            padding: "16px",
            overflowY: "auto",
            background: "var(--card)",
            ...(isMobile
              ? { borderBottom: "1px solid var(--border)" }
              : { borderRight: "1px solid var(--border)" }
            ),
          }}
        >
          <h3 style={{ margin: "0 0 16px 0", fontSize: "14px", fontWeight: 600 }}>
            Module Fields
          </h3>
          {fields.length === 0 ? (
            <p style={{ fontSize: "13px", color: "var(--muted-foreground)" }}>
              No HubL fields detected. Add {"{{ module.fieldName }}"} tokens to your HubL code.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {fields.map((field) => (
                <div key={field.name} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: 500,
                      color: "var(--foreground)",
                    }}
                  >
                    {field.label}
                  </label>
                  {field.type === "richtext" ? (
                    <textarea
                      value={fieldValues[field.name] || ""}
                      onChange={(e) =>
                        setFieldValues({ ...fieldValues, [field.name]: e.target.value })
                      }
                      rows={3}
                      style={{
                        padding: "8px",
                        border: "1px solid var(--border)",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontFamily: "monospace",
                        background: "var(--background)",
                        color: "var(--foreground)",
                      }}
                    />
                  ) : field.type === "color" ? (
                    <input
                      type="color"
                      value={fieldValues[field.name] || "#000000"}
                      onChange={(e) =>
                        setFieldValues({ ...fieldValues, [field.name]: e.target.value })
                      }
                      style={{
                        height: "32px",
                        border: "1px solid var(--border)",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    />
                  ) : field.type === "number" ? (
                    <input
                      type="number"
                      value={fieldValues[field.name] || 0}
                      onChange={(e) =>
                        setFieldValues({ ...fieldValues, [field.name]: e.target.value })
                      }
                      style={{
                        padding: "8px",
                        border: "1px solid var(--border)",
                        borderRadius: "4px",
                        fontSize: "12px",
                        background: "var(--background)",
                        color: "var(--foreground)",
                      }}
                    />
                  ) : (
                    <input
                      type="text"
                      value={fieldValues[field.name] || ""}
                      onChange={(e) =>
                        setFieldValues({ ...fieldValues, [field.name]: e.target.value })
                      }
                      style={{
                        padding: "8px",
                        border: "1px solid var(--border)",
                        borderRadius: "4px",
                        fontSize: "12px",
                        background: "var(--background)",
                        color: "var(--foreground)",
                      }}
                    />
                  )}
                  <span style={{ fontSize: "11px", opacity: 0.6 }}>
                    {`{{ module.${field.name} }}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Draggable Divider */}
        <div
          onMouseDown={handleMouseDown}
          style={{
            ...(isMobile
              ? { height: "4px", width: "100%", cursor: "row-resize" }
              : { width: "4px", height: "100%", cursor: "col-resize" }
            ),
            background: isDragging ? "var(--primary)" : "var(--border)",
            transition: isDragging ? "none" : "background 0.2s",
          }}
        />

        {/* Bottom/Right Panel - Live Preview */}
        <div
          style={{
            flex: 1,
            background: "var(--muted)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <iframe
            srcDoc={previewHTML}
            style={{
              flex: 1,
              border: "none",
              width: "100%",
              background: "#ffffff",
            }}
            sandbox="allow-same-origin"
            title="HubL Preview"
          />
        </div>
      </div>
    </div>
  );
}
