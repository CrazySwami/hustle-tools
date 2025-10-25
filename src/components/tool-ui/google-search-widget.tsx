'use client';

import { useState } from 'react';
import { ExternalLink, ChevronDown, Search } from 'lucide-react';
import { GoogleSearchConfirmationWidget } from './google-search-confirmation-widget';

interface GoogleSearchWidgetProps {
  result: {
    confirmationRequired?: boolean;
    success?: boolean;
    keyword: string;
    location?: string;
    country?: string;
    language?: string;
    device?: 'desktop' | 'tablet' | 'mobile';
    numResults?: number;
    totalResults?: number;
    organicResults?: Array<{
      position: number;
      title: string;
      link: string;
      displayedLink: string;
      snippet: string;
      source?: string;
    }>;
    relatedSearches?: Array<string | { query: string; [key: string]: any }>;
    knowledgeGraph?: any;
    answerBox?: any;
    shoppingResults?: any[];
    localResults?: any;
    peopleAlsoAsk?: Array<{
      question: string;
      snippet: string;
      link?: string;
    }>;
  };
}

export function GoogleSearchWidget({ result }: GoogleSearchWidgetProps) {
  // If confirmation is required, show the confirmation widget
  if (result.confirmationRequired) {
    return (
      <GoogleSearchConfirmationWidget
        toolName="googleSearch"
        args={{
          keyword: result.keyword,
          location: result.location,
          country: result.country,
          language: result.language,
          device: result.device,
          numResults: result.numResults,
        }}
      />
    );
  }

  const [expandedSections, setExpandedSections] = useState({
    organic: true,
    paa: false,
    related: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (!result.success) {
    return (
      <div className="my-4 rounded-lg border border-border/50 bg-muted/30 p-4">
        <p className="text-destructive text-sm">Search failed</p>
      </div>
    );
  }

  const hasResults = result.organicResults && result.organicResults.length > 0;
  const hasPAA = result.peopleAlsoAsk && result.peopleAlsoAsk.length > 0;
  const hasRelated = result.relatedSearches && result.relatedSearches.length > 0;

  return (
    <div className="my-4 rounded-lg border border-border/50 bg-card">
      {/* Compact Header */}
      <div className="flex items-center gap-2.5 border-b border-border/50 px-4 py-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-500/10">
          <Search className="h-3.5 w-3.5 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium truncate">{result.keyword}</h3>
          <p className="text-xs text-muted-foreground">
            {result.totalResults?.toLocaleString() || 'N/A'} results
            {result.location && ` • ${result.location}`}
          </p>
        </div>
      </div>

      {/* Organic Results */}
      {hasResults && (
        <div className="border-b border-border/50">
          <button
            onClick={() => toggleSection('organic')}
            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors"
          >
            <span className="text-xs font-medium text-muted-foreground">
              Organic Results ({result.organicResults!.length})
            </span>
            <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform duration-200 ${expandedSections.organic ? 'rotate-180' : ''}`} />
          </button>
          {expandedSections.organic && (
            <div className="divide-y divide-border/30">
              {result.organicResults!.map((item) => (
                <a
                  key={item.position}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-3 hover:bg-muted/20 transition-colors group"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary flex-shrink-0 mt-0.5">
                      {item.position}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-1.5">
                        <h4 className="text-sm font-medium text-blue-600 group-hover:underline line-clamp-2 flex-1">
                          {item.title}
                        </h4>
                        <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
                      </div>
                      <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
                        {item.displayedLink}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                        {item.snippet}
                      </p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* People Also Ask */}
      {hasPAA && (
        <div className="border-b border-border/50">
          <button
            onClick={() => toggleSection('paa')}
            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors"
          >
            <span className="text-xs font-medium text-muted-foreground">
              People Also Ask ({result.peopleAlsoAsk!.length})
            </span>
            <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform duration-200 ${expandedSections.paa ? 'rotate-180' : ''}`} />
          </button>
          {expandedSections.paa && (
            <div className="px-4 py-3 space-y-2">
              {result.peopleAlsoAsk!.map((paa, i) => (
                <div key={i} className="rounded-md border border-border/50 bg-muted/20 p-3">
                  <p className="text-xs font-medium mb-1.5">{paa.question}</p>
                  <p className="text-xs text-muted-foreground line-clamp-3">{paa.snippet}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Related Searches */}
      {hasRelated && (
        <div>
          <button
            onClick={() => toggleSection('related')}
            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors"
          >
            <span className="text-xs font-medium text-muted-foreground">
              Related Searches ({result.relatedSearches!.length})
            </span>
            <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform duration-200 ${expandedSections.related ? 'rotate-180' : ''}`} />
          </button>
          {expandedSections.related && (
            <div className="px-4 py-3 flex flex-wrap gap-1.5">
              {result.relatedSearches!.map((item, i) => {
                // Handle both string and object formats
                const queryText = typeof item === 'string' ? item : item.query || '';
                return (
                  <span
                    key={i}
                    className="inline-flex items-center px-2.5 py-1 text-xs bg-muted/50 border border-border/50 rounded-full hover:bg-muted transition-colors cursor-default"
                  >
                    {queryText}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
