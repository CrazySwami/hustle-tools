import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * GET /api/files/[id]
 * Fetch a single file by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch file (RLS will handle permissions)
    const { data, error } = await supabase
      .from('uploaded_files')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching file:', error);
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    // Add public URL
    const { data: urlData } = supabase.storage
      .from('documents-files')
      .getPublicUrl(data.storage_path);

    return NextResponse.json({
      ...data,
      public_url: urlData.publicUrl,
    });
  } catch (error: any) {
    console.error('File GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/files/[id]
 * Update file metadata
 *
 * Body:
 * - is_active: boolean (optional)
 * - extracted_content: string (optional)
 * - summary: string (optional)
 * - document_id: string (optional)
 * - folder_id: string (optional)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const updates: any = {};

    if (body.is_active !== undefined) updates.is_active = body.is_active;
    if (body.extracted_content !== undefined) updates.extracted_content = body.extracted_content;
    if (body.summary !== undefined) updates.summary = body.summary;
    if (body.document_id !== undefined) updates.document_id = body.document_id;
    if (body.folder_id !== undefined) updates.folder_id = body.folder_id;

    // Update file (RLS will handle permissions)
    const { data, error } = await supabase
      .from('uploaded_files')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating file:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('File PATCH error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/files/[id]
 * Delete a file (removes from storage and soft-deletes database record)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get file record to get storage path
    const { data: file, error: fetchError } = await supabase
      .from('uploaded_files')
      .select('storage_path')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single();

    if (fetchError || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('documents-files')
      .remove([file.storage_path]);

    if (storageError) {
      console.error('Error deleting file from storage:', storageError);
      // Continue with database deletion even if storage deletion fails
    }

    // Soft delete database record
    const { error: dbError } = await supabase
      .from('uploaded_files')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString()
      })
      .eq('id', id);

    if (dbError) {
      console.error('Error soft-deleting file record:', dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('File DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
