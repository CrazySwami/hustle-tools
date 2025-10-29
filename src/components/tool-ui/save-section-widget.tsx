'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SaveIcon, Loader2Icon, CheckCircle2Icon, FolderIcon } from 'lucide-react';
import { useEditorContent } from '@/hooks/useEditorContent';

interface SaveSectionWidgetProps {
  data: {
    suggestedName: string;
    status: string;
    message: string;
  };
}

type SaveState = 'naming' | 'saving' | 'saved' | 'error';

export function SaveSectionWidget({ data }: SaveSectionWidgetProps) {
  console.log('💾 SaveSectionWidget rendered:', data);

  const { getContent } = useEditorContent();

  const [state, setState] = useState<SaveState>('naming');
  const [sectionName, setSectionName] = useState(data.suggestedName || 'Untitled Section');
  const [errorMessage, setErrorMessage] = useState('');
  const [savedSection, setSavedSection] = useState<any>(null);

  const handleSave = async () => {
    try {
      setState('saving');
      setErrorMessage('');

      console.log('💾 Saving section:', sectionName);

      // Get all current content
      const allContent = getContent();

      // Create section object
      const newSection = {
        id: `section-${Date.now()}`,
        name: sectionName,
        html: allContent.html || '',
        css: allContent.css || '',
        js: allContent.js || '',
        php: allContent.php || '',
        thumbnail: '', // Could generate thumbnail later
        createdAt: new Date().toISOString(),
      };

      // Get existing sections from localStorage
      const existingSectionsJson = localStorage.getItem('elementor_sections');
      const existingSections = existingSectionsJson ? JSON.parse(existingSectionsJson) : [];

      // Add new section
      existingSections.push(newSection);

      // Save back to localStorage
      localStorage.setItem('elementor_sections', JSON.stringify(existingSections));

      console.log('✅ Section saved successfully!', newSection);
      setSavedSection(newSection);
      setState('saved');

      // Dispatch event so Section Library can refresh
      window.dispatchEvent(new CustomEvent('section-library-updated'));

    } catch (error) {
      console.error('❌ Save section failed:', error);
      setState('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save section');
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SaveIcon className="h-5 w-5" />
          Save to Section Library
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* NAMING STATE - User provides name */}
        {state === 'naming' && (
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                💡 Ready to Save
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                This will save your current HTML, CSS, JS, and PHP to the Section Library for reuse.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="section-name" className="text-sm font-medium">
                Section Name:
              </label>
              <Input
                id="section-name"
                type="text"
                value={sectionName}
                onChange={(e) => setSectionName(e.target.value)}
                placeholder="Enter section name..."
                className="w-full"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Give this section a descriptive name (e.g., "Hero Section", "Pricing Table", "Contact Form")
              </p>
            </div>

            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={!sectionName.trim()}
              className="w-full"
            >
              <SaveIcon size={14} className="mr-2" />
              Save to Library
            </Button>
          </div>
        )}

        {/* SAVING STATE - Processing */}
        {state === 'saving' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Loader2Icon size={16} className="animate-spin text-blue-600" />
              <p className="text-sm text-muted-foreground">
                Saving "{sectionName}" to library...
              </p>
            </div>
          </div>
        )}

        {/* SAVED STATE - Success */}
        {state === 'saved' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2Icon size={16} />
              <p className="text-sm font-medium">Section Saved Successfully!</p>
            </div>

            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
              <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                📁 "{sectionName}"
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mb-2">
                Saved to Section Library
              </p>
              <div className="text-xs text-green-600 dark:text-green-400 space-y-1">
                <div>✓ HTML: {savedSection?.html?.length || 0} characters</div>
                <div>✓ CSS: {savedSection?.css?.length || 0} characters</div>
                <div>✓ JS: {savedSection?.js?.length || 0} characters</div>
                {savedSection?.php && <div>✓ PHP: {savedSection.php.length} characters</div>}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Trigger tab switch to Section Library
                  window.dispatchEvent(new CustomEvent('switch-to-tab', { detail: 'sections' }));
                }}
                className="flex-1"
              >
                <FolderIcon size={14} className="mr-2" />
                View in Library
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  setState('naming');
                  setSectionName('Untitled Section');
                  setSavedSection(null);
                }}
                className="flex-1"
              >
                Save Another
              </Button>
            </div>
          </div>
        )}

        {/* ERROR STATE - Something went wrong */}
        {state === 'error' && (
          <div className="space-y-2">
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
              <p className="text-sm font-medium text-red-600 mb-1">Error Saving Section</p>
              <p className="text-xs text-red-600">{errorMessage}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setState('naming')}
              className="w-full"
            >
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
