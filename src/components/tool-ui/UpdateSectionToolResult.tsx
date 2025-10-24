'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useEditorContent } from '@/hooks/useEditorContent';
import { createTwoFilesPatch } from 'diff';

interface UpdateSectionToolResultProps {
  toolName: string;
  result: any;
}

export function UpdateSectionToolResult({ toolName, result }: UpdateSectionToolResultProps) {
  const { getContent } = useEditorContent();
  const updateType = toolName.replace('updateSection', '').toLowerCase() as 'html' | 'css' | 'js';
  const newCode = result[updateType];

  const handleViewDiff = () => {
    const currentContent = getContent([updateType]);
    const original = currentContent[updateType] || '';

    // Generate unified diff
    const unifiedDiff = createTwoFilesPatch(
      `${updateType}.original`,
      `${updateType}.modified`,
      original,
      newCode,
      'Original',
      'Modified'
    );

    console.log('[UpdateSectionToolResult] Diff generated:', {
      file: updateType,
      originalLength: original.length,
      modifiedLength: newCode.length,
      diff: unifiedDiff
    });
    // Note: setPendingDiff was removed - this component needs to be updated to use the new EditCodeWidget workflow
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

          <p className="text-sm text-muted-foreground">
            AI has generated updated {updateType.toUpperCase()} code. Click below to preview the changes before applying.
          </p>

          <button
            onClick={handleViewDiff}
            className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            📊 View Diff & Approve
          </button>

          <Badge variant="outline" className="text-xs">
            {result.type.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
