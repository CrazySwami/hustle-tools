import { PageExtractor } from '@/components/page-extractor/PageExtractor';
import { FileText } from 'lucide-react';

export const metadata = {
  title: 'Page Extractor | Hustle Tools',
  description: 'Extract and separate HTML, CSS, and JavaScript from any webpage for easy editing and analysis.',
};

export default function PageExtractorPage() {
  return (
    <div className="min-h-screen bg-gray-50 transition-colors duration-300">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-4">
        <div className="flex items-center gap-3 justify-center">
          <FileText className="w-8 h-8 text-orange-500" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Page Extractor</h1>
        </div>
        <p className="mt-4 text-center text-gray-600">
          Extract clean HTML, CSS, and JavaScript files from any webpage
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
        <PageExtractor />
      </div>

      {/* How It Works Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        <div className="bg-white border-2 border-gray-200 rounded-lg p-6 space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">How It Works</h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="font-semibold text-gray-900">Enter URL</h3>
              <p className="text-sm text-gray-600">
                Paste the URL of any webpage you want to extract
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="font-semibold text-gray-900">Extract Files</h3>
              <p className="text-sm text-gray-600">
                Our server fetches and separates HTML, CSS, and JS into clean files
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold">
                3
              </div>
              <h3 className="font-semibold text-gray-900">Download & Edit</h3>
              <p className="text-sm text-gray-600">
                Download separate files or a single HTML file ready for AI editing
              </p>
            </div>
          </div>

          <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="font-semibold mb-3 text-gray-900">Use Cases</h3>
          <ul className="space-y-2 text-sm text-gray-900">
            <li className="flex items-start gap-2">
              <span className="text-orange-500 mt-0.5">•</span>
              <span><strong>AI-Powered Editing:</strong> Extract pages to edit with AI tools like ChatGPT or Claude</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 mt-0.5">•</span>
              <span><strong>Template Recreation:</strong> Download clean code to recreate designs in WordPress/Elementor</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 mt-0.5">•</span>
              <span><strong>Code Analysis:</strong> Study how other websites structure their HTML, CSS, and JavaScript</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 mt-0.5">•</span>
              <span><strong>Style Extraction:</strong> Get all CSS (inline + external) in one file for easy modification</span>
            </li>
          </ul>
        </div>

        <div className="mt-6 p-6 bg-amber-50 border-2 border-amber-200 rounded-lg">
          <h3 className="font-semibold mb-3 text-amber-900">Limitations</h3>
          <ul className="space-y-2 text-sm text-amber-800">
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
    </div>
  );
}
