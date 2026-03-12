import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic'

/**
 * GET /api/network/profile
 * Get current user's networking profile
 */
export async function GET(request: Request) {
  try {
    const supabase = createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || user.id

    // Get profile
    const { data: profile, error } = await supabase
      .from('user_networking_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      // Create profile if it doesn't exist
      if (error.code === 'PGRST116') {
        const { data: newProfile } = await supabase
          .from('user_networking_profiles')
          .insert({
            user_id: user.id,
            display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            bio: '',
            is_profile_complete: false
          })
          .select()
          .single()

        return NextResponse.json({ profile: newProfile })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    logger.error('Error fetching profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/network/profile
 * Create or update networking profile
 */
export async function POST(request: Request) {
  try {
    const supabase = createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      display_name,
      bio,
      avatar_url,
      cover_image_url,
      university,
      major,
      graduation_year,
      interests,
      skills,
      location,
      linkedin_url,
      github_url,
      twitter_url,
      website_url
    } = body

    // Check if profile exists
    const { data: existing } = await supabase
      .from('user_networking_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    // Check if profile is complete
    const isComplete = !!(
      display_name &&
      bio &&
      university &&
      major &&
      interests &&
      interests.length > 0
    )

    const profileData = {
      user_id: user.id,
      display_name: display_name || user.user_metadata?.full_name || user.email?.split('@')[0],
      bio: bio || '',
      avatar_url: avatar_url || null,
      cover_image_url: cover_image_url || null,
      university: university || null,
      major: major || null,
      graduation_year: graduation_year || null,
      interests: interests || [],
      skills: skills || [],
      location: location || null,
      linkedin_url: linkedin_url || null,
      github_url: github_url || null,
      twitter_url: twitter_url || null,
      website_url: website_url || null,
      is_profile_complete: isComplete
    }

    let result
    if (existing) {
      // Update existing profile
      const { data: updated, error } = await supabase
        .from('user_networking_profiles')
        .update(profileData)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      result = updated
    } else {
      // Create new profile
      const { data: created, error } = await supabase
        .from('user_networking_profiles')
        .insert(profileData)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      result = created
    }

    return NextResponse.json({ profile: result }, { status: existing ? 200 : 201 })
  } catch (error) {
    logger.error('Error saving profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
