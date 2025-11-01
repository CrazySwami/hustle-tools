import { NextRequest, NextResponse } from 'next/server';
import { apiMonitor } from '@/lib/api-monitor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'logs';

    if (action === 'logs') {
      const endpoint = searchParams.get('endpoint') || undefined;
      const provider = searchParams.get('provider') || undefined;
      const model = searchParams.get('model') || undefined;
      const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
      const startDate = searchParams.get('startDate') ? parseInt(searchParams.get('startDate')!) : undefined;
      const endDate = searchParams.get('endDate') ? parseInt(searchParams.get('endDate')!) : undefined;

      const logs = apiMonitor.getLogs({
        endpoint,
        provider,
        model,
        limit,
        startDate,
        endDate,
      });

      return NextResponse.json({ success: true, logs });
    }

    if (action === 'stats') {
      const startDate = searchParams.get('startDate') ? parseInt(searchParams.get('startDate')!) : undefined;
      const endDate = searchParams.get('endDate') ? parseInt(searchParams.get('endDate')!) : undefined;

      const timeRange = startDate && endDate ? { start: startDate, end: endDate } : undefined;
      const stats = apiMonitor.getStats(timeRange);

      return NextResponse.json({ success: true, stats });
    }

    if (action === 'export') {
      const exportData = apiMonitor.exportLogs();
      return new NextResponse(exportData, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="api-logs-${Date.now()}.json"`,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Monitor API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    apiMonitor.clear();
    return NextResponse.json({ success: true, message: 'Logs cleared' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
