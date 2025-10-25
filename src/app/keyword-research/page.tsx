'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LocationAutocomplete } from '@/components/ui/location-autocomplete';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Loader2,
  ExternalLink,
  Download,
  TrendingUp,
  MapPin,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrganicResult {
  position: number;
  title: string;
  link: string;
  displayed_link: string;
  snippet: string;
  date?: string;
  source?: string;
  thumbnail?: string;
}

interface SearchResult {
  success: boolean;
  keyword: string;
  location?: string;
  organicResults?: OrganicResult[];
  searchInformation?: {
    query_displayed: string;
    total_results: number;
    time_taken_displayed: number;
  };
  relatedSearches?: Array<{
    query: string;
    link: string;
  }>;
  error?: string;
}

interface BatchResponse {
  success: boolean;
  summary?: {
    total: number;
    successful: number;
    failed: number;
  };
  results?: SearchResult[];
  keyword?: string;
  location?: string;
  data?: any;
  organicResults?: OrganicResult[];
  searchInformation?: any;
  relatedSearches?: any[];
}

const COUNTRIES = [
  { code: 'us', name: 'United States' },
  { code: 'gb', name: 'United Kingdom' },
  { code: 'ca', name: 'Canada' },
  { code: 'au', name: 'Australia' },
  { code: 'de', name: 'Germany' },
  { code: 'fr', name: 'France' },
  { code: 'es', name: 'Spain' },
  { code: 'it', name: 'Italy' },
  { code: 'mx', name: 'Mexico' },
  { code: 'br', name: 'Brazil' },
];

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'it', name: 'Italian' },
];

export default function KeywordResearchPage() {
  const [keywordsInput, setKeywordsInput] = useState('');
  const [location, setLocation] = useState('Austin, Texas, United States');
  const [country, setCountry] = useState('us');
  const [language, setLanguage] = useState('en');
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [numResults, setNumResults] = useState(10);

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);

  const handleSearch = async () => {
    const keywords = keywordsInput
      .split('\n')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    if (keywords.length === 0) return;

    setLoading(true);
    setResults([]);
    setSelectedKeyword(null);

    try {
      const res = await fetch('/api/serp-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords,
          location,
          gl: country,
          hl: language,
          device,
          num: numResults,
        }),
      });

      const data: BatchResponse = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Search failed');
      }

      // Handle single or batch results
      if (data.results) {
        setResults(data.results);
      } else if (data.keyword && data.organicResults) {
        // Single result format
        setResults([
          {
            success: true,
            keyword: data.keyword,
            location: data.location,
            organicResults: data.organicResults,
            searchInformation: data.searchInformation,
            relatedSearches: data.relatedSearches,
          },
        ]);
      }
    } catch (error) {
      console.error('Search error:', error);
      alert(error instanceof Error ? error.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const downloadResults = () => {
    const dataStr = JSON.stringify(results, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `keyword-research-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadCSV = () => {
    // Create CSV with position, keyword, title, URL, displayed_link
    const rows: string[][] = [['Keyword', 'Position', 'Title', 'URL', 'Displayed Link', 'Snippet']];

    results.forEach((result) => {
      if (result.success && result.organicResults) {
        result.organicResults.forEach((organic) => {
          rows.push([
            result.keyword,
            String(organic.position),
            organic.title,
            organic.link,
            organic.displayed_link,
            organic.snippet.replace(/[\n\r]/g, ' '),
          ]);
        });
      }
    });

    const csvContent = rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `keyword-research-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const selectedResult = selectedKeyword
    ? results.find((r) => r.keyword === selectedKeyword)
    : null;

  return (
    <div className="min-h-screen bg-background pt-24">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500">
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
            <h1 className="text-4xl font-bold">Keyword Research & SERP Analysis</h1>
          </div>
          <p className="text-muted-foreground">
            Analyze Google search results, track rankings, and discover keyword opportunities
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Panel: Search Form */}
          <div className="lg:col-span-1">
            <div className="bg-card border rounded-lg p-6 space-y-6 sticky top-24">
              <div>
                <h2 className="text-lg font-semibold mb-4">Search Settings</h2>

                {/* Keywords Input */}
                <div className="space-y-2 mb-4">
                  <label className="text-sm font-medium">Keywords (one per line)</label>
                  <Textarea
                    placeholder="best coffee shops&#10;wordpress themes&#10;react tutorials"
                    value={keywordsInput}
                    onChange={(e) => setKeywordsInput(e.target.value)}
                    rows={6}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    {keywordsInput.split('\n').filter((k) => k.trim()).length} keywords
                  </p>
                </div>

                {/* Location */}
                <div className="space-y-2 mb-4">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </label>
                  <LocationAutocomplete
                    value={location}
                    onChange={setLocation}
                    placeholder="Austin, Texas, United States"
                  />
                </div>

                {/* Country */}
                <div className="space-y-2 mb-4">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Country
                  </label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Language */}
                <div className="space-y-2 mb-4">
                  <label className="text-sm font-medium">Language</label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((l) => (
                        <SelectItem key={l.code} value={l.code}>
                          {l.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Device */}
                <div className="space-y-2 mb-4">
                  <label className="text-sm font-medium">Device</label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={device === 'desktop' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDevice('desktop')}
                      className="flex items-center gap-2"
                    >
                      <Monitor className="h-4 w-4" />
                      Desktop
                    </Button>
                    <Button
                      variant={device === 'tablet' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDevice('tablet')}
                      className="flex items-center gap-2"
                    >
                      <Tablet className="h-4 w-4" />
                      Tablet
                    </Button>
                    <Button
                      variant={device === 'mobile' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDevice('mobile')}
                      className="flex items-center gap-2"
                    >
                      <Smartphone className="h-4 w-4" />
                      Mobile
                    </Button>
                  </div>
                </div>

                {/* Number of Results */}
                <div className="space-y-2 mb-6">
                  <label className="text-sm font-medium">Results per Keyword</label>
                  <Select
                    value={String(numResults)}
                    onValueChange={(v) => setNumResults(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 results</SelectItem>
                      <SelectItem value="20">20 results</SelectItem>
                      <SelectItem value="50">50 results</SelectItem>
                      <SelectItem value="100">100 results</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Search Button */}
                <Button
                  className="w-full"
                  onClick={handleSearch}
                  disabled={loading || keywordsInput.trim().length === 0}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Search Keywords
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Right Panel: Results */}
          <div className="lg:col-span-2">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-3 text-muted-foreground">Searching keywords...</span>
              </div>
            )}

            {!loading && results.length === 0 && (
              <div className="text-center py-12 border rounded-lg bg-card">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg mb-2">No searches yet</p>
                <p className="text-sm text-muted-foreground">
                  Enter keywords and click "Search Keywords" to begin
                </p>
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="space-y-6">
                {/* Summary */}
                <div className="bg-card border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Search Results</h2>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={downloadCSV}>
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                      </Button>
                      <Button variant="outline" size="sm" onClick={downloadResults}>
                        <Download className="h-4 w-4 mr-2" />
                        Export JSON
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold">{results.length}</div>
                      <div className="text-sm text-muted-foreground">Keywords</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {results.filter((r) => r.success).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Successful</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold">
                        {results.reduce(
                          (sum, r) => sum + (r.organicResults?.length || 0),
                          0
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Results</div>
                    </div>
                  </div>
                </div>

                {/* Keywords List */}
                <div className="space-y-2">
                  {results.map((result) => (
                    <div
                      key={result.keyword}
                      className={cn(
                        'border rounded-lg bg-card overflow-hidden transition-all cursor-pointer',
                        selectedKeyword === result.keyword &&
                          'ring-2 ring-primary border-primary'
                      )}
                      onClick={() => setSelectedKeyword(result.keyword)}
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <Search className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <h3 className="font-semibold">{result.keyword}</h3>
                                {result.success && result.searchInformation && (
                                  <p className="text-sm text-muted-foreground">
                                    {result.searchInformation.total_results?.toLocaleString() ||
                                      'N/A'}{' '}
                                    results •{' '}
                                    {result.organicResults?.length || 0} positions tracked
                                  </p>
                                )}
                                {!result.success && (
                                  <p className="text-sm text-destructive">{result.error}</p>
                                )}
                              </div>
                            </div>
                          </div>

                          {result.success && (
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="text-2xl font-bold">
                                  {result.organicResults?.length || 0}
                                </div>
                                <div className="text-xs text-muted-foreground">Rankings</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Expanded View */}
                      {selectedKeyword === result.keyword &&
                        result.success &&
                        result.organicResults && (
                          <div className="border-t bg-muted/30 p-4">
                            <div className="space-y-3">
                              {result.organicResults.map((organic) => (
                                <div
                                  key={organic.position}
                                  className="bg-background border rounded-lg p-4"
                                >
                                  <div className="flex gap-4">
                                    <div className="flex-shrink-0">
                                      <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                                        {organic.position}
                                      </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <a
                                        href={organic.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline font-medium text-lg line-clamp-2"
                                      >
                                        {organic.title}
                                      </a>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="text-sm text-green-700">
                                          {organic.displayed_link}
                                        </span>
                                        {organic.source && (
                                          <span className="text-sm text-muted-foreground">
                                            • {organic.source}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                        {organic.snippet}
                                      </p>
                                      <div className="flex items-center gap-2 mt-3">
                                        <Button size="sm" variant="outline" asChild>
                                          <a
                                            href={organic.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                          >
                                            <ExternalLink className="h-3 w-3 mr-1" />
                                            Visit
                                          </a>
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Related Searches */}
                            {result.relatedSearches && result.relatedSearches.length > 0 && (
                              <div className="mt-6 pt-4 border-t">
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                  <TrendingUp className="h-4 w-4" />
                                  Related Searches
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {result.relatedSearches.map((related, i) => (
                                    <a
                                      key={i}
                                      href={related.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-3 py-1.5 text-sm bg-background border rounded-full hover:bg-muted transition-colors"
                                    >
                                      {related.query}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
