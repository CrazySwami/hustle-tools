"use client";

import React, { useMemo, useState } from "react";
import JSZip from 'jszip';
import { Button } from "@/components/ui/button";


import { ChevronDown, ChevronRight } from 'lucide-react';

// Types for API responses
interface MapResponse {
  success: boolean;
  links?: string[];
  error?: string;
}

interface ScrapeItem {
  url: string;
  markdown?: string;
  error?: string;
}



interface FirecrawlScrapeResult {
  markdown: string;
  metadata: {
    sourceURL: string;
    error?: string;
  };
}

interface BatchStatusResponse {
  success: boolean;
  status: 'processing' | 'completed' | 'failed';
  completed: number;
  total: number;
  data?: FirecrawlScrapeResult[];
  error?: string;
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function slugFromUrl(u: string) {
  try {
    const { hostname, pathname } = new URL(u);
    const cleaned = (hostname + pathname)
      .replace(/[^a-zA-Z0-9\-\/]+/g, "-")
      .replace(/\/+/, "/")
      .replace(/^-+|-+$/g, "");
    return (cleaned || "page").slice(0, 80);
  } catch {
    return "page";
  }
}

export default function FirecrawlPage() {
  // Map state
  const [baseUrl, setBaseUrl] = useState("");
  const [includeSubdomains, setIncludeSubdomains] = useState(false);
  const [limit, setLimit] = useState<number | "">(200);
  const [mapping, setMapping] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [links, setLinks] = useState<string[]>([]);

  // Scrape state
  const [urlsText, setUrlsText] = useState("");

  const [openStates, setOpenStates] = useState<Record<string, boolean>>({});
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState({ completed: 0, total: 0 });
  const [scraping, setScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [scrapeResults, setScrapeResults] = useState<ScrapeItem[]>([]);

  const mappedCount = links.length;
  const urlsCount = useMemo(
    () => urlsText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).length,
    [urlsText]
  );

  async function handleMap() {
    setMapping(true);
    setMapError(null);
    setLinks([]);
    try {
      const res = await fetch("/api/map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: baseUrl,
          includeSubdomains,
          limit: typeof limit === "number" ? limit : undefined,
        }),
      });
      const data = (await res.json()) as MapResponse;
      if (!res.ok || !data.success) {
        throw new Error(data.error || `Map request failed (${res.status})`);
      }
      setLinks(data.links || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to map site";
      setMapError(msg);
    } finally {
      setMapping(false);
    }
  }

  function useLinksInTextarea() {
    if (!links.length) return;
    setUrlsText(links.join("\n"));
  }

  async function handleBatchScrape() {
    setScraping(true);
    setScrapeError(null);
    setScrapeResults([]);
    setJobId(null);
    setJobStatus(null);
    setJobProgress({ completed: 0, total: 0 });

    try {
      // Start the batch job
      const startRes = await fetch("/api/batch-scrape/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: urlsText }),
      });
      const startData = await startRes.json();
      if (!startRes.ok || !startData.success) {
        throw new Error(startData.error || "Failed to start batch scrape job");
      }
      setJobId(startData.id);

      // Poll for the result
      const poll = async () => {
        const statusRes = await fetch(`/api/batch-scrape/status/${startData.id}`);
        const statusData = (await statusRes.json()) as BatchStatusResponse;

        if (!statusRes.ok) {
          setJobStatus("error");
          setScrapeError(statusData.error || "Failed to get job status");
          return;
        }

        setJobStatus(statusData.status);
        setJobProgress({ completed: statusData.completed, total: statusData.total });

        if (statusData.status === "completed") {
                    const results = (statusData.data || []).map((item) => ({
            url: item.metadata.sourceURL,
            markdown: item.markdown,
            error: item.metadata.error
          }));

          setScrapeResults(results);
          setOpenStates(results.reduce((acc: Record<string, boolean>, result: ScrapeItem) => ({ ...acc, [result.url]: false }), {}));

          setScraping(false);
        } else if (statusData.status === "failed") {
          setScrapeError("Batch job failed.");
          setScraping(false);
        } else {
          setTimeout(poll, 15000);
        }
      };

      setTimeout(poll, 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to scrape URLs";
      setScrapeError(msg);
      setScraping(false);
    }
  }



  const handleToggleOne = (url: string) => {
    setOpenStates(prev => ({
      ...prev,
      [url]: !prev[url]
    }));
  };

  const handleDownloadZip = async () => {
    if (!scrapeResults || scrapeResults.length === 0) {
      return;
    }

    const zip = new JSZip();
    scrapeResults.forEach(item => {
      if (item.markdown) {
        const url = new URL(item.url);
        let filename = url.pathname.substring(1).replace(/\//g, '_');
        if (!filename) {
          filename = url.hostname.replace(/\./g, '_');
        } else {
          filename = `${url.hostname.replace(/\./g, '_')}_${filename}`;
        }
        if (url.search) {
          filename += `_${url.search.replace('?', '')}`;
        }
        filename += '.md';
        zip.file(filename, item.markdown);
      }
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = 'scraped_files.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadSingle = (markdown: string, url: string) => {
    downloadText(`${slugFromUrl(url)}.md`, markdown);
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <div className="mx-auto max-w-5xl p-5 pt-24">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Firecrawl</h1>
          <p className="mt-2 text-foreground/80">
            Crawl a website and extract markdown from all pages.
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-6 mt-6 items-start">
          <section className="w-full md:w-[35%]">
            <div className="space-y-4 rounded-lg border border-foreground/15 p-4 h-full">
              <h2 className="font-medium">1. Map Site</h2>
              <p className="text-sm text-foreground/70">
                Find all the links on a website.
              </p>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-sm">URL to crawl</label>
                  <input
                    type="url"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full rounded-md border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/30"
                  />
                </div>
                <div>
                  <label className="text-sm">Limit</label>
                  <input
                    type="number"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value ? parseInt(e.target.value) : "")}
                    placeholder="200"
                    className="w-full rounded-md border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/30"
                  />
                </div>
              </div>

              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={includeSubdomains}
                  onChange={(e) => setIncludeSubdomains(e.target.checked)}
                  className="accent-foreground"
                />
                Include subdomains
              </label>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleMap}
                  disabled={!baseUrl || mapping}
                  className="inline-flex items-center justify-center rounded-md bg-foreground text-background px-4 py-2 text-sm font-medium disabled:opacity-60"
                >
                  {mapping ? "Mapping..." : "Map"}
                </button>
                {mappedCount > 0 && (
                  <button
                    onClick={useLinksInTextarea}
                    className="inline-flex items-center justify-center rounded-md border border-foreground/15 px-3 py-2 text-sm hover:bg-foreground/5"
                  >
                    Use {mappedCount} links in textarea
                  </button>
                )}
              </div>

              {mapError && <p className="text-sm text-red-500">{mapError}</p>}

              {mappedCount > 0 && (
                <>
                  <div className="text-sm text-foreground/70">
                    Found {mappedCount} links.
                  </div>
                  <div className="rounded-md border border-foreground/10 bg-background/40 p-3 max-h-64 overflow-auto">
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      {links.map((l) => (
                        <li key={l} className="break-all">
                          <a href={l} target="_blank" rel="noreferrer" className="underline">
                            {l}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
          </section>

          <section className="w-full md:w-[65%]">
            <div className="space-y-4 rounded-lg border border-foreground/15 p-4 h-full">
              <h2 className="font-medium">2. Batch Scrape</h2>
              <p className="text-sm text-foreground/70">
                Extract markdown from a list of URLs.
              </p>

              <label className="text-sm">URLs (one per line)</label>
              <textarea
                value={urlsText}
                onChange={(e) => setUrlsText(e.target.value)}
                placeholder={links.length ? links.slice(0, 5).join("\n") + (links.length > 5 ? "\n…" : "") : "https://example.com/page-1\nhttps://example.com/page-2"}
                className="min-h-40 w-full rounded-md border border-foreground/15 bg-background px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-foreground/30"
              />

              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="text-xs text-foreground/70">{urlsCount} URL(s)</div>

              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleBatchScrape}
                  disabled={!urlsCount || scraping}
                  className="inline-flex items-center justify-center rounded-md bg-foreground text-background px-4 py-2 text-sm font-medium disabled:opacity-60"
                >
                  {scraping ? `Scraping... ${jobStatus || ''} (${jobProgress.completed}/${jobProgress.total})` : "Extract Markdown"}
                </button>

                {scrapeResults.length > 0 && (
                  <div className="flex items-center gap-3">
                    <Button onClick={handleDownloadZip} disabled={!scrapeResults.some(r => r.markdown)} variant="outline">Download All as .zip</Button>
                    <Button onClick={() => downloadText("combined.md", scrapeResults.map(r => r.markdown).join("\n\n---\n\n"))} variant="outline">Download combined.md</Button>
                  </div>
                )}
              </div>

              {scrapeError && (
                <p className="text-sm text-red-500">{scrapeError}</p>
              )}

              {scrapeResults.length > 0 && (
                <div className="mt-4 space-y-3">
                  <div className="text-sm text-foreground/70">
                    {scrapeResults.filter((r) => r.markdown).length} succeeded, {scrapeResults.filter((r) => r.error).length} failed
                  </div>
                  {scrapeResults.map((result) => (
                    <div key={result.url} className="rounded-lg border border-foreground/15">
                      <div 
                        className="flex justify-between items-center p-4 cursor-pointer"
                        onClick={() => result.markdown && handleToggleOne(result.url)}
                      >
                        <div className="flex items-center gap-2">
                          {result.markdown && (
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              {openStates[result.url] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </Button>
                          )}
                          <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate">
                            {result.url}
                          </a>
                        </div>
                        {result.markdown && (
                          <Button onClick={(e) => { e.stopPropagation(); if (result.markdown) handleDownloadSingle(result.markdown, result.url); }} variant="outline" size="sm">Download .md</Button>
                        )}
                      </div>
                      {result.markdown && openStates[result.url] && (
                        <div className="border-t border-foreground/15 px-4 py-4">
                          <pre className="whitespace-pre-wrap text-sm">{result.markdown}</pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="mt-10 text-xs text-foreground/60">
          Note: Set FIRECRAWL_API_KEY in your .env.local and restart the dev server.
        </div>
      </div>
    </div>
  );
}
