'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRightIcon, CheckIcon } from 'lucide-react';

interface TabSwitcherWidgetProps {
  data: {
    tab: 'json' | 'visual' | 'sections' | 'playground' | 'site-content' | 'style-guide';
    tabName: string;
    reason?: string;
    status: string;
    message: string;
  };
  onSwitchTab?: (tab: string) => void;
}

export function TabSwitcherWidget({ data, onSwitchTab }: TabSwitcherWidgetProps) {
  console.log('🔀 TabSwitcherWidget rendered with data:', data);

  const [switched, setSwitched] = useState(false);

  // Auto-switch on mount (simulating "streaming" behavior)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSwitchTab) {
        console.log('🔀 Auto-switching to tab:', data.tab);
        onSwitchTab(data.tab);
        setSwitched(true);
      }
    }, 500); // Small delay for visual feedback

    return () => clearTimeout(timer);
  }, [data.tab, onSwitchTab]);

  const tabIcons: Record<string, string> = {
    'json': '💻',
    'visual': '🎨',
    'sections': '📚',
    'playground': '🌐',
    'site-content': '📄',
    'style-guide': '🎨',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRightIcon className="h-5 w-5" />
          Tab Navigation
        </CardTitle>
      </CardHeader>
      <CardContent>
        {switched ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-green-600">
              <CheckIcon className="h-4 w-4" />
              <p className="text-sm font-medium">Switched to {data.tabName}</p>
            </div>
            {data.reason && (
              <p className="text-xs text-muted-foreground">
                Reason: {data.reason}
              </p>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
              <span>{tabIcons[data.tab]}</span>
              <span>Now viewing: {data.tabName}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-blue-600 rounded-full animate-pulse" />
              <p className="text-sm text-muted-foreground">
                Switching to {data.tabName}...
              </p>
            </div>
            {data.reason && (
              <p className="text-xs text-muted-foreground">
                {data.reason}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
