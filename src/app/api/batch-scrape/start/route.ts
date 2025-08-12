import { NextRequest, NextResponse } from "next/server";

const FIRECRAWL_BATCH_SCRAPE_URL = "https://api.firecrawl.dev/v1/batch/scrape";

type BatchScrapeRequest = {
  urls: string[] | string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<BatchScrapeRequest>;

    let urls: string[] = [];
    if (Array.isArray(body?.urls)) {
      urls = body.urls;
    } else if (typeof body?.urls === "string") {
      urls = body.urls.split(/\r?\n/).map((u) => u.trim()).filter(Boolean);
    }

    if (!urls.length) {
      return NextResponse.json({ success: false, error: "No URLs provided" }, { status: 400 });
    }

    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "FIRECRAWL_API_KEY is not set on the server" },
        { status: 500 }
      );
    }

    const fcRes = await fetch(FIRECRAWL_BATCH_SCRAPE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ urls, formats: ["markdown"] }),
    });

    const data = await fcRes.json().catch(() => null);

    if (!fcRes.ok || !data?.success) {
      return NextResponse.json(
        { success: false, error: data?.error || "Failed to start batch scrape job" },
        { status: fcRes.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
