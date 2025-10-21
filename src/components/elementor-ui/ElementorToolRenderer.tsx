'use client';

interface ToolResult {
  tool?: string;
  [key: string]: any;
}

export function ElementorToolRenderer({ result }: { result: ToolResult }) {
  if (!result || !result.tool) {
    return (
      <pre className="text-xs overflow-auto p-4 bg-gray-50 rounded">
        {JSON.stringify(result, null, 2)}
      </pre>
    );
  }

  // JSON Patch Display (Blue gradient)
  if (result.tool === 'generate_json_patch') {
    return (
      <div className="json-patch-display">
        <div className="patch-header">
          <span className="patch-icon">🔧</span>
          <span className="patch-title">JSON Patch Generated</span>
          <span className="patch-success">✓</span>
        </div>

        <div className="patch-summary">{result.summary}</div>

        <div className="patches-list">
          {result.patches?.map((patch: any, i: number) => (
            <div key={i} className={`patch-item patch-${patch.op}`}>
              <div className="patch-op">{patch.op.toUpperCase()}</div>
              <div className="patch-path">{patch.path}</div>
              {patch.value !== undefined && (
                <div className="patch-value">
                  {typeof patch.value === 'object'
                    ? JSON.stringify(patch.value)
                    : String(patch.value)}
                </div>
              )}
            </div>
          ))}
        </div>

        {result.requiresApproval && (
          <div className="patch-approval">
            <p className="text-sm text-gray-600 mb-2">
              Review the changes above. Click approve in the confirmation dialog to apply.
            </p>
          </div>
        )}
      </div>
    );
  }

  // JSON Analysis Display (Orange gradient)
  if (result.tool === 'analyze_json_structure') {
    return (
      <div className="json-analysis-display">
        <div className="analysis-header">
          <span className="analysis-icon">🔍</span>
          <span className="analysis-title">JSON Structure Analysis</span>
        </div>

        <div className="analysis-content">
          <div className="analysis-stat">
            <span className="stat-label">Widget Type:</span>
            <span className="stat-value">{result.widgetType || 'N/A'}</span>
          </div>

          {result.widgetCount !== undefined && (
            <div className="analysis-stat">
              <span className="stat-label">Widget Count:</span>
              <span className="stat-value">{result.widgetCount}</span>
            </div>
          )}

          {result.hasContent !== undefined && (
            <div className="analysis-stat">
              <span className="stat-label">Has Content:</span>
              <span className="stat-value">{result.hasContent ? '✓' : '✗'}</span>
            </div>
          )}

          {result.widgets && result.widgets.length > 0 && (
            <div className="analysis-widgets">
              <div className="stat-label mb-2">Widgets:</div>
              <div className="space-y-1">
                {result.widgets.map((widget: any, i: number) => (
                  <div key={i} className="widget-item">
                    {widget.widgetType || widget.elType || 'Unknown'}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.results && result.results.length > 0 && (
            <div className="analysis-results">
              <div className="stat-label mb-2">Results:</div>
              <div className="space-y-2">
                {result.results.map((r: any, i: number) => (
                  <div key={i} className="result-item">
                    <div className="text-xs font-mono text-gray-600">{r.path}</div>
                    <div className="text-sm">{JSON.stringify(r.value)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Vector Search Display (Green gradient)
  if (result.tool === 'search_elementor_docs') {
    return (
      <div className="vector-search-display">
        <div className="search-header">
          <span className="search-icon">📚</span>
          <span className="search-title">Elementor Documentation Search</span>
          <span className="search-count">{result.filesSearched} files</span>
        </div>

        <div className="search-query">
          <strong>Query:</strong> {result.query}
          {result.widget_type && <span className="ml-2">({result.widget_type})</span>}
        </div>

        {result.results && result.results.length > 0 && (
          <div className="search-results">
            {result.results.map((r: any, i: number) => (
              <div key={i} className="search-result-item">
                <div className="result-filename">📄 {r.filename}</div>
                <div className="result-snippet">{r.snippet}</div>
                <div className="result-relevance">
                  Relevance: {((r.relevance || 0) * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Playground Action (Simple message)
  if (result.tool === 'open_template_in_playground') {
    return (
      <div className="playground-action">
        <div className="action-icon">🚀</div>
        <div className="action-message">
          <strong>{result.action === 'launch' ? 'Launching' : 'Refreshing'} Playground</strong>
          <p className="text-sm text-gray-600">{result.message}</p>
        </div>
      </div>
    );
  }

  // Screenshot Capture (Simple message)
  if (result.tool === 'capture_playground_screenshot') {
    return (
      <div className="screenshot-action">
        <div className="action-icon">📸</div>
        <div className="action-message">
          <strong>Capturing Screenshot</strong>
          <p className="text-sm text-gray-600">{result.reason}</p>
        </div>
      </div>
    );
  }

  // HTML Converter (JSON output)
  if (result.tool === 'convert_html_to_elementor_json') {
    return (
      <div className="converter-display">
        <div className="converter-header">
          <span className="converter-icon">🎨</span>
          <span className="converter-title">HTML to Elementor Conversion</span>
        </div>

        {result.image_description && (
          <div className="converter-description">
            <strong>Image Description:</strong>
            <p className="text-sm">{result.image_description}</p>
          </div>
        )}

        <div className="converter-result">
          <strong>Generated Elementor JSON:</strong>
          <pre className="text-xs overflow-auto p-3 bg-gray-100 rounded mt-2">
            {JSON.stringify(result.elementorJson, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  // List Tools (Table display)
  if (result.tool === 'list_available_tools' && result.tools) {
    return (
      <div className="tools-list-display">
        <div className="tools-header">
          <span className="tools-icon">📋</span>
          <span className="tools-title">Available Tools</span>
        </div>

        <div className="tools-grid">
          {result.tools.map((tool: any, i: number) => (
            <div key={i} className="tool-card">
              <div className="tool-icon-name">
                <span className="text-2xl">{tool.icon}</span>
                <strong className="text-sm">{tool.name}</strong>
              </div>
              <p className="text-xs text-gray-600 mt-1">{tool.description}</p>
              {tool.examples && tool.examples.length > 0 && (
                <div className="tool-examples mt-2">
                  <div className="text-xs font-semibold text-gray-500">Examples:</div>
                  {tool.examples.map((ex: string, j: number) => (
                    <div key={j} className="text-xs italic text-gray-500">• {ex}</div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default: JSON output
  return (
    <pre className="text-xs overflow-auto p-4 bg-gray-50 rounded">
      {JSON.stringify(result, null, 2)}
    </pre>
  );
}
