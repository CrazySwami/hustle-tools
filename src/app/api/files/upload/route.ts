import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * POST /api/files/upload
 * Upload a file to Supabase Storage and create a database record
 *
 * Body (FormData):
 * - file: File (required)
 * - document_id: string (optional) - associate with a document
 * - folder_id: string (optional) - associate with a folder
 * - is_active: boolean (optional) - mark as active in AI context
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const documentId = formData.get('document_id') as string | null;
    const folderId = formData.get('folder_id') as string | null;
    const isActive = formData.get('is_active') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 50MB limit' },
        { status: 400 }
      );
    }

    // Create unique storage path: user_id/timestamp_filename
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${user.id}/${timestamp}_${sanitizedFileName}`;

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents-files')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading file to storage:', uploadError);
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      );
    }

    // Create database record
    const { data: fileRecord, error: dbError } = await supabase
      .from('uploaded_files')
      .insert({
        owner_id: user.id,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        storage_path: storagePath,
        is_active: isActive || false,
        document_id: documentId || null,
        folder_id: folderId || null,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error creating file record:', dbError);

      // Clean up uploaded file if database insert fails
      await supabase.storage.from('documents-files').remove([storagePath]);

      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // Get public URL (signed URL for private buckets)
    const { data: urlData } = supabase.storage
      .from('documents-files')
      .getPublicUrl(storagePath);

    return NextResponse.json(
      {
        ...fileRecord,
        public_url: urlData.publicUrl,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
