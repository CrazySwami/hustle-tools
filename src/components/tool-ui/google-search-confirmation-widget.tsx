'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LocationAutocomplete } from '@/components/ui/location-autocomplete';
import { GoogleSearchWidget } from './google-search-widget';
import { Search, Loader2, ChevronDown, X, CheckCircle2 } from 'lucide-react';

interface GoogleSearchConfirmationWidgetProps {
  toolName: string;
  args: {
    keyword: string;
    location?: string;
    country?: string;
    language?: string;
    device?: 'desktop' | 'tablet' | 'mobile';
    numResults?: number;
  };
}

export function GoogleSearchConfirmationWidget({ toolName, args }: GoogleSearchConfirmationWidgetProps) {
  const [status, setStatus] = useState<'pending' | 'loading' | 'complete' | 'error'>('pending');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Form state initialized from AI's suggested args
  const [keyword, setKeyword] = useState(args.keyword || '');
  const [location, setLocation] = useState(args.location || '');
  const [country, setCountry] = useState(args.country || 'us');
  const [language, setLanguage] = useState(args.language || 'en');
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>(args.device || 'desktop');
  const [numResults, setNumResults] = useState(args.numResults || 10);

  const handleConfirm = async () => {
    setStatus('loading');
    setError(null);

    try {
      const response = await fetch('/api/serp-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword,
          location: location || undefined,
          gl: country,
          hl: language,
          device,
          num: numResults,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
        setStatus('complete');
      } else {
        setError(data.error || 'Search failed');
        setStatus('error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus('error');
    }
  };

  const handleCancel = () => {
    setStatus('error');
    setError('Search cancelled by user');
  };

  // If complete, show results widget with success animation
  if (status === 'complete' && result) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="my-4 rounded-lg border border-green-500/20 bg-green-500/5 p-3 animate-in fade-in slide-in-from-top-1 duration-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 animate-in zoom-in duration-300" />
            <p className="text-sm font-medium text-green-700 dark:text-green-400">
              Search completed successfully
            </p>
          </div>
        </div>
        <GoogleSearchWidget result={result} />
      </div>
    );
  }

  // If error, show error message
  if (status === 'error') {
    return (
      <div className="my-4 rounded-lg border border-border/50 bg-muted/30 p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex items-start gap-3">
          <X className="h-4 w-4 text-destructive mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-destructive">Search cancelled</p>
            {error && <p className="text-sm text-muted-foreground mt-1">{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  // Show confirmation form
  return (
    <div className="my-4 rounded-lg border border-border/50 bg-card animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className={`flex h-8 w-8 items-center justify-center rounded-md transition-all duration-300 ${
            status === 'loading'
              ? 'bg-green-500/10 animate-pulse'
              : 'bg-blue-500/10'
          }`}>
            {status === 'loading' ? (
              <Loader2 className="h-4 w-4 text-green-600 animate-spin" />
            ) : (
              <Search className="h-4 w-4 text-blue-600" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium">
              {status === 'loading' ? 'Searching Google...' : 'Confirm Google Search'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {status === 'loading' ? 'Please wait while we fetch results' : 'Review parameters before searching'}
            </p>
          </div>
        </div>
        {status !== 'loading' && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {isExpanded ? 'Less' : 'More'}
            <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* Loading Progress Bar */}
      {status === 'loading' && (
        <div className="relative h-1 bg-muted overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 animate-loading-bar" />
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Keyword - Always visible */}
        <div className="space-y-1.5">
          <Label htmlFor="keyword" className="text-xs font-medium">
            Keyword
          </Label>
          <Input
            id="keyword"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Enter search keyword"
            disabled={status === 'loading'}
            className="h-9 text-sm transition-all duration-200 focus:border-green-500/50 focus:ring-green-500/20"
          />
        </div>

        {/* Location - Always visible */}
        <div className="space-y-1.5">
          <Label htmlFor="location" className="text-xs font-medium">
            Location <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <LocationAutocomplete
            value={location}
            onChange={setLocation}
            placeholder="e.g., New York, NY, United States"
            disabled={status === 'loading'}
          />
        </div>

        {/* Advanced Options - Collapsible */}
        {isExpanded && (
          <div className="space-y-3 pt-2 border-t border-border/50 animate-in slide-in-from-top-2 fade-in duration-200">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="country" className="text-xs font-medium">
                  Country
                </Label>
                <Select value={country} onValueChange={setCountry} disabled={status === 'loading'}>
                  <SelectTrigger id="country" className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us">United States</SelectItem>
                    <SelectItem value="uk">United Kingdom</SelectItem>
                    <SelectItem value="ca">Canada</SelectItem>
                    <SelectItem value="au">Australia</SelectItem>
                    <SelectItem value="de">Germany</SelectItem>
                    <SelectItem value="fr">France</SelectItem>
                    <SelectItem value="es">Spain</SelectItem>
                    <SelectItem value="it">Italy</SelectItem>
                    <SelectItem value="jp">Japan</SelectItem>
                    <SelectItem value="cn">China</SelectItem>
                    <SelectItem value="in">India</SelectItem>
                    <SelectItem value="br">Brazil</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="language" className="text-xs font-medium">
                  Language
                </Label>
                <Select value={language} onValueChange={setLanguage} disabled={status === 'loading'}>
                  <SelectTrigger id="language" className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="it">Italian</SelectItem>
                    <SelectItem value="pt">Portuguese</SelectItem>
                    <SelectItem value="zh">Chinese</SelectItem>
                    <SelectItem value="ja">Japanese</SelectItem>
                    <SelectItem value="ko">Korean</SelectItem>
                    <SelectItem value="ar">Arabic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="device" className="text-xs font-medium">
                  Device
                </Label>
                <Select value={device} onValueChange={(v) => setDevice(v as any)} disabled={status === 'loading'}>
                  <SelectTrigger id="device" className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desktop">Desktop</SelectItem>
                    <SelectItem value="tablet">Tablet</SelectItem>
                    <SelectItem value="mobile">Mobile</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="numResults" className="text-xs font-medium">
                  Results
                </Label>
                <Select value={String(numResults)} onValueChange={(v) => setNumResults(Number(v))} disabled={status === 'loading'}>
                  <SelectTrigger id="numResults" className="h-9 text-sm">
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
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 border-t border-border/50 px-4 py-3">
        <Button
          onClick={handleCancel}
          variant="ghost"
          disabled={status === 'loading'}
          size="sm"
          className="h-8 text-xs"
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={!keyword.trim() || status === 'loading'}
          size="sm"
          className={`h-8 text-xs transition-all duration-200 ${
            status === 'loading'
              ? 'bg-green-600 hover:bg-green-700'
              : 'hover:bg-green-600'
          }`}
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="mr-1.5 h-3 w-3" />
              Search Google
            </>
          )}
        </Button>
      </div>

      <style jsx global>{`
        @keyframes loading-bar {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .animate-loading-bar {
          animation: loading-bar 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
