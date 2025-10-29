'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileCodeIcon, Loader2Icon } from 'lucide-react';
import { HTMLGeneratorDialog } from '../html-generator/HTMLGeneratorDialog';
import { DesignSystemSummary } from '@/lib/global-stylesheet-context';
import { useUsageTracking } from '@/hooks/useUsageTracking';

interface HTMLGeneratorWidgetProps {
  data: {
    description: string;
    imageCount: number;
    images: Array<{ url: string; filename: string; description?: string }>;
    status: string;
    message: string;
  };
  onGenerate?: (html: string, css: string, js: string) => void;
  onStreamUpdate?: (type: 'html' | 'css' | 'js', content: string) => void;
  onSwitchToSectionEditor?: () => void;
  onSwitchCodeTab?: (tab: 'html' | 'css' | 'js') => void;
  model?: string;
  designSystemSummary?: DesignSystemSummary | null;
}

export function HTMLGeneratorWidget({ data, onGenerate, onStreamUpdate, onSwitchToSectionEditor, onSwitchCodeTab, model = 'anthropic/claude-sonnet-4-5-20250929', designSystemSummary }: HTMLGeneratorWidgetProps) {
  console.log('🎨 HTMLGeneratorWidget rendered with data:', data);

  const { recordUsage } = useUsageTracking();
  const [showDialog, setShowDialog] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [generatedCode, setGeneratedCode] = useState({ html: '', css: '', js: '' });
  const [currentStep, setCurrentStep] = useState<'html' | 'css' | 'js' | null>(null);

  // Helper to parse usage from stream
  const parseUsage = (content: string) => {
    const usageMatch = content.match(/__USAGE__(.+?)__END__/);
    if (usageMatch) {
      try {
        const usageData = JSON.parse(usageMatch[1]);
        return {
          usage: usageData._usage,
          cleanContent: content.replace(/__USAGE__.+?__END__/, '').trim()
        };
      } catch (e) {
        console.error('Failed to parse usage:', e);
      }
    }
    return { usage: null, cleanContent: content };
  };

  const handleGenerate = async (
    description: string,
    images: Array<{ url: string; filename: string; description?: string }>,
    mode: 'section' | 'widget' = 'section',
    useExtractedClasses: boolean = false
  ) => {
    try {
      setIsGenerating(true);
      setShowDialog(false);

      // Switch to Section Editor tab immediately
      if (onSwitchToSectionEditor) {
        onSwitchToSectionEditor();
      }

      // Generate HTML
      setCurrentStep('html');
      if (onSwitchCodeTab) onSwitchCodeTab('html');

      const htmlResponse = await fetch('/api/generate-html-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          images,
          type: 'html',
          model,
          mode,
          useExtractedClasses,
          designSystemSummary: useExtractedClasses ? designSystemSummary : null
        }),
      });

      const htmlReader = htmlResponse.body?.getReader();
      const htmlDecoder = new TextDecoder();
      let html = '';

      if (htmlReader) {
        while (true) {
          const { done, value } = await htmlReader.read();
          if (done) break;
          const chunk = htmlDecoder.decode(value);
          html += chunk;
        }

        // Parse usage and clean content
        const { usage: htmlUsage, cleanContent: cleanHtml } = parseUsage(html);
        html = cleanHtml;

        // Record usage if available
        if (htmlUsage) {
          console.log('📊 HTML generation usage:', htmlUsage);
          recordUsage(htmlUsage.model, {
            inputTokens: htmlUsage.promptTokens,
            outputTokens: htmlUsage.completionTokens,
            cacheCreationTokens: 0,
            cacheReadTokens: 0,
          });
        }

        setGeneratedCode(prev => ({ ...prev, html }));

        // Stream to Section Editor
        if (onStreamUpdate) {
          onStreamUpdate('html', html);
        }
      }

      // Generate CSS
      setCurrentStep('css');
      if (onSwitchCodeTab) onSwitchCodeTab('css');

      const cssResponse = await fetch('/api/generate-html-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          images,
          type: 'css',
          model,
          mode,
          generatedHtml: html,
          useExtractedClasses,
          designSystemSummary: useExtractedClasses ? designSystemSummary : null
        }),
      });

      const cssReader = cssResponse.body?.getReader();
      const cssDecoder = new TextDecoder();
      let css = '';

      if (cssReader) {
        while (true) {
          const { done, value } = await cssReader.read();
          if (done) break;
          const chunk = cssDecoder.decode(value);
          css += chunk;
        }

        // Parse usage and clean content
        const { usage: cssUsage, cleanContent: cleanCss } = parseUsage(css);
        css = cleanCss;

        // Record usage if available
        if (cssUsage) {
          console.log('📊 CSS generation usage:', cssUsage);
          recordUsage(cssUsage.model, {
            inputTokens: cssUsage.promptTokens,
            outputTokens: cssUsage.completionTokens,
            cacheCreationTokens: 0,
            cacheReadTokens: 0,
          });
        }

        setGeneratedCode(prev => ({ ...prev, css }));

        // Stream to Section Editor
        if (onStreamUpdate) {
          onStreamUpdate('css', css);
        }
      }

      // Generate JS
      setCurrentStep('js');
      if (onSwitchCodeTab) onSwitchCodeTab('js');

      const jsResponse = await fetch('/api/generate-html-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          images,
          type: 'js',
          model,
          mode,
          generatedHtml: html,
          generatedCss: css,
          useExtractedClasses,
          designSystemSummary: useExtractedClasses ? designSystemSummary : null
        }),
      });

      const jsReader = jsResponse.body?.getReader();
      const jsDecoder = new TextDecoder();
      let js = '';

      if (jsReader) {
        while (true) {
          const { done, value } = await jsReader.read();
          if (done) break;
          const chunk = jsDecoder.decode(value);
          js += chunk;
        }

        // Parse usage and clean content
        const { usage: jsUsage, cleanContent: cleanJs } = parseUsage(js);
        js = cleanJs;

        // Record usage if available
        if (jsUsage) {
          console.log('📊 JS generation usage:', jsUsage);
          recordUsage(jsUsage.model, {
            inputTokens: jsUsage.promptTokens,
            outputTokens: jsUsage.completionTokens,
            cacheCreationTokens: 0,
            cacheReadTokens: 0,
          });
        }

        setGeneratedCode(prev => ({ ...prev, js }));

        // Stream to Section Editor
        if (onStreamUpdate) {
          onStreamUpdate('js', js);
        }
      }

      setGenerationComplete(true);
      setCurrentStep(null);
      setIsGenerating(false);

      // Call the callback if provided
      if (onGenerate) {
        onGenerate(html, css, js);
      }

    } catch (error) {
      console.error('Generation failed:', error);
      setIsGenerating(false);
      setCurrentStep(null);
    }
  };

  return (
    <>
      {showDialog && (
        <HTMLGeneratorDialog
          initialDescription={data.description}
          initialImages={data.images}
          designSystemSummary={designSystemSummary}
          onGenerate={handleGenerate}
          onClose={() => setShowDialog(false)}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCodeIcon className="h-5 w-5" />
            HTML Generator
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isGenerating ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2Icon size={16} className="animate-spin" />
                <p className="text-sm text-muted-foreground">
                  Generating {currentStep?.toUpperCase()}...
                </p>
              </div>
              <div className="text-xs text-muted-foreground">
                <div className={currentStep === 'html' ? 'text-blue-600 font-medium' : ''}>
                  {currentStep === 'html' ? '→ ' : '✓ '}HTML: {generatedCode.html.length} characters
                </div>
                <div className={currentStep === 'css' ? 'text-blue-600 font-medium' : ''}>
                  {currentStep === 'css' ? '→ ' : currentStep === 'js' || generationComplete ? '✓ ' : ''}
                  CSS: {generatedCode.css.length} characters
                </div>
                <div className={currentStep === 'js' ? 'text-blue-600 font-medium' : ''}>
                  {currentStep === 'js' ? '→ ' : generationComplete ? '✓ ' : ''}
                  JS: {generatedCode.js.length} characters
                </div>
              </div>
            </div>
          ) : generationComplete ? (
            <div className="space-y-2">
              <p className="text-sm text-green-600">✓ Generation complete!</p>
              <div className="text-xs text-muted-foreground">
                <div>HTML: {generatedCode.html.length} characters</div>
                <div>CSS: {generatedCode.css.length} characters</div>
                <div>JS: {generatedCode.js.length} characters</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDialog(true)}
              >
                Regenerate
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{data.message}</p>
              <p className="text-xs">
                {data.imageCount > 0 && `${data.imageCount} image(s) to analyze`}
              </p>
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowDialog(true)}
              >
                Open Generator
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
