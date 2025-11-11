import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';

/**
 * GET /api/folders
 * Fetch all folders for the authenticated user
 *
 * Query params:
 * - parent_id: Filter by parent folder (optional, null = root level)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createSupabaseServiceRoleClient();

    // Auth disabled - use placeholder user ID
    const userId = '00000000-0000-0000-0000-000000000000';

    const { searchParams } = new URL(req.url);
    const parentId = searchParams.get('parent_id');

    // Build query
    let query = supabase
      .from('folders')
      .select('*')
      .eq('owner_id', userId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    // Filter by parent folder
    if (parentId === 'null' || parentId === '') {
      query = query.is('parent_folder_id', null);
    } else if (parentId) {
      query = query.eq('parent_folder_id', parentId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching folders:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Folders GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/folders
 * Create a new folder
 *
 * Body:
 * - name: string (required)
 * - parent_folder_id: string (optional)
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseServiceRoleClient();

    // Auth disabled - use placeholder user ID
    const userId = '00000000-0000-0000-0000-000000000000';

    const body = await req.json();
    const { name, parent_folder_id } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Create folder
    const { data, error } = await supabase
      .from('folders')
      .insert({
        owner_id: userId,
        name,
        parent_folder_id: parent_folder_id || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating folder:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Folders POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
