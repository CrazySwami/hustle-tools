import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// Default branding settings
const defaultBranding = {
  company_name: 'Mirror Factory',
  footer_text: 'This website is developed by Mirror Factory, made with love ❤️.',
  logo_light_url: '/MF-Workstation-Logo.png',
  logo_dark_url: '/MF-Workstation-Logo-Light.png',
  primary_color: 'oklch(0.87 0.13 166)',
  background_light: 'oklch(1 0 0)',
  background_dark: '#1a1a1a',
  foreground_light: 'oklch(0.145 0 0)',
  foreground_dark: 'oklch(0.985 0 0)',
  card_light: 'oklch(1 0 0)',
  card_dark: '#2a2a2a',
  muted_light: 'oklch(0.97 0 0)',
  muted_dark: '#333333',
  border_light: 'oklch(0.922 0 0)',
  border_dark: 'oklch(1 0 0 / 8%)',
  is_active: true,
};

// GET - Fetch active branding settings
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    // Fetch active branding settings
    const { data, error } = await supabase
      .from('branding_settings')
      .select('*')
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('Supabase error fetching branding:', error);
      // Return default branding if there's an error
      return NextResponse.json(defaultBranding);
    }

    // If no branding exists, create default branding
    if (!data) {
      const { data: newBranding, error: insertError } = await supabase
        .from('branding_settings')
        .insert([defaultBranding])
        .select()
        .single();

      if (insertError) {
        console.error('Error creating default branding:', insertError);
        // Return default branding even if insert fails
        return NextResponse.json(defaultBranding);
      }

      return NextResponse.json(newBranding);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching branding:', error);
    // Fallback to default branding on any error
    return NextResponse.json(defaultBranding);
  }
}

// POST - Update branding settings
export async function POST(request: NextRequest) {
  try {
    const updates = await request.json();
    const supabase = await createSupabaseServerClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    // First, check if branding settings exist
    const { data: existing, error: fetchError } = await supabase
      .from('branding_settings')
      .select('id')
      .eq('is_active', true)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching existing branding:', fetchError);
    }

    let result;

    if (existing) {
      // Update existing branding
      const { data, error } = await supabase
        .from('branding_settings')
        .update(updates)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating branding:', error);
        return NextResponse.json({ error: 'Failed to update branding' }, { status: 500 });
      }

      result = data;
    } else {
      // Create new branding record
      const { data, error } = await supabase
        .from('branding_settings')
        .insert([{ ...defaultBranding, ...updates, user_id: user?.id }])
        .select()
        .single();

      if (error) {
        console.error('Error creating branding:', error);
        return NextResponse.json({ error: 'Failed to create branding' }, { status: 500 });
      }

      result = data;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating branding:', error);
    return NextResponse.json({ error: 'Failed to update branding' }, { status: 500 });
  }
}
