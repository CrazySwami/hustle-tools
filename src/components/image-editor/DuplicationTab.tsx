'use client';

import { useState } from 'react';
import { Copy, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import JSZip from 'jszip';

interface DuplicationTabProps {
  selectedImage: string | null;
}

type NamingMode = 'programmatic' | 'ai';

export function DuplicationTab({ selectedImage }: DuplicationTabProps) {
  const [numberOfDuplicates, setNumberOfDuplicates] = useState(5);
  const [namingMode, setNamingMode] = useState<NamingMode>('programmatic');
  const [namingPattern, setNamingPattern] = useState('image-{number}.png');
  const [searchText, setSearchText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [aiModel, setAiModel] = useState('openai/gpt-4o-mini');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState<Array<{ name: string; url: string }>>([]);

  const generateProgrammaticNames = (): string[] => {
    const names: string[] = [];

    if (searchText && replaceText) {
      // Search/replace mode
      for (let i = 1; i <= numberOfDuplicates; i++) {
        const baseName = `image-${i}.png`;
        const replaced = baseName.replace(new RegExp(searchText, 'g'), replaceText);
        names.push(replaced);
      }
    } else {
      // Pattern mode with {number} and {random}
      for (let i = 1; i <= numberOfDuplicates; i++) {
        const random = Math.random().toString(36).substring(2, 8);
        let name = namingPattern
          .replace('{number}', i.toString().padStart(3, '0'))
          .replace('{random}', random);
        names.push(name);
      }
    }

    return names;
  };

  const generateAINames = async (): Promise<string[]> => {
    try {
      const response = await fetch('/api/chat-elementor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Generate ${numberOfDuplicates} unique, descriptive filenames for an image.
                        Return ONLY a JSON array of filenames with .png extension, like: ["filename1.png", "filename2.png"]
                        Make each name descriptive and unique. No explanations, just the JSON array.`,
            },
          ],
          model: aiModel,
        }),
      });

      const data = await response.json();
      const content = data.response || '';

      // Extract JSON array from response
      const jsonMatch = content.match(/\[.*\]/s);
      if (jsonMatch) {
        const names = JSON.parse(jsonMatch[0]);
        return names.slice(0, numberOfDuplicates);
      }

      throw new Error('Failed to parse AI response');
    } catch (error: any) {
      console.error('AI naming failed:', error);
      throw new Error(`AI naming failed: ${error.message}`);
    }
  };

  const handleGenerate = async () => {
    if (!selectedImage) {
      alert('Please select an image first');
      return;
    }

    if (numberOfDuplicates < 1 || numberOfDuplicates > 100) {
      alert('Number of duplicates must be between 1 and 100');
      return;
    }

    setIsGenerating(true);
    try {
      const names = namingMode === 'programmatic'
        ? generateProgrammaticNames()
        : await generateAINames();

      const files = names.map(name => ({
        name,
        url: selectedImage, // All duplicates use the same image
      }));

      setGeneratedFiles(files);
    } catch (error: any) {
      alert(`Failed to generate files: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadAll = async () => {
    if (generatedFiles.length === 0) return;

    const zip = new JSZip();

    for (const file of generatedFiles) {
      const response = await fetch(file.url);
      const blob = await response.blob();
      zip.file(file.name, blob);
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = 'duplicated-images.zip';
    link.click();
  };

  const downloadSingle = async (file: { name: string; url: string }) => {
    const response = await fetch(file.url);
    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = file.name;
    link.click();
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-muted rounded">
        <p className="text-sm text-foreground mb-3">
          Duplicate the selected image with custom naming patterns.
        </p>
        {selectedImage ? (
          <div className="mb-3">
            <img
              src={selectedImage}
              alt="Selected"
              className="max-w-full h-auto rounded border border-border"
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mb-3">
            No image selected. Please select an image first.
          </p>
        )}
      </div>

      <div>
        <Label className="block text-sm font-medium mb-2">Number of Duplicates</Label>
        <Input
          type="number"
          min={1}
          max={100}
          value={numberOfDuplicates}
          onChange={(e) => setNumberOfDuplicates(parseInt(e.target.value) || 1)}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground mt-1">Max: 100</p>
      </div>

      <div>
        <Label className="block text-sm font-medium mb-2">Naming Mode</Label>
        <div className="flex gap-2">
          <button
            onClick={() => setNamingMode('programmatic')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded transition-colors ${
              namingMode === 'programmatic'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            Programmatic
          </button>
          <button
            onClick={() => setNamingMode('ai')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded transition-colors ${
              namingMode === 'ai'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            AI-Powered
          </button>
        </div>
      </div>

      {namingMode === 'programmatic' && (
        <div className="space-y-4">
          <div>
            <Label className="block text-sm font-medium mb-2">Pattern</Label>
            <Input
              type="text"
              value={namingPattern}
              onChange={(e) => setNamingPattern(e.target.value)}
              placeholder="image-{number}.png"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Use {'{number}'} for sequential numbers, {'{random}'} for random strings
            </p>
          </div>

          <div className="text-sm font-medium">OR</div>

          <div className="space-y-2">
            <div>
              <Label className="block text-sm font-medium mb-2">Search Text</Label>
              <Input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="text to find"
                className="w-full"
              />
            </div>
            <div>
              <Label className="block text-sm font-medium mb-2">Replace With</Label>
              <Input
                type="text"
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                placeholder="replacement text"
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}

      {namingMode === 'ai' && (
        <div>
          <Label className="block text-sm font-medium mb-2">AI Model</Label>
          <select
            value={aiModel}
            onChange={(e) => setAiModel(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded bg-background text-foreground"
          >
            <option value="openai/gpt-4o-mini">GPT-4o Mini (Fast)</option>
            <option value="openai/gpt-4o">GPT-4o (Balanced)</option>
            <option value="openai/gpt-5-mini">GPT-5 Mini (Latest)</option>
            <option value="anthropic/claude-sonnet-4-5">Claude Sonnet 4.5</option>
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            AI will generate unique, descriptive filenames based on the image
          </p>
        </div>
      )}

      <Button
        onClick={handleGenerate}
        disabled={isGenerating || !selectedImage}
        className="w-full flex items-center justify-center gap-2"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            Generate Duplicates
          </>
        )}
      </Button>

      {generatedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              Generated Files ({generatedFiles.length})
            </p>
            <Button
              onClick={downloadAll}
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download All (ZIP)
            </Button>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {generatedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 bg-muted rounded text-sm"
              >
                <span className="truncate flex-1">{file.name}</span>
                <Button
                  onClick={() => downloadSingle(file)}
                  size="sm"
                  variant="ghost"
                  className="ml-2"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-xs text-muted-foreground p-3 bg-muted rounded">
        <strong>Duplication Feature:</strong>
        <p className="mt-2">
          Create multiple copies of your image with custom filenames. Use programmatic patterns
          for systematic naming or AI-powered naming for descriptive, unique filenames.
        </p>
      </div>
    </div>
  );
}
