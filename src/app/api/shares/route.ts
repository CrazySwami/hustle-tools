import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * GET /api/shares
 * Fetch shares created by the user or received by the user
 *
 * Query params:
 * - type: 'created' | 'received' (default: 'created')
 * - resource_type: 'document' | 'folder' (optional filter)
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
    const type = searchParams.get('type') || 'created';
    const resourceType = searchParams.get('resource_type');

    // Build query based on type
    let query = supabase.from('shares').select('*');

    if (type === 'created') {
      query = query.eq('owner_id', user.id);
    } else {
      query = query.eq('shared_with_user_id', user.id);
    }

    // Filter by resource type if specified
    if (resourceType) {
      query = query.eq('resource_type', resourceType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching shares:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Shares GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/shares
 * Create a new share (share a document or folder with another user)
 *
 * Body:
 * - resource_type: 'document' | 'folder' (required)
 * - resource_id: string (required)
 * - shared_with_email: string (required) - email of user to share with
 * - permission: 'view' | 'edit' (required)
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { resource_type, resource_id, shared_with_email, permission } = body;

    // Validate required fields
    if (!resource_type || !resource_id || !shared_with_email || !permission) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate resource type and permission
    if (!['document', 'folder'].includes(resource_type)) {
      return NextResponse.json(
        { error: 'Invalid resource_type. Must be "document" or "folder"' },
        { status: 400 }
      );
    }

    if (!['view', 'edit'].includes(permission)) {
      return NextResponse.json(
        { error: 'Invalid permission. Must be "view" or "edit"' },
        { status: 400 }
      );
    }

    // Look up the user by email
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', shared_with_email)
      .single();

    if (userError || !users) {
      return NextResponse.json(
        { error: 'User not found with that email' },
        { status: 404 }
      );
    }

    const sharedWithUserId = users.id;

    // Don't allow sharing with yourself
    if (sharedWithUserId === user.id) {
      return NextResponse.json(
        { error: 'Cannot share with yourself' },
        { status: 400 }
      );
    }

    // Verify the user owns the resource before sharing
    let ownsResource = false;

    if (resource_type === 'document') {
      const { data: doc } = await supabase
        .from('documents')
        .select('owner_id')
        .eq('id', resource_id)
        .single();

      ownsResource = doc && doc.owner_id === user.id;
    } else if (resource_type === 'folder') {
      const { data: folder } = await supabase
        .from('folders')
        .select('owner_id')
        .eq('id', resource_id)
        .single();

      ownsResource = folder && folder.owner_id === user.id;
    }

    if (!ownsResource) {
      return NextResponse.json(
        { error: 'You do not own this resource or it does not exist' },
        { status: 403 }
      );
    }

    // Create the share
    const { data, error } = await supabase
      .from('shares')
      .insert({
        owner_id: user.id,
        shared_with_user_id: sharedWithUserId,
        resource_type,
        resource_id,
        permission,
      })
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation (already shared)
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'This resource is already shared with this user' },
          { status: 409 }
        );
      }

      console.error('Error creating share:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Shares POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
