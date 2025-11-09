"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";
import ReactMarkdown from 'react-markdown';

interface Citation {
  title: string;
  url: string;
}

interface PerplexitySearchWidgetProps {
  result: {
    query: string;
    focus: string;
    maxResults: number;
    includeImages: boolean;
    timeframe?: string;
    status: string;
    timestamp: string;
    message: string;
    answer?: string;
    citations?: string[];
    error?: string;
  };
}

export function PerplexitySearchWidget({ result }: PerplexitySearchWidgetProps) {
  const { query, status = 'loading', answer, citations = [], error } = result;
  const [displayedText, setDisplayedText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  // Show loading state immediately if no status is provided
  const isLoading = !status || status === 'loading' || (!answer && !error);
  const isSuccess = status === 'success' && answer;
  const isError = status === 'error' || error;

  // Stream the answer text
  useEffect(() => {
    if (answer && isSuccess) {
      setIsStreaming(true);
      setDisplayedText('');
      
      let currentIndex = 0;
      const streamInterval = setInterval(() => {
        if (currentIndex < answer.length) {
          setDisplayedText(answer.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          setIsStreaming(false);
          clearInterval(streamInterval);
        }
      }, 10);

      return () => clearInterval(streamInterval);
    }
  }, [answer, isSuccess]);

  // Convert string URLs to Citation objects
  const formattedCitations: Citation[] = citations.map((url, index) => {
    try {
      const urlObj = new URL(url);
      return {
        title: urlObj.hostname.replace('www.', ''),
        url: url
      };
    } catch {
      return {
        title: `Source ${index + 1}`,
        url: url
      };
    }
  });

  console.log('🎨 [Perplexity Widget] Rendering:', {
    query,
    status,
    hasAnswer: !!answer,
    citationsCount: citations.length,
    citations: citations,
  });

  if (isLoading) {
    return (
      <Card className="w-full max-w-3xl">
        <CardContent className="p-3 px-[30px] py-0">
          <div className="flex items-center justify-center py-8">
            <div className="relative">
              <Search className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-16 w-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
              </div>
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground mb-3">Searching for "{query}"...</p>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="w-full max-w-3xl">
        <CardContent className="p-3 px-[30px] py-0">
          <div className="text-center py-8">
            <p className="text-red-600 font-medium">Search failed</p>
            <p className="text-sm text-muted-foreground mt-2">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-3xl">
      <CardContent className="p-3 px-[30px] py-0">
        <div className="flex items-start justify-between mb-3 gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-[10px] font-medium text-muted-foreground mb-0.5">Searched for</h3>
            <p className="text-sm font-semibold text-foreground">{query}</p>
          </div>
        </div>

        <div className="mb-3">
          <div className="text-sm text-foreground leading-relaxed prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{displayedText}</ReactMarkdown>
            {isStreaming && <span className="animate-pulse">▊</span>}
          </div>
        </div>

        {formattedCitations.length > 0 && (
          <div>
            <h4 className="text-[10px] font-medium text-muted-foreground mb-1.5">Sources</h4>
            <div className="flex gap-1.5 overflow-x-auto pb-1.5 -mx-1 px-1">
              {formattedCitations.map((citation, index) => {
                const domain = new URL(citation.url).hostname;
                const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;

                return (
                  <a
                    key={index}
                    href={citation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 p-1.5 rounded-md border border-border hover:bg-accent transition-colors group flex-shrink-0 w-40"
                  >
                    <img
                      src={faviconUrl}
                      alt=""
                      className="w-3.5 h-3.5 flex-shrink-0"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/abstract-website-design.png";
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-medium text-foreground group-hover:text-primary truncate">
                        {citation.title}
                      </p>
                      <p className="text-[9px] text-muted-foreground truncate">{domain}</p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
