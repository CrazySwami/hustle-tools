import { WeatherWidget } from './weather-widget';
import { CalculatorWidget } from './calculator-widget';
import { CodeWidget } from './code-widget';
import { ScrapeResultWidget } from './scrape-result-widget';
import { HTMLGeneratorWidget } from './html-generator-widget';
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

export function ToolResultRenderer({ toolResult, onStreamUpdate, onSwitchToSectionEditor, onSwitchCodeTab, model }: ToolResultRendererProps) {
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

    case 'updateSectionHtml':
    case 'updateSectionCss':
    case 'updateSectionJs': {
      const updateType = toolName.replace('updateSection', '').toLowerCase();
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-green-600" />
              {updateType.toUpperCase()} Updated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{result.message}</p>
              {result.reasoning && (
                <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                  <strong>Changes:</strong> {result.reasoning}
                </div>
              )}
              <Badge variant="outline" className="text-xs">
                {result.type.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </CardContent>
        </Card>
      );
    }

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
