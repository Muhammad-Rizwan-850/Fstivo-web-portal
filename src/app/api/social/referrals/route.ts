import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger';

// Helper function to generate unique referral code
function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = 'REF-'
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// GET: Get user's referrals
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('referrals')
      .select(`
        *,
        event:events(id, name, event_date),
        referred_user:auth.users!referrals_referred_user_id_fkey(
          id,
          email,
          raw_user_meta_data
        )
      `)
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Calculate total rewards
    const totalRewards = (data || []).reduce((sum, ref: any) => {
      return sum + (ref.status === 'rewarded' ? Number(ref.reward_value) || 0 : 0)
    }, 0)

    return NextResponse.json({
      referrals: data,
      stats: {
        total: data?.length || 0,
        pending: data?.filter((r: any) => r.status === 'pending').length || 0,
        completed: data?.filter((r: any) => r.status === 'rewarded').length || 0,
        totalRewards
      }
    })
  } catch (error: any) {
    logger.error('Error fetching referrals:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: Create referral
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email, event_id } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 })
    }

    // Generate unique referral code
    const referralCode = generateReferralCode()

    const { data, error } = await supabase
      .from('referrals')
      .insert({
        referrer_id: user.id,
        email,
        event_id,
        referralCode,
        reward_type: 'discount',
        reward_value: 100 // PKR 100 discount
      })
      .select()
      .single()

    if (error) throw error

    // Generate referral link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const referralLink = event_id
      ? `${baseUrl}/events/${event_id}?ref=${referralCode}`
      : `${baseUrl}/?ref=${referralCode}`

    return NextResponse.json({
      referral: data,
      referralLink
    })
  } catch (error: any) {
    logger.error('Error creating referral:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
