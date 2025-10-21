import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalculatorIcon } from 'lucide-react';

export function CalculatorWidget({ data }: { data: any }) {
  const { expression, result, isValid } = data;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalculatorIcon className="h-5 w-5" />
          Calculator
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">Expression:</div>
          <div className="font-mono text-lg">{expression}</div>
          <div className="text-sm text-muted-foreground">Result:</div>
          <div className="text-3xl font-bold">
            {isValid ? result : <span className="text-destructive">Error</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
