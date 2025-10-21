'use client';

import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { StyleKit } from '@/lib/section-schema';

interface StyleKitViewerProps {
  styleKit: StyleKit;
  onUpdate: (updates: Partial<StyleKit>) => void;
}

export function StyleKitViewer({ styleKit, onUpdate }: StyleKitViewerProps) {
  const [leftPanelWidth, setLeftPanelWidth] = useState(60);
  const [isResizing, setIsResizing] = useState(false);

  // Resize handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const containerWidth = window.innerWidth;
      const newWidth = (e.clientX / containerWidth) * 100;

      if (newWidth >= 40 && newWidth <= 70) {
        setLeftPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      width: '100%',
      overflow: 'hidden',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #e5e7eb',
        background: '#ffffff'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
              {styleKit.name}
              {styleKit.isDefault && <span style={{ marginLeft: '8px', fontSize: '12px', color: '#6366f1' }}>⭐ Default</span>}
              {styleKit.isActive && <span style={{ marginLeft: '8px', fontSize: '12px', color: '#10b981' }}>✓ Active</span>}
            </h3>
          </div>
        </div>
      </div>

      {/* Editor and Preview Split */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden'
      }}>
        {/* Left: CSS Editor */}
        <div style={{
          width: `${leftPanelWidth}%`,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #e5e7eb'
        }}>
          <div style={{
            padding: '12px 16px',
            background: '#f9fafb',
            borderBottom: '1px solid #e5e7eb',
            fontSize: '13px',
            fontWeight: 600,
            color: '#374151'
          }}>
            CSS Editor {styleKit.isDefault && '(Read-only)'}
          </div>

          <div style={{ flex: 1, overflow: 'hidden' }}>
            <Editor
              height="100%"
              language="css"
              value={styleKit.css}
              onChange={(value) => !styleKit.isDefault && onUpdate({ css: value || '' })}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: 'on',
                readOnly: styleKit.isDefault,
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                automaticLayout: true
              }}
            />
          </div>
        </div>

        {/* Resizer */}
        <div
          onMouseDown={() => setIsResizing(true)}
          style={{
            width: '4px',
            cursor: 'col-resize',
            background: isResizing ? '#3b82f6' : '#e5e7eb',
            transition: 'background 0.2s'
          }}
        />

        {/* Right: Style Guide Preview */}
        <div style={{
          flex: 1,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff'
        }}>
          <div style={{
            padding: '12px 16px',
            background: '#f9fafb',
            borderBottom: '1px solid #e5e7eb',
            fontSize: '13px',
            fontWeight: 600,
            color: '#374151'
          }}>
            Style Guide Preview
          </div>

          <iframe
            srcDoc={`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    /* Reset to ensure clean slate */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      padding: 24px;
      background: #ffffff;
    }

    /* User's Style Kit CSS */
    ${styleKit.css}
  </style>
</head>
<body>
  <!-- Typography -->
  <section style="margin-bottom: 32px;">
    <h2 style="font-size: 20px; margin-bottom: 16px; color: #111827;">Typography</h2>
    <h1>Heading 1</h1>
    <h2>Heading 2</h2>
    <h3>Heading 3</h3>
    <h4>Heading 4</h4>
    <h5>Heading 5</h5>
    <h6>Heading 6</h6>
    <p>
      This is a paragraph with <strong>bold text</strong>, <em>italic text</em>,
      and <a href="#">a link</a>. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
    </p>
  </section>

  <!-- Buttons -->
  <section style="margin-bottom: 32px;">
    <h2 style="font-size: 20px; margin-bottom: 16px; color: #111827;">Buttons</h2>
    <div style="display: flex; gap: 12px; flex-wrap: wrap;">
      <button class="btn btn-primary">Primary Button</button>
      <button class="btn btn-secondary">Secondary Button</button>
      <button class="btn btn-success">Success Button</button>
      <button class="btn btn-danger">Danger Button</button>
    </div>
  </section>

  <!-- Forms -->
  <section style="margin-bottom: 32px;">
    <h2 style="font-size: 20px; margin-bottom: 16px; color: #111827;">Forms</h2>
    <form>
      <div style="margin-bottom: 16px;">
        <label for="input1" style="display: block; margin-bottom: 4px;">Text Input</label>
        <input type="text" id="input1" placeholder="Enter text..." />
      </div>
      <div style="margin-bottom: 16px;">
        <label for="textarea1" style="display: block; margin-bottom: 4px;">Textarea</label>
        <textarea id="textarea1" rows="4" placeholder="Enter text..."></textarea>
      </div>
      <div style="margin-bottom: 16px;">
        <label for="select1" style="display: block; margin-bottom: 4px;">Select</label>
        <select id="select1">
          <option>Option 1</option>
          <option>Option 2</option>
          <option>Option 3</option>
        </select>
      </div>
    </form>
  </section>

  <!-- Cards -->
  <section style="margin-bottom: 32px;">
    <h2 style="font-size: 20px; margin-bottom: 16px; color: #111827;">Cards</h2>
    <div class="card">
      <div class="card-header">Card Header</div>
      <div class="card-body">
        <h3 class="card-title">Card Title</h3>
        <p class="card-text">This is some card content. It can contain any HTML elements.</p>
        <a href="#" class="btn btn-primary">Action</a>
      </div>
    </div>
  </section>

  <!-- Lists -->
  <section style="margin-bottom: 32px;">
    <h2 style="font-size: 20px; margin-bottom: 16px; color: #111827;">Lists</h2>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
      <div>
        <h3 style="font-size: 16px; margin-bottom: 8px;">Unordered List</h3>
        <ul>
          <li>List item 1</li>
          <li>List item 2</li>
          <li>List item 3</li>
        </ul>
      </div>
      <div>
        <h3 style="font-size: 16px; margin-bottom: 8px;">Ordered List</h3>
        <ol>
          <li>List item 1</li>
          <li>List item 2</li>
          <li>List item 3</li>
        </ol>
      </div>
    </div>
  </section>

  <!-- Colors -->
  <section style="margin-bottom: 32px;">
    <h2 style="font-size: 20px; margin-bottom: 16px; color: #111827;">Colors</h2>
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 12px;">
      <div class="color-primary" style="height: 60px; border-radius: 4px; border: 1px solid #e5e7eb;"></div>
      <div class="color-secondary" style="height: 60px; border-radius: 4px; border: 1px solid #e5e7eb;"></div>
      <div class="color-success" style="height: 60px; border-radius: 4px; border: 1px solid #e5e7eb;"></div>
      <div class="color-danger" style="height: 60px; border-radius: 4px; border: 1px solid #e5e7eb;"></div>
    </div>
  </section>
</body>
</html>
            `}
            style={{
              width: '100%',
              height: '100%',
              border: 'none'
            }}
            title="Style Guide Preview"
          />
        </div>
      </div>
    </div>
  );
}
