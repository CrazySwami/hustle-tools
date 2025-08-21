import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Link } from 'lucide-react';

// Define the structure of the data returned by the FireCrawl scrape API
interface ScrapeData {
  content: string;
  markdown: string;
  metadata: {
    sourceURL: string;
    title?: string;
    description?: string;
    ogTitle?: string;
    ogDescription?: string;
  };
  error?: string;
}

export function ScrapeResultWidget({ data }: { data: ScrapeData }) {
  // Handle cases where the tool returns an error
  if (data.error) {
    return (
      <Card className="w-full max-w-2xl border-red-500">
        <CardHeader>
          <CardTitle className="text-red-500">Scrape Failed</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-400">{data.error}</p>
        </CardContent>
      </Card>
    );
  }

  const { metadata, markdown } = data;
  const title = metadata.title || metadata.ogTitle || 'Untitled Page';

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-blue-500" />
          {title}
        </CardTitle>
        <CardDescription className="flex items-center gap-2 pt-2">
          <Link className="h-4 w-4" />
          <a 
            href={metadata.sourceURL} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline truncate"
          >
            {metadata.sourceURL}
          </a>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm dark:prose-invert max-h-60 overflow-y-auto rounded-md border p-4">
          <p>{markdown.substring(0, 500)}{markdown.length > 500 ? '...' : ''}</p>
        </div>
      </CardContent>
    </Card>
  );
}
