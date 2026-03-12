import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { XCircle, Home, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Payment Failed | FSTIVO',
};

export default async function PaymentFailedPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; provider?: string; reason?: string }>;
}) {
  const { order: orderId, provider, reason } = await searchParams;

  if (!orderId) {
    notFound();
  }

  const supabase = createClient();

  // Get order details
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      *,
      event:events(id, title, description),
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

  const providerName = {
    jazzcash: 'JazzCash',
    easypaisa: 'EasyPaisa',
    stripe: 'Stripe',
  }[provider || ''] || 'Payment Gateway';

  const failureReason = reason || 'Your payment could not be processed. Please try again or contact support.';

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
      <div className="container mx-auto px-4 py-12">
        {/* Failure Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-red-100 rounded-full p-4">
              <XCircle className="w-16 h-16 text-red-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Payment Failed</h1>
          <p className="text-lg text-gray-600">Unfortunately, we couldn't process your payment</p>
        </div>

        <div className="grid gap-6 max-w-2xl mx-auto mb-8">
          {/* Error Details Card */}
          <Card className="p-6 border-2 border-red-100">
            <div className="flex gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="font-bold text-gray-900 mb-1">Error Details</h2>
                <p className="text-gray-700">{decodeURIComponent(failureReason)}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm pt-4 border-t">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-mono font-semibold">{orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-semibold">{providerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Attempted Date:</span>
                <span className="font-semibold">
                  {new Date(order.updated_at || order.created_at).toLocaleDateString('en-PK')}
                </span>
              </div>
            </div>
          </Card>

          {/* Order Summary Card */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
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
                <p className="text-sm text-gray-600">Quantity</p>
                <p className="text-lg font-semibold text-gray-900">{order.quantity} ticket(s)</p>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="text-gray-600">Total Amount:</span>
                <span className="text-lg font-bold text-red-600">
                  PKR {order.total_amount.toLocaleString('en-PK')}
                </span>
              </div>
            </div>
          </Card>

          {/* Troubleshooting Card */}
          <Card className="p-6 bg-amber-50 border-amber-200">
            <h2 className="text-lg font-bold mb-3 text-gray-900">What Went Wrong?</h2>
            <div className="space-y-3 text-sm text-gray-700">
              <div>
                <p className="font-semibold text-gray-900 mb-1">Common reasons for payment failure:</p>
                <ul className="space-y-1 ml-4 list-disc">
                  <li>Insufficient balance in your {providerName} account</li>
                  <li>Network connection issues during transaction</li>
                  <li>Transaction limit exceeded</li>
                  <li>Account not registered or not active</li>
                  <li>Incorrect security details or PIN</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Next Steps Card */}
          <Card className="p-6 bg-blue-50 border-blue-200">
            <h2 className="text-lg font-bold mb-3 text-gray-900">What Should You Do?</h2>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">1.</span>
                <span>Check your {providerName} account balance</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">2.</span>
                <span>Verify your internet connection is stable</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">3.</span>
                <span>Try again with the same payment method</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">4.</span>
                <span>Try a different payment method if available</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">5.</span>
                <span>Contact your bank or {providerName} support if issue persists</span>
              </li>
            </ul>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto justify-center">
          <Button asChild size="lg" className="flex-1 bg-blue-600 hover:bg-blue-700">
            <a href={`/events/[id]/tickets/checkout?order=${orderId}`}>Try Payment Again</a>
          </Button>
          <Button asChild size="lg" variant="outline" className="flex-1">
            <a href="/dashboard">Back to Dashboard</a>
          </Button>
        </div>

        {/* Support Section */}
        <div className="max-w-2xl mx-auto mt-12 p-6 bg-gray-50 rounded-lg border">
          <h3 className="font-bold text-gray-900 mb-2">Still Having Issues?</h3>
          <p className="text-gray-700 mb-4">
            Our support team is here to help you. Contact us through any of these channels:
          </p>
          <div className="space-y-2 text-sm">
            <p>
              <strong>Email:</strong>{' '}
              <a href="mailto:support@fstivo.com" className="text-blue-600 hover:underline">
                support@fstivo.com
              </a>
            </p>
            <p>
              <strong>Phone:</strong>{' '}
              <a href="tel:+923001234567" className="text-blue-600 hover:underline">
                +92 300 1234567
              </a>
            </p>
            <p>
              <strong>Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM PST
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
