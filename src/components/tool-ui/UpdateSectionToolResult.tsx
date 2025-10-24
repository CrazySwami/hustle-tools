'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckSquare, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useEditorContent } from '@/hooks/useEditorContent';

interface UpdateSectionToolResultProps {
  toolName: string;
  result: any;
}

export function UpdateSectionToolResult({ toolName, result }: UpdateSectionToolResultProps) {
  const { getContent, updateContent } = useEditorContent();
  const updateType = toolName.replace('updateSection', '').toLowerCase() as 'html' | 'css' | 'js';
  const newCode = result[updateType];
  const [applied, setApplied] = useState(false);

  const handleApplyChanges = () => {
    console.log('[UpdateSectionToolResult] Applying changes:', {
      file: updateType,
      newCodeLength: newCode.length
    });

    // Directly update the editor content
    updateContent(updateType, newCode);
    setApplied(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-blue-600" />
          {updateType.toUpperCase()} Changes Proposed
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {result.reasoning && (
            <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
              <strong>Changes:</strong> {result.reasoning}
            </div>
          )}

          {!applied ? (
            <>
              <p className="text-sm text-muted-foreground">
                AI has generated updated {updateType.toUpperCase()} code. Click below to apply the changes.
              </p>

              <button
                onClick={handleApplyChanges}
                className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                ✓ Apply Changes
              </button>
            </>
          ) : (
            <div className="rounded-md bg-green-50 dark:bg-green-950/20 p-3 text-sm text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900 flex items-center gap-2">
              <Check className="h-4 w-4" />
              <span className="font-medium">Changes applied successfully!</span>
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
