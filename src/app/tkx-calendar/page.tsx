'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Loader2, ExternalLink, Download, ArrowLeft, Link as LinkIcon, ArrowUpDown } from 'lucide-react';
import { EventEditor } from '@/components/ui/event-editor';
import { cn } from '@/lib/utils';

interface TKXEvent {
  id: string;
  title: string;
  date: string;
  eventUrl: string;
  month?: string;
}

interface TkxResult {
  url: string;
  imageUrl: string | null;
  processedImageUrl?: string;
  month: string | null;
  day: string | null;
  week: string | null;
  venue: string | null;
  time: string | null;
  title: string | null;
  promoter: string | null;
  specialGuests: string[];
  error?: string;
}

const urlToFile = async (url: string, filename: string): Promise<File> => {
  const response = await fetch(`/api/image-proxy?url=${encodeURIComponent(url)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch image via proxy: ${response.statusText}`);
  }
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type });
};

const createBlurredBackground = async (
  file: File,
  targetWidth: number,
  targetHeight: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Could not get canvas context'));

        // Draw blurred background
        ctx.filter = 'blur(40px)';
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        ctx.filter = 'none';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        // Draw centered image
        const ratio = Math.min(targetWidth / img.width, targetHeight / img.height);
        const newWidth = img.width * ratio;
        const newHeight = img.height * ratio;
        const x = (targetWidth - newWidth) / 2;
        const y = (targetHeight - newHeight) / 2;
        ctx.drawImage(img, x, y, newWidth, newHeight);

        resolve(canvas.toDataURL(file.type));
      };
      img.onerror = reject;
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function TKXCalendarPage() {
  // Step 1: Selection view
  const [events, setEvents] = useState<TKXEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [sortByDate, setSortByDate] = useState<'asc' | 'desc' | null>(null);

  // Step 2: Results view (like TKX scraper in image-alterations)
  const [viewMode, setViewMode] = useState<'selection' | 'results'>('selection');
  const [tkxResults, setTkxResults] = useState<TkxResult[]>([]);
  const [scrapingResults, setScrapingResults] = useState(false);
  const [completedEvents, setCompletedEvents] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);

        // Scrape the TKX events page (better structure than calendar)
        const response = await fetch('/api/extract-page', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: 'https://tkx.live/events/',
            includeImages: false,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch TKX calendar data');
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to extract calendar data');
        }

        // Parse the HTML to extract event data from the cleaner events page structure
        const parser = new DOMParser();
        const doc = parser.parseFromString(data.files.html, 'text/html');

        const extractedEvents: TKXEvent[] = [];

        // The events page has a much cleaner structure with .event tiles
        const eventTiles = doc.querySelectorAll('.event');

        eventTiles.forEach((eventEl, index) => {
          // Get the event link
          const link = eventEl.querySelector('a.event-tile-link, a.event-list-item');
          if (!link) return;

          const href = link.getAttribute('href');
          if (!href) return;

          const fullUrl = href.startsWith('http') ? href : `https://tkx.live${href}`;

          // Extract date parts (month, day, week)
          const dateEl = eventEl.querySelector('.date');
          const month = dateEl?.querySelector('.month')?.textContent?.trim() || '';
          const day = dateEl?.querySelector('.day')?.textContent?.trim() || '';
          const week = dateEl?.querySelector('.week')?.textContent?.trim() || '';

          // Extract artist/title
          const artist = eventEl.querySelector('.artist')?.textContent?.trim() || `Event ${index + 1}`;

          // Extract venue and time from categories
          const categories = eventEl.querySelector('.categories')?.textContent?.trim() || '';

          // Build full date string
          const dateStr = month && day ? `${month} ${day}, 2025` : '';

          // Avoid duplicates
          if (!extractedEvents.some(e => e.eventUrl === fullUrl)) {
            extractedEvents.push({
              id: `event-${index}`,
              title: `${artist}${categories ? ' - ' + categories : ''}`,
              date: dateStr,
              eventUrl: fullUrl,
              month: month || 'Unknown',
            });
          }
        });

        if (extractedEvents.length === 0) {
          throw new Error('No events found on TKX calendar page');
        }

        setEvents(extractedEvents);
      } catch (err) {
        console.error('Error fetching TKX calendar:', err);
        setError(err instanceof Error ? err.message : 'Failed to load calendar data');

        // Set fallback
        setEvents([
          {
            id: '1',
            title: 'Unable to load events',
            date: '',
            eventUrl: 'https://tkx.live/calendar/',
            month: 'Unknown',
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const toggleEventSelection = (eventId: string) => {
    setSelectedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    const visibleEventIds = filteredEvents.map(e => e.id);
    setSelectedEvents(new Set(visibleEventIds));
  };

  const deselectAll = () => {
    setSelectedEvents(new Set());
  };

  const scrapeSelectedEvents = async () => {
    if (selectedEvents.size === 0) return;

    // Get current and newly selected event URLs
    const selectedEventsList = events.filter(e => selectedEvents.has(e.id));
    const selectedUrls = new Set(selectedEventsList.map(e => e.eventUrl));

    // Find which URLs are already scraped
    const existingUrls = new Set(tkxResults.map(r => r.url));

    // Find new URLs that need to be scraped
    const newUrls = selectedEventsList
      .filter(e => !existingUrls.has(e.eventUrl))
      .map(e => e.eventUrl);

    // Remove results for deselected events
    const filteredResults = tkxResults.filter(r => selectedUrls.has(r.url));

    // If nothing new to scrape and nothing to remove, just switch view
    if (newUrls.length === 0 && filteredResults.length === tkxResults.length) {
      setViewMode('results');
      return;
    }

    // Update results to remove deselected ones
    setTkxResults(filteredResults);

    // If there are new URLs to scrape, scrape them
    if (newUrls.length > 0) {
      setScrapingResults(true);

      try {
        const res = await fetch('/api/scrape-tkx', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urlsText: newUrls.join('\n') })
        });
        const data = await res.json();
        if (!res.ok || !data?.success) throw new Error(data?.error || 'Failed to scrape');

        const newResults: TkxResult[] = data.results || [];

        // Add new results to existing ones
        setTkxResults(prev => [...prev, ...newResults]);

        // Automatically process new scraped images
        newResults.forEach(async (result) => {
          if (result.imageUrl) {
            try {
              const filename = result.title?.replace(/[^a-zA-Z0-9\s]/g, '_') || 'image';
              const imageFile = await urlToFile(result.imageUrl, `${filename}.jpg`);
              const processedUrl = await createBlurredBackground(imageFile, 1920, 1080);

              setTkxResults(prev =>
                prev.map(r => r.url === result.url ? { ...r, processedImageUrl: processedUrl } : r)
              );
            } catch (e) {
              console.error(`Failed to process image for ${result.title}:`, e);
            }
          }
        });

      } catch (e) {
        console.error(e);
        setError('Failed to scrape new events');
      } finally {
        setScrapingResults(false);
      }
    }

    // Switch to results view
    setViewMode('results');
  };

  const downloadImageAs = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const extension = blob.type.split('/')[1] || 'jpg';
      link.download = `${filename.replace(/[^a-zA-Z0-9\s]/g, '') || 'image'}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Failed to download image:', error);
      window.open(url, '_blank');
    }
  };

  const downloadAllScrapedImages = async () => {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    const promises = tkxResults
      .filter(r => r.processedImageUrl && r.title)
      .map(async (result) => {
        try {
          const response = await fetch(result.processedImageUrl!);
          const blob = await response.blob();
          const extension = blob.type.split('/')[1] || 'jpg';
          const filename = `${result.title!.replace(/[^a-zA-Z0-9\s]/g, '')}.${extension}`;
          zip.file(filename, blob);
        } catch (e) {
          console.error(`Failed to fetch image for ${result.title}:`, e);
        }
      });

    await Promise.all(promises);

    zip.generateAsync({ type: 'blob' }).then(content => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = 'tkx-event-images.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  const toggleCompleted = (url: string) => {
    setCompletedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(url)) {
        newSet.delete(url);
      } else {
        newSet.add(url);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Date TBA';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  // Get unique months for filter
  const months = ['all', ...Array.from(new Set(events.map(e => e.month).filter(Boolean)))];

  // Filter events by selected month
  let filteredEvents = selectedMonth === 'all'
    ? events
    : events.filter(e => e.month === selectedMonth);

  // Sort by date if enabled
  if (sortByDate) {
    filteredEvents = [...filteredEvents].sort((a, b) => {
      const dateA = new Date(a.date || '').getTime();
      const dateB = new Date(b.date || '').getTime();

      // Handle invalid dates (put them at the end)
      if (isNaN(dateA)) return 1;
      if (isNaN(dateB)) return -1;

      return sortByDate === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }

  const toggleDateSort = () => {
    if (sortByDate === null) {
      setSortByDate('asc');
    } else if (sortByDate === 'asc') {
      setSortByDate('desc');
    } else {
      setSortByDate(null);
    }
  };

  // RESULTS VIEW (like TKX scraper in image-alterations)
  if (viewMode === 'results') {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card">
          <div className="container mx-auto px-4 py-6 pt-24">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('selection')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Selection
              </Button>
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">TKX Event Results</h1>
              <p className="text-muted-foreground">
                Scraped {tkxResults.length} event{tkxResults.length !== 1 ? 's' : ''} with images and details
              </p>
            </div>
            {tkxResults.length > 0 && (
              <div className="mt-4">
                <Button variant="outline" onClick={downloadAllScrapedImages}>
                  <Download className="h-4 w-4 mr-2" />
                  Download All Images
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {scrapingResults ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-muted-foreground">Processing events...</span>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
              {tkxResults.map((r) => {
                const isCompleted = completedEvents.has(r.url);
                return (
                  <div
                    key={r.url}
                    className={`rounded-xl overflow-hidden border border-foreground/10 bg-card flex flex-col transition-opacity ${isCompleted ? 'opacity-40' : 'opacity-100'}`}
                  >
                    <div className="relative group">
                      <a href={r.url} target="_blank" rel="noreferrer">
                        {r.processedImageUrl ? (
                          <img src={r.processedImageUrl} alt={r.title || 'event image'} className="w-full h-48 object-cover" />
                        ) : r.imageUrl ? (
                          <div className="w-full h-48 flex items-center justify-center bg-foreground/5 text-xs">Processing...</div>
                        ) : (
                          <div className="w-full h-48 flex items-center justify-center bg-foreground/5 text-xs">No image</div>
                        )}
                      </a>
                      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Checkbox
                          checked={isCompleted}
                          onCheckedChange={() => toggleCompleted(r.url)}
                          className="bg-black/50 border-white"
                        />
                      </div>
                      <div
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        onClick={() => downloadImageAs(r.processedImageUrl || r.imageUrl!, r.title || 'event')}
                      >
                        <Download className="h-6 w-6 text-white bg-black/50 rounded-full p-1" />
                      </div>
                    </div>
                    <div className="p-4 flex-grow flex flex-col">
                      <EventEditor result={r} />
                      <div className="pt-4">
                        <Button
                          className="w-full"
                          variant="outline"
                          onClick={() => navigator.clipboard.writeText(r.url)}
                        >
                          <LinkIcon className="h-4 w-4 mr-2" />
                          Copy Link
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // SELECTION VIEW
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6 pt-24">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">TKX Event Calendar</h1>
              <p className="text-muted-foreground">
                Select events to scrape and view full details
              </p>
              {error && (
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                  {error} - Visit{' '}
                  <a href="https://tkx.live/calendar/" target="_blank" rel="noopener noreferrer" className="underline">
                    tkx.live
                  </a>
                </p>
              )}
            </div>

            {!loading && events.length > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3">
                  <Button size="sm" variant="outline" onClick={selectAll}>
                    Select All
                  </Button>
                  <Button size="sm" variant="outline" onClick={deselectAll}>
                    Deselect All
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {selectedEvents.size} of {filteredEvents.length} selected
                  </span>
                </div>

                {selectedEvents.size > 0 && (
                  <Button
                    size="sm"
                    onClick={scrapeSelectedEvents}
                    disabled={scrapingResults}
                  >
                    {scrapingResults ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Scraping {selectedEvents.size} event{selectedEvents.size !== 1 ? 's' : ''}...
                      </>
                    ) : (
                      <>
                        Scrape Selected ({selectedEvents.size})
                      </>
                    )}
                  </Button>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <Button
                    size="sm"
                    variant={sortByDate ? 'default' : 'outline'}
                    onClick={toggleDateSort}
                    className="gap-2"
                  >
                    <ArrowUpDown className="h-4 w-4" />
                    {sortByDate === 'asc' ? 'Date ↑' : sortByDate === 'desc' ? 'Date ↓' : 'Sort by Date'}
                  </Button>

                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by month" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Months</SelectItem>
                      {months.slice(1).map(month => (
                        <SelectItem key={month} value={month || 'unknown'}>
                          {month || 'Unknown'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">Loading events from TKX...</span>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg mb-4">
              No events found for {selectedMonth}
            </p>
            <Button asChild>
              <a href="https://tkx.live/calendar/" target="_blank" rel="noopener noreferrer">
                View Full Calendar on TKX.live
              </a>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvents.map(event => {
              const isSelected = selectedEvents.has(event.id);

              return (
                <div
                  key={event.id}
                  onClick={() => toggleEventSelection(event.id)}
                  className={cn(
                    "border rounded-lg bg-card overflow-hidden transition-all cursor-pointer group",
                    "hover:shadow-md",
                    isSelected
                      ? "border-blue-400 ring-2 ring-blue-400 bg-blue-50 dark:bg-blue-950/30"
                      : "border-border hover:border-blue-300"
                  )}
                >
                  <div className="p-4 flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleEventSelection(event.id)}
                        onClick={(e) => e.stopPropagation()}
                        className={cn(
                          "mt-0.5",
                          isSelected && "border-blue-500 data-[state=checked]:bg-blue-500"
                        )}
                      />

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold line-clamp-2 leading-tight">
                          {event.title}
                        </h3>
                        {event.date && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-2">
                            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate">{formatDate(event.date)}</span>
                          </p>
                        )}
                        {event.month && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {event.month}
                          </p>
                        )}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full justify-start"
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <a href={event.eventUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4" />
                        <span className="text-xs">View Event</span>
                      </a>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
