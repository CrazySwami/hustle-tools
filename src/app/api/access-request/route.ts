import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// POST - Submit access request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, company, role, message } = body;

    // Validate email
    if (!email || !email.match(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/)) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    // Check if email already requested
    const { data: existing } = await supabase
      .from('access_requests')
      .select('id, status')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      if (existing.status === 'approved') {
        return NextResponse.json(
          {
            message: 'This email already has access!',
            status: 'approved'
          },
          { status: 200 }
        );
      } else if (existing.status === 'pending') {
        return NextResponse.json(
          {
            message: 'Your request is pending review',
            status: 'pending'
          },
          { status: 200 }
        );
      } else {
        // Status is rejected, allow resubmission
        const { error: updateError } = await supabase
          .from('access_requests')
          .update({
            status: 'pending',
            name,
            company,
            role,
            message,
            requested_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (updateError) {
          console.error('Error updating access request:', updateError);
          return NextResponse.json(
            { error: 'Failed to update request' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          message: 'Your access request has been resubmitted',
          status: 'pending'
        });
      }
    }

    // Create new access request
    const { data, error } = await supabase
      .from('access_requests')
      .insert([
        {
          email,
          name: name || null,
          company: company || null,
          role: role || null,
          message: message || null,
          source: 'landing_page',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating access request:', error);
      return NextResponse.json(
        { error: 'Failed to submit request' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Access request submitted successfully! We\'ll review your request and get back to you soon.',
      status: 'pending',
      data,
    });
  } catch (error) {
    console.error('Error in access request API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Check if email is approved
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter required' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    // Check if email is in approved list
    const { data, error } = await supabase
      .from('approved_emails')
      .select('email, approved_at')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('Error checking approved email:', error);
      return NextResponse.json(
        { error: 'Failed to check access' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      approved: !!data,
      email: data?.email,
      approved_at: data?.approved_at,
    });
  } catch (error) {
    console.error('Error in access check API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
