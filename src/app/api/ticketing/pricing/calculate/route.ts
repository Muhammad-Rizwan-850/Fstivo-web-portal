import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger';

// POST: Calculate dynamic price
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { ticket_type_id, quantity = 1 } = await request.json()

    if (!ticket_type_id) {
      return NextResponse.json({ error: 'ticket_type_id is required' }, { status: 400 })
    }

    // Call database function
    const { data, error } = await (supabase as any).rpc('calculate_dynamic_price', {
      p_ticket_type_id: ticket_type_id,
      p_quantity: quantity
    })

    if (error) throw error

    // Get base price for comparison
    const { data: ticketType } = await supabase
      .from('ticket_types')
      .select('price, name')
      .eq('id', ticket_type_id)
      .single()

    const basePrice = Number(ticketType?.price || 0)
    const finalPrice = Number(data || basePrice)
    const savings = basePrice - finalPrice
    const savingsPercent = basePrice > 0 ? (savings / basePrice) * 100 : 0

    return NextResponse.json({
      basePrice,
      finalPrice,
      totalPrice: finalPrice * quantity,
      savings: savings * quantity,
      savingsPercent: Number(savingsPercent.toFixed(1)),
      appliedRules: [] // TODO: Return which rules were applied
    })
  } catch (error: any) {
    logger.error('Error calculating price:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
