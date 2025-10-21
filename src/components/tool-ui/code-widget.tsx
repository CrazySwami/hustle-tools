import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CodeIcon } from 'lucide-react';

export function CodeWidget({ data }: { data: any }) {
  const { language, description, complexity, code } = data;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CodeIcon className="h-5 w-5" />
          Code Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="text-sm font-medium mb-1">Description</div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline">{language}</Badge>
          <Badge variant="outline">{complexity}</Badge>
        </div>
        <div>
          <div className="text-sm font-medium mb-2">Generated Code</div>
          <pre className="bg-muted p-3 rounded-lg overflow-x-auto text-xs">
            <code>{code}</code>
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
