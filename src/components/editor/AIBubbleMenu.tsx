import React from 'react';
import {
  Wand2, Plus, Minimize2, RotateCw, ArrowRight, Smile,
  Search, MessageCircle, Loader2
} from 'lucide-react';

interface AIBubbleMenuProps {
  onInlineAction: (action: string) => void;
  onChatAction: (action: string) => void;
  isProcessing: boolean;
  hasSelection: boolean;
}

export function AIBubbleMenuContent({ onInlineAction, onChatAction, isProcessing, hasSelection }: AIBubbleMenuProps) {
  const inlineActions = [
    { id: 'improve', label: 'Improve', subtitle: 'Polish & enhance', icon: Wand2, color: 'text-purple-600' },
    { id: 'expand', label: 'Expand', subtitle: 'Add more detail', icon: Plus, color: 'text-blue-600' },
    { id: 'simplify', label: 'Simplify', subtitle: 'Make it clearer', icon: Minimize2, color: 'text-green-600' },
    { id: 'rewrite', label: 'Rewrite', subtitle: 'Generate alternatives', icon: RotateCw, color: 'text-orange-600' },
    { id: 'continue', label: 'Continue', subtitle: 'Keep writing', icon: ArrowRight, color: 'text-pink-600' },
    { id: 'tone', label: 'Change Tone', subtitle: 'Adjust writing style', icon: Smile, color: 'text-yellow-600' },
  ];

  const chatActions = [
    { id: 'research', label: 'Research', subtitle: 'Verify with web search', icon: Search, color: 'text-cyan-600' },
    { id: 'ask', label: 'Ask AI', subtitle: 'General question', icon: MessageCircle, color: 'text-indigo-600' },
  ];

  if (isProcessing) {
    return (
      <div className="p-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Processing...</span>
      </div>
    );
  }

  return (
    <div className="w-[280px] max-h-[400px] overflow-y-auto">
      {/* Inline Actions */}
      <div className="p-2">
        <div className="text-xs font-semibold text-muted-foreground px-2 py-1 uppercase tracking-wide">
          Inline
        </div>
        {inlineActions.map(action => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => onInlineAction(action.id)}
              disabled={!hasSelection}
              className="w-full flex items-start gap-3 px-3 py-2 rounded-md hover:bg-muted/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
            >
              <Icon className={`h-4 w-4 ${action.color} flex-shrink-0 mt-0.5`} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{action.label}</div>
                <div className="text-xs text-muted-foreground">{action.subtitle}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="h-px bg-border my-1" />

      {/* Chat Actions */}
      <div className="p-2">
        <div className="text-xs font-semibold text-muted-foreground px-2 py-1 uppercase tracking-wide">
          Chat
        </div>
        {chatActions.map(action => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => onChatAction(action.id)}
              disabled={!hasSelection}
              className="w-full flex items-start gap-3 px-3 py-2 rounded-md hover:bg-muted/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
            >
              <Icon className={`h-4 w-4 ${action.color} flex-shrink-0 mt-0.5`} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{action.label}</div>
                <div className="text-xs text-muted-foreground">{action.subtitle}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
