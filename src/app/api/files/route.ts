import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * GET /api/files
 * Fetch all files for the authenticated user
 *
 * Query params:
 * - document_id: Filter by document (optional)
 * - folder_id: Filter by folder (optional)
 * - is_active: Filter by active status (optional, 'true'|'false')
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get('document_id');
    const folderId = searchParams.get('folder_id');
    const isActive = searchParams.get('is_active');

    // Build query
    let query = supabase
      .from('uploaded_files')
      .select('*')
      .eq('owner_id', user.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    // Apply filters
    if (documentId) {
      query = query.eq('document_id', documentId);
    }
    if (folderId) {
      query = query.eq('folder_id', folderId);
    }
    if (isActive === 'true') {
      query = query.eq('is_active', true);
    } else if (isActive === 'false') {
      query = query.eq('is_active', false);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching files:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Add public URLs to files
    const filesWithUrls = (data || []).map(file => {
      const { data: urlData } = supabase.storage
        .from('documents-files')
        .getPublicUrl(file.storage_path);

      return {
        ...file,
        public_url: urlData.publicUrl,
      };
    });

    return NextResponse.json(filesWithUrls);
  } catch (error: any) {
    console.error('Files GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
