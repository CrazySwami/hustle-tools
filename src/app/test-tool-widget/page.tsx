'use client';

import { useState } from 'react';
import { StandardToolWidget } from '@/components/tool-ui/StandardToolWidget';
import { Button } from '@/components/ui/button';

export default function TestToolWidgetPage() {
  const [testCase, setTestCase] = useState<'simple' | 'with-action' | 'error'>('simple');

  const testData = {
    simple: {
      result: {
        title: 'Stock Price: AAPL',
        description: '$182.45 USD',
        data: {
          Symbol: 'AAPL',
          Price: '$182.45',
          Change: '+2.34%',
          Volume: '54,232,100',
          'Market Cap': '$2.87T',
          '52 Week High': '$199.62',
          '52 Week Low': '$164.08',
        },
      },
    },
    'with-action': {
      result: {
        title: 'Data Export Ready',
        description: 'Click to download your data',
        data: {
          Format: 'CSV',
          Rows: '1,245',
          Columns: '12',
          'File Size': '156 KB',
        },
      },
      onAction: async () => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        alert('Download started!');
      },
      actionLabel: 'Download CSV',
    },
    error: {
      result: {
        title: 'Search Failed',
        description: 'Unable to complete request',
        error: 'Connection timeout after 30 seconds. Please check your network connection and try again.',
      },
    },
  };

  const currentTest = testData[testCase];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="container max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-semibold mb-2">Standard Tool Widget Test Page</h1>
          <p className="text-sm text-muted-foreground">
            Test the standard tool widget design with different configurations
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="container max-w-4xl mx-auto px-4 py-6">
        <div className="rounded-lg border border-border bg-card p-4 mb-6">
          <h2 className="text-sm font-medium mb-3">Test Cases</h2>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={testCase === 'simple' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTestCase('simple')}
            >
              Simple Data Display
            </Button>
            <Button
              variant={testCase === 'with-action' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTestCase('with-action')}
            >
              With Action Button
            </Button>
            <Button
              variant={testCase === 'error' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTestCase('error')}
            >
              Error State
            </Button>
          </div>
        </div>

        {/* Widget Preview */}
        <div className="rounded-lg border border-border bg-muted/20 p-6">
          <div className="mb-4">
            <h2 className="text-sm font-medium mb-1">Preview</h2>
            <p className="text-xs text-muted-foreground">
              Current test: <span className="font-mono">{testCase}</span>
            </p>
          </div>

          {/* This simulates how the widget appears in chat */}
          <div className="bg-background rounded-lg p-4">
            <StandardToolWidget
              key={testCase} // Force re-render on test case change
              {...currentTest}
            />
          </div>
        </div>

        {/* Documentation */}
        <div className="mt-6 rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-medium mb-3">Design Features</h2>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span><strong>Clean Layout:</strong> Compact spacing (h-7 w-7 icons, text-xs/text-sm)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span><strong>Smooth Animations:</strong> Fade-in, slide-in, chevron rotation (200-300ms)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span><strong>Collapsible:</strong> Click chevron to expand/collapse content</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span><strong>Status Colors:</strong> Green (success), Blue (loading), Red (error), Muted (idle)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span><strong>Interactive States:</strong> Loading spinner, success checkmark, error alerts</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span><strong>Responsive:</strong> Text truncation, line-clamping for long content</span>
            </div>
          </div>
        </div>

        {/* Code Reference */}
        <div className="mt-6 rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-medium mb-3">Documentation</h2>
          <p className="text-xs text-muted-foreground mb-2">
            For complete documentation and code examples, see:
          </p>
          <ul className="space-y-1 text-xs">
            <li>
              <a
                href="https://github.com/yourusername/hustle-tools/blob/main/docs/how-to-make-tools.md#standard-tool-ui-design"
                className="text-blue-600 hover:underline"
              >
                📄 Standard Tool UI Design Guide
              </a>
            </li>
            <li>
              <a
                href="https://github.com/yourusername/hustle-tools/blob/main/src/components/tool-ui/StandardToolWidget.tsx"
                className="text-blue-600 hover:underline"
              >
                📦 StandardToolWidget.tsx (Reference Implementation)
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
