import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';

/**
 * GET /api/documents
 * Fetch all documents for the authenticated user
 *
 * Query params:
 * - folder_id: Filter by folder (optional)
 * - include_shared: Include documents shared with the user (default: true)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createSupabaseServiceRoleClient();

    // Auth disabled - use placeholder user ID
    const userId = '00000000-0000-0000-0000-000000000000';

    const { searchParams } = new URL(req.url);
    const folderId = searchParams.get('folder_id');
    const includeShared = searchParams.get('include_shared') !== 'false';

    // Build query for user's own documents
    let query = supabase
      .from('documents')
      .select('*')
      .eq('owner_id', userId)
      .eq('is_deleted', false)
      .order('updated_at', { ascending: false });

    // Filter by folder if specified
    if (folderId) {
      query = query.eq('folder_id', folderId);
    }

    const { data: ownDocuments, error: ownError } = await query;

    if (ownError) {
      console.error('Error fetching own documents:', ownError);
      return NextResponse.json({ error: ownError.message }, { status: 500 });
    }

    return NextResponse.json(ownDocuments || []);
  } catch (error: any) {
    console.error('Documents GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/documents
 * Create a new document
 *
 * Body:
 * - title: string (required)
 * - content: string (optional, default: '')
 * - folder_id: string (optional)
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseServiceRoleClient();

    // Auth disabled - use placeholder user ID
    const userId = '00000000-0000-0000-0000-000000000000';

    const body = await req.json();
    const { title = 'Untitled', content = '', folder_id } = body;

    // Create document
    const { data, error } = await supabase
      .from('documents')
      .insert({
        owner_id: userId,
        title,
        content,
        folder_id: folder_id || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating document:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Documents POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
