import { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CheckoutForm } from '@/components/features/ticketing/checkout-form';

export const metadata: Metadata = {
  title: 'Checkout | FSTIVO',
};

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tier?: string; quantity?: string }>;
}) {
  const supabase = createClient();
  const { id } = await params;
  const { tier, quantity } = await searchParams;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/events/${id}/tickets/checkout`);
  }

  if (!tier || !quantity) {
    redirect(`/events/${id}/tickets`);
  }

  const { data: event } = await supabase
    .from('events')
    .select('*, tier:ticket_tiers!inner(*)')
    .eq('id', id)
    .eq('tier.id', tier)
    .single();

  if (!event) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-3xl font-bold">Complete Your Purchase</h1>
        <CheckoutForm
          event={event}
          tier={event.tier}
          quantity={parseInt(quantity)}
        />
      </div>
    </div>
  );
}
