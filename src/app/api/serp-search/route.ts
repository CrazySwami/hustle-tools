import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SerpSearchRequest {
  keywords?: string[]; // Batch keywords
  keyword?: string; // Single keyword
  location?: string; // e.g., "Austin, Texas, United States"
  gl?: string; // Country code (e.g., "us")
  hl?: string; // Language (e.g., "en")
  device?: 'desktop' | 'tablet' | 'mobile';
  num?: number; // Number of results (default 10, max 100)
}

interface OrganicResult {
  position: number;
  title: string;
  link: string;
  displayed_link: string;
  snippet: string;
  date?: string;
  snippet_highlighted_words?: string[];
  sitelinks?: any;
  rich_snippet?: any;
  cached_page_link?: string;
  related_pages_link?: string;
  source?: string;
  thumbnail?: string;
}

interface SerpResponse {
  search_metadata: {
    id: string;
    status: string;
    created_at: string;
    processed_at: string;
    google_url: string;
    raw_html_file: string;
    total_time_taken: number;
  };
  search_parameters: {
    q: string;
    location?: string;
    gl?: string;
    hl?: string;
    device?: string;
    num?: number;
  };
  search_information: {
    query_displayed: string;
    total_results: number;
    time_taken_displayed: number;
  };
  organic_results: OrganicResult[];
  related_searches?: Array<{
    query: string;
    link: string;
  }>;
  pagination?: {
    current: number;
    next?: string;
    other_pages?: Record<string, string>;
  };
}

async function searchKeyword(
  keyword: string,
  location?: string,
  gl = 'us',
  hl = 'en',
  device = 'desktop',
  num = 10
): Promise<SerpResponse> {
  const apiKey = process.env.SERPAPI_API_KEY;

  if (!apiKey) {
    throw new Error('SERPAPI_API_KEY not configured in environment variables');
  }

  const params = new URLSearchParams({
    api_key: apiKey,
    q: keyword,
    gl,
    hl,
    device,
    num: String(num),
  });

  if (location) {
    params.append('location', location);
  }

  const url = `https://serpapi.com/search?${params.toString()}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`SerpAPI request failed: ${response.statusText}`);
  }

  const data = await response.json();

  return data;
}

export async function POST(request: NextRequest) {
  try {
    const body: SerpSearchRequest = await request.json();

    const {
      keywords,
      keyword,
      location,
      gl = 'us',
      hl = 'en',
      device = 'desktop',
      num = 10,
    } = body;

    // Batch keywords or single keyword
    const keywordsToSearch = keywords || (keyword ? [keyword] : []);

    if (keywordsToSearch.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No keywords provided' },
        { status: 400 }
      );
    }

    // Check for API key
    if (!process.env.SERPAPI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: 'SERPAPI_API_KEY not configured. Please add it to .env.local',
        },
        { status: 500 }
      );
    }

    // Single keyword search
    if (keywordsToSearch.length === 1) {
      const result = await searchKeyword(
        keywordsToSearch[0],
        location,
        gl,
        hl,
        device,
        num
      );

      return NextResponse.json({
        success: true,
        keyword: keywordsToSearch[0],
        location: location || 'Not specified',
        data: result,
        organicResults: result.organic_results || [],
        searchInformation: result.search_information,
        relatedSearches: result.related_searches || [],
        knowledgeGraph: result.knowledge_graph || null,
        answerBox: result.answer_box || null,
        shoppingResults: result.shopping_results || [],
        localResults: result.local_results || null,
        peopleAlsoAsk: result.related_questions || [],
      });
    }

    // Batch keyword search
    const results = await Promise.allSettled(
      keywordsToSearch.map((kw) =>
        searchKeyword(kw, location, gl, hl, device, num)
      )
    );

    const processedResults = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return {
          success: true,
          keyword: keywordsToSearch[index],
          location: location || 'Not specified',
          data: result.value,
          organicResults: result.value.organic_results || [],
          searchInformation: result.value.search_information,
          relatedSearches: result.value.related_searches || [],
          knowledgeGraph: result.value.knowledge_graph || null,
          answerBox: result.value.answer_box || null,
          shoppingResults: result.value.shopping_results || [],
          localResults: result.value.local_results || null,
          peopleAlsoAsk: result.value.related_questions || [],
        };
      } else {
        return {
          success: false,
          keyword: keywordsToSearch[index],
          error: result.reason?.message || 'Unknown error',
        };
      }
    });

    const summary = {
      total: keywordsToSearch.length,
      successful: processedResults.filter((r) => r.success).length,
      failed: processedResults.filter((r) => !r.success).length,
    };

    return NextResponse.json({
      success: true,
      summary,
      results: processedResults,
    });
  } catch (error) {
    console.error('SerpAPI error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
