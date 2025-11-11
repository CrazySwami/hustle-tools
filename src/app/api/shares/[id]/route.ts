import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * DELETE /api/shares/[id]
 * Remove a share (unshare a resource)
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

    // Delete share (RLS will ensure only owner can delete)
    const { error } = await supabase
      .from('shares')
      .delete()
      .eq('id', id)
      .eq('owner_id', user.id); // Extra safety check

    if (error) {
      console.error('Error deleting share:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Share DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/shares/[id]
 * Update share permission
 *
 * Body:
 * - permission: 'view' | 'edit' (required)
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
    const { permission } = body;

    if (!permission || !['view', 'edit'].includes(permission)) {
      return NextResponse.json(
        { error: 'Invalid permission. Must be "view" or "edit"' },
        { status: 400 }
      );
    }

    // Update share permission (RLS will ensure only owner can update)
    const { data, error } = await supabase
      .from('shares')
      .update({ permission })
      .eq('id', id)
      .eq('owner_id', user.id) // Extra safety check
      .select()
      .single();

    if (error) {
      console.error('Error updating share:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Share PATCH error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
