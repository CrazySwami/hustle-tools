import { PageExtractor } from '@/components/page-extractor/PageExtractor';

export const metadata = {
  title: 'Page Extractor | Hustle Tools',
  description: 'Extract and separate HTML, CSS, and JavaScript from any webpage for easy editing and analysis.',
};

export default function PageExtractorPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl pt-24">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Page Extractor</h1>
        <p className="text-muted-foreground text-lg">
          Extract clean HTML, CSS, and JavaScript files from any webpage
        </p>
      </div>

      <PageExtractor />

      {/* How It Works Section */}
      <div className="mt-12 space-y-6">
        <h2 className="text-2xl font-bold">How It Works</h2>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
              1
            </div>
            <h3 className="font-semibold">Enter URL</h3>
            <p className="text-sm text-muted-foreground">
              Paste the URL of any webpage you want to extract
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
              2
            </div>
            <h3 className="font-semibold">Extract Files</h3>
            <p className="text-sm text-muted-foreground">
              Our server fetches and separates HTML, CSS, and JS into clean files
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
              3
            </div>
            <h3 className="font-semibold">Download & Edit</h3>
            <p className="text-sm text-muted-foreground">
              Download separate files or a single HTML file ready for AI editing
            </p>
          </div>
        </div>

        <div className="mt-8 p-6 bg-muted rounded-lg">
          <h3 className="font-semibold mb-3">Use Cases</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span><strong>AI-Powered Editing:</strong> Extract pages to edit with AI tools like ChatGPT or Claude</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span><strong>Template Recreation:</strong> Download clean code to recreate designs in WordPress/Elementor</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span><strong>Code Analysis:</strong> Study how other websites structure their HTML, CSS, and JavaScript</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span><strong>Style Extraction:</strong> Get all CSS (inline + external) in one file for easy modification</span>
            </li>
          </ul>
        </div>

        <div className="mt-6 p-6 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
          <h3 className="font-semibold mb-3 text-amber-900 dark:text-amber-100">Limitations</h3>
          <ul className="space-y-2 text-sm text-amber-800 dark:text-amber-200">
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>Dynamic content rendered by JavaScript frameworks (React, Vue, etc.) may not be fully captured</span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>Some external resources may fail to load due to CORS restrictions or authentication</span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>Analytics and tracking scripts are automatically filtered out for cleaner code</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
