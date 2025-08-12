import { NextRequest, NextResponse } from "next/server";

type MapRequest = {
  url: string;
  search?: string;
  ignoreSitemap?: boolean;
  sitemapOnly?: boolean;
  includeSubdomains?: boolean;
  limit?: number;
  timeout?: number;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<MapRequest>;
    const url = body?.url?.trim();

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'Missing "url" in request body' },
        { status: 400 }
      );
    }

    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "FIRECRAWL_API_KEY is not set on the server" },
        { status: 500 }
      );
    }

    const fcRes = await fetch("https://api.firecrawl.dev/v1/map", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        search: body?.search,
        ignoreSitemap: body?.ignoreSitemap,
        sitemapOnly: body?.sitemapOnly,
        includeSubdomains: body?.includeSubdomains,
        limit: body?.limit,
        timeout: body?.timeout,
      }),
    });

    const data = await fcRes.json().catch(() => null);

    if (!fcRes.ok) {
      return NextResponse.json(
        { success: false, error: data?.error || "Firecrawl /map request failed" },
        { status: fcRes.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
