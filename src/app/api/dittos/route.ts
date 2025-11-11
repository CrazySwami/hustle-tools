import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * GET /api/dittos
 * Fetch the current user's ditto and dittos of users who shared content
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's own ditto
    const { data: ownDitto, error: ownError } = await supabase
      .from('dittos')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (ownError && ownError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching own ditto:', ownError);
    }

    // Get dittos of users who shared content with this user
    const { data: sharedDittos, error: sharedError } = await supabase
      .from('dittos')
      .select(`
        *,
        shares!inner(
          owner_id,
          shared_with_user_id
        )
      `)
      .eq('shares.shared_with_user_id', user.id);

    if (sharedError) {
      console.error('Error fetching shared dittos:', sharedError);
    }

    // Remove duplicate dittos (users may have shared multiple items)
    const uniqueSharedDittos = sharedDittos
      ? Array.from(
          new Map(sharedDittos.map(d => [d.user_id, d])).values()
        )
      : [];

    return NextResponse.json({
      ownDitto: ownDitto || null,
      sharedDittos: uniqueSharedDittos,
    });
  } catch (error: any) {
    console.error('Dittos GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/dittos
 * Create or update the user's ditto
 *
 * Body:
 * - name: string (required)
 * - description: string (optional)
 * - linkedin_profile: string (optional)
 * - personal_website: string (optional)
 * - company_website: string (optional)
 * - additional_context: string (optional)
 * - social_links: array (optional)
 * - website_links: array (optional)
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
    const {
      name,
      description,
      linkedin_profile,
      personal_website,
      company_website,
      additional_context,
      social_links,
      website_links,
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Upsert ditto (create or update if exists)
    const { data, error } = await supabase
      .from('dittos')
      .upsert({
        user_id: user.id,
        name,
        description,
        linkedin_profile,
        personal_website,
        company_website,
        additional_context,
        social_links: social_links || [],
        website_links: website_links || [],
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting ditto:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Dittos POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
