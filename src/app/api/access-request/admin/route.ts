import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// GET - List all access requests (admin only)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabase
      .from('access_requests')
      .select('*')
      .order('requested_at', { ascending: false });

    // Filter by status if provided
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching access requests:', error);
      return NextResponse.json(
        { error: 'Failed to fetch requests' },
        { status: 500 }
      );
    }

    return NextResponse.json({ requests: data });
  } catch (error) {
    console.error('Error in admin access request API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Approve or reject access request
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { requestId, action, notes } = body;

    if (!requestId || !action) {
      return NextResponse.json(
        { error: 'requestId and action are required' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be either "approve" or "reject"' },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      // Use the approve function
      const { error } = await supabase.rpc('approve_access_request', {
        request_id: requestId,
        approver_id: user.id,
      });

      if (error) {
        console.error('Error approving request:', error);
        return NextResponse.json(
          { error: 'Failed to approve request' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Access request approved successfully',
        action: 'approved',
      });
    } else {
      // Use the reject function
      const { error } = await supabase.rpc('reject_access_request', {
        request_id: requestId,
        rejection_note: notes || null,
      });

      if (error) {
        console.error('Error rejecting request:', error);
        return NextResponse.json(
          { error: 'Failed to reject request' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Access request rejected',
        action: 'rejected',
      });
    }
  } catch (error) {
    console.error('Error in admin patch API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
