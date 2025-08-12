import { NextRequest, NextResponse } from "next/server";

const FIRECRAWL_BATCH_STATUS_URL = "https://api.firecrawl.dev/v1/batch/scrape/";

export async function GET(
  req: NextRequest,
  context: { params: { jobId: string } }
) {
  try {
    const { jobId } = context.params;
    if (!jobId) {
      return NextResponse.json(
        { success: false, error: "Missing jobId in request" },
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

    const fcRes = await fetch(`${FIRECRAWL_BATCH_STATUS_URL}${jobId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    const data = await fcRes.json().catch(() => null);

    if (!fcRes.ok) {
      return NextResponse.json(
        { success: false, error: data?.error || "Failed to get batch scrape status" },
        { status: fcRes.status }
      );
    }

    return NextResponse.json(data);

  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
