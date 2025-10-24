import { WeatherWidget } from './weather-widget';
import { CalculatorWidget } from './calculator-widget';
import { CodeWidget } from './code-widget';
import { ScrapeResultWidget } from './scrape-result-widget';
import { HTMLGeneratorWidget } from './html-generator-widget';
import { UpdateSectionToolResult } from './UpdateSectionToolResult';
import { TabSwitcherWidget } from './tab-switcher-widget';
import { ViewEditorCodeWidget } from './ViewEditorCodeWidget';
import { EditCodeWidget } from './EditCodeWidget';
import { BlogPlannerWidget } from './blog-planner-widget';
import { BlogWriterWidget } from './blog-writer-widget';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Clock } from 'lucide-react';
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from '@/components/ai-elements/tool';

interface ToolResult {
  toolCallId: string;
  toolName: string;
  args: any;
  result: any;
}

interface ToolResultRendererProps {
  toolResult: ToolResult;
  onStreamUpdate?: (type: 'html' | 'css' | 'js', content: string) => void;
  onSwitchToSectionEditor?: () => void;
  onSwitchCodeTab?: (tab: 'html' | 'css' | 'js') => void;
  onSwitchTab?: (tab: string) => void;
  model?: string;
}

// Task widget component (inline since it's simpler)
function TaskWidget({ data }: { data: any }) {
  const { taskId, action, title, priority, dueDate, status, createdAt } = data;
  
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CheckSquare className="h-6 w-6 text-blue-500" />
          Task {action.charAt(0).toUpperCase() + action.slice(1)}d
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-sm font-medium text-muted-foreground mb-1">Title</div>
          <p className="font-medium">{title}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className={getPriorityColor(priority)}>
            {priority} priority
          </Badge>
          <Badge className={getStatusColor(status)}>
            {status}
          </Badge>
        </div>
        
        {dueDate && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Due: {dueDate}</span>
          </div>
        )}
        
        <div className="text-xs text-muted-foreground pt-2 border-t">
          Task ID: {taskId} • Created: {new Date(createdAt).toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
}

export function ToolResultRenderer({ toolResult, onStreamUpdate, onSwitchToSectionEditor, onSwitchCodeTab, onSwitchTab, model }: ToolResultRendererProps) {
  const { toolName, result } = toolResult;

  // Handle different tool types
  switch (toolName) {
    case 'getWeather':
      return <WeatherWidget data={result} />;

    case 'calculate':
      return <CalculatorWidget data={result} />;

    case 'generateCode':
      return <CodeWidget data={result} />;

    case 'manageTask':
      return <TaskWidget data={result} />;

    case 'scrapeUrl':
      return <ScrapeResultWidget data={result} />;

    case 'generateHTML':
      return (
        <HTMLGeneratorWidget
          data={result}
          onStreamUpdate={onStreamUpdate}
          onSwitchToSectionEditor={onSwitchToSectionEditor}
          onSwitchCodeTab={onSwitchCodeTab}
          model={model}
        />
      );

    case 'testPing':
      // Safety check for result data
      if (!result) {
        return (
          <Card>
            <CardContent className="p-4">
              <p className="text-red-500">Error: No result data for testPing tool</p>
            </CardContent>
          </Card>
        );
      }

      return (
        <div className="relative overflow-hidden rounded-lg border-2 border-green-500 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950 dark:via-emerald-950 dark:to-teal-950 p-6 shadow-lg">
          {/* Animated background waves */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
              <div className="absolute top-0 left-0 w-[200%] h-[200%] bg-gradient-to-r from-green-400/30 to-emerald-400/30 rounded-[40%] animate-[spin_8s_linear_infinite]" />
              <div className="absolute top-0 left-0 w-[200%] h-[200%] bg-gradient-to-r from-teal-400/20 to-cyan-400/20 rounded-[45%] animate-[spin_10s_linear_infinite_reverse]" />
            </div>
          </div>

          {/* Content */}
          <div className="relative z-10">
            {/* Header with pulsing ping icon */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="relative">
                {/* Pulsing rings */}
                <div className="absolute inset-0 animate-ping opacity-75">
                  <div className="h-12 w-12 rounded-full bg-green-400" />
                </div>
                <div className="absolute inset-0 animate-pulse opacity-50">
                  <div className="h-12 w-12 rounded-full bg-emerald-400" />
                </div>

                {/* Center icon */}
                <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-2xl shadow-lg animate-bounce">
                  🏓
                </div>
              </div>

              <h3 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                Test Ping
              </h3>
            </div>

            {/* Success message with animated check */}
            <div className="flex items-center justify-center gap-3 mb-4 p-4 bg-white/60 dark:bg-black/20 rounded-lg backdrop-blur-sm">
              <div className="animate-bounce">
                <CheckSquare className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-lg font-semibold text-green-700 dark:text-green-300">
                {result.message || 'Pong! Tool calling is working.'}
              </p>
            </div>

            {/* Details with animated bars */}
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 bg-white/40 dark:bg-black/20 rounded backdrop-blur-sm transform transition-all duration-300 hover:scale-105 animate-[slideIn_0.5s_ease-out]">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Status:
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {result.status || 'success'}
                </span>
              </div>

              <div className="flex items-center gap-3 p-2 bg-white/40 dark:bg-black/20 rounded backdrop-blur-sm transform transition-all duration-300 hover:scale-105 animate-[slideIn_0.6s_ease-out]">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Endpoint:
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {result.endpoint || 'chat-elementor'}
                </span>
              </div>

              <div className="flex items-center gap-3 p-2 bg-white/40 dark:bg-black/20 rounded backdrop-blur-sm transform transition-all duration-300 hover:scale-105 animate-[slideIn_0.7s_ease-out]">
                <div className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Timestamp:
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {result.timestamp ? new Date(result.timestamp).toLocaleTimeString() : 'Just now'}
                </span>
              </div>
            </div>

            {/* Success indicator */}
            <div className="mt-4 flex items-center justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full shadow-lg animate-pulse">
                <span className="text-sm font-bold">✓ TOOL CALLING VERIFIED</span>
              </div>
            </div>
          </div>
        </div>
      );

    case 'switchTab':
      return (
        <TabSwitcherWidget
          data={result}
          onSwitchTab={onSwitchTab}
        />
      );

    case 'updateSectionHtml':
    case 'updateSectionCss':
    case 'updateSectionJs':
      return <UpdateSectionToolResult toolName={toolName} result={result} />;

    case 'viewEditorCode':
      return <ViewEditorCodeWidget data={result} />;

    case 'editCode':
      return <EditCodeWidget data={result} onStreamUpdate={onStreamUpdate} model={model} />;

    case 'planBlogTopics':
      return <BlogPlannerWidget data={result} model={model} />;

    case 'writeBlogPost':
      return <BlogWriterWidget data={result} model={model} />;

    default:
      // Fallback for unknown tool types, now stylized like AI Elements
      return (
        <Tool defaultOpen>
          <ToolHeader 
            type={toolName as any}
            state='output-available'
          />
          <ToolContent>
            <ToolInput input={toolResult.args} />
            <ToolOutput output={<pre>{JSON.stringify(result, null, 2)}</pre>} errorText={undefined} />
          </ToolContent>
        </Tool>
      );
  }
}
