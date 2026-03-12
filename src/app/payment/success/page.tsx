import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CheckCircle, Home, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Payment Successful | FSTIVO',
};

type Ticket = {
  id: string;
  ticket_number?: string | null;
  status?: string | null;
  qr_code?: string | null;
};

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; provider?: string }>;
}) {
  const { order: orderId, provider } = await searchParams;

  if (!orderId) {
    notFound();
  }

  const supabase = createClient();

  // Get order details
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      *,
      event:events(id, title, description, date, venue),
      tier:ticket_tiers(name, price)
    `)
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    notFound();
  }

  // Get user to verify ownership
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || order.user_id !== user.id) {
    redirect('/login');
  }

  // Get tickets for this order
  const { data: tickets } = await supabase
    .from('tickets')
    .select('id, ticket_number, status, qr_code')
    .eq('order_id', orderId);

  const formattedDate = order.event?.date
    ? new Date(order.event.date).toLocaleDateString('en-PK', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Date TBA';

  const providerName = {
    jazzcash: 'JazzCash',
    easypaisa: 'EasyPaisa',
    stripe: 'Stripe',
  }[provider || ''] || 'Payment Gateway';

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="container mx-auto px-4 py-12">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 rounded-full p-4">
              <CheckCircle className="w-16 h-16 text-green-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-lg text-gray-600">
            Your tickets have been confirmed. Check your email for confirmation details.
          </p>
        </div>

        <div className="grid gap-6 max-w-2xl mx-auto mb-8">
          {/* Order Details Card */}
          <Card className="p-6 border-2 border-green-100">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Order Details
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-mono font-semibold">{orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-semibold">{providerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date Paid:</span>
                <span className="font-semibold">
                  {new Date(order.paid_at || order.created_at).toLocaleDateString('en-PK')}
                </span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="text-gray-600">Total Amount:</span>
                <span className="text-lg font-bold text-green-600">
                  PKR {order.total_amount.toLocaleString('en-PK')}
                </span>
              </div>
            </div>
          </Card>

          {/* Event Details Card */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Event Details</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Event</p>
                <p className="text-lg font-semibold text-gray-900">{order.event?.title}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Ticket Type</p>
                <p className="text-lg font-semibold text-gray-900">{order.tier?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Number of Tickets</p>
                <p className="text-lg font-semibold text-gray-900">{order.quantity}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Event Date & Time</p>
                <p className="text-lg font-semibold text-gray-900">{formattedDate}</p>
              </div>
              {order.event?.venue && (
                <div>
                  <p className="text-sm text-gray-600">Venue</p>
                  <p className="text-lg font-semibold text-gray-900">{order.event.venue}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Tickets Card */}
          {tickets && tickets.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Your Tickets</h2>
              <div className="space-y-2">
                {tickets.map((ticket: Ticket, index: number) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">Ticket {index + 1}</p>
                      <p className="text-sm text-gray-600">{ticket.ticket_number}</p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
                      {ticket.status === 'active' ? 'Active' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-4">
                You'll receive a separate email with QR codes for each ticket. Arrive early to allow time for check-in.
              </p>
            </Card>
          )}

          {/* Next Steps Card */}
          <Card className="p-6 bg-blue-50 border-blue-200">
            <h2 className="text-lg font-bold mb-3 text-gray-900">What's Next?</h2>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">1.</span>
                <span>Check your email for confirmation and ticket details</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">2.</span>
                <span>Save your QR codes or add them to your phone wallet</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">3.</span>
                <span>Arrive 15 minutes early on the event date</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">4.</span>
                <span>Present your QR code at the check-in counter</span>
              </li>
            </ul>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto justify-center">
          <Button asChild size="lg" className="flex-1">
            <a href="/dashboard">Back to Dashboard</a>
          </Button>
          <Button asChild size="lg" variant="outline" className="flex-1">
            <a href="/events">Explore More Events</a>
          </Button>
        </div>

        {/* Support Info */}
        <div className="text-center mt-12 text-sm text-gray-600">
          <p>
            Need help? Contact us at{' '}
            <a href="mailto:support@fstivo.com" className="text-blue-600 hover:underline">
              support@fstivo.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
