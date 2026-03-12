'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';

type PaymentProvider = 'stripe' | 'jazzcash' | 'easypaisa';

interface Tier {
  id: string;
  name: string;
  price: number;
}

interface Event {
  id: string;
  title: string;
}

interface CheckoutFormProps {
  event: Event & { tier: Tier };
  tier: Tier;
  quantity: number;
}

export function CheckoutForm({ event, tier, quantity }: CheckoutFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
    }).format(amount);
  };

  const total = tier.price * quantity;

  const handlePayment = async (provider: PaymentProvider) => {
    setLoading(true);
    setError(null);
    setSelectedProvider(provider);

    try {
      // Step 1: Create order for tickets
      const orderRes = await fetch('/api/tickets/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier_id: tier.id,
          quantity,
          event_id: event.id,
        }),
      });

      if (!orderRes.ok) {
        const errorData = await orderRes.json();
        throw new Error(errorData.error || 'Failed to create order');
      }

      const { order } = await orderRes.json();

      // Step 2: Create payment with selected provider
      const paymentRes = await fetch(`/api/payments/${provider}/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          amount: total,
          description: `${event.title} - ${tier.name} (x${quantity})`,
        }),
      });

      if (!paymentRes.ok) {
        const errorData = await paymentRes.json();
        throw new Error(errorData.error || 'Failed to create payment');
      }

      const { payment } = await paymentRes.json();

      // Step 3: Redirect to payment provider
      if (provider === 'stripe') {
        // Stripe uses a hosted checkout, redirect to Stripe session
        router.push(payment.url);
      } else if (provider === 'jazzcash' || provider === 'easypaisa') {
        // JazzCash and EasyPaisa require form submission with hidden inputs
        // Create a hidden form and submit it
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = payment.url;

        Object.entries(payment.params).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = String(value);
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment failed. Please try again.';
      setError(message);
      setLoading(false);
      setSelectedProvider(null);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Payment Error</p>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Order Summary</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span>Event</span>
            <span className="font-semibold">{event.title}</span>
          </div>
          <div className="flex justify-between">
            <span>Ticket Type</span>
            <span className="font-semibold">{tier.name}</span>
          </div>
          <div className="flex justify-between">
            <span>Quantity</span>
            <span className="font-semibold">{quantity}</span>
          </div>
          <div className="flex justify-between">
            <span>Price per Ticket</span>
            <span className="font-semibold">{formatCurrency(tier.price)}</span>
          </div>
          <div className="border-t pt-3 flex justify-between">
            <span className="text-lg font-bold">Total</span>
            <span className="text-lg font-bold">{formatCurrency(total)}</span>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Payment Method</h2>
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold mb-3 block">Choose Payment Method</Label>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handlePayment('stripe')}
                disabled={loading}
                className={`w-full px-4 py-3 rounded-lg border-2 transition-all ${
                  selectedProvider === 'stripe'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-400'
                } disabled:opacity-50 disabled:cursor-not-allowed text-left`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">Credit/Debit Card</p>
                    <p className="text-sm text-gray-600">Visa, Mastercard, etc.</p>
                  </div>
                  {selectedProvider === 'stripe' && (
                    <span className="text-blue-600">✓</span>
                  )}
                </div>
              </button>

              <button
                type="button"
                onClick={() => handlePayment('jazzcash')}
                disabled={loading}
                className={`w-full px-4 py-3 rounded-lg border-2 transition-all ${
                  selectedProvider === 'jazzcash'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-400'
                } disabled:opacity-50 disabled:cursor-not-allowed text-left`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">JazzCash</p>
                    <p className="text-sm text-gray-600">Mobile wallet payment</p>
                  </div>
                  {selectedProvider === 'jazzcash' && (
                    <span className="text-blue-600">✓</span>
                  )}
                </div>
              </button>

              <button
                type="button"
                onClick={() => handlePayment('easypaisa')}
                disabled={loading}
                className={`w-full px-4 py-3 rounded-lg border-2 transition-all ${
                  selectedProvider === 'easypaisa'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-400'
                } disabled:opacity-50 disabled:cursor-not-allowed text-left`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">EasyPaisa</p>
                    <p className="text-sm text-gray-600">Mobile banking payment</p>
                  </div>
                  {selectedProvider === 'easypaisa' && (
                    <span className="text-blue-600">✓</span>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>
      </Card>

      <Button
        type="button"
        onClick={() => selectedProvider && handlePayment(selectedProvider)}
        disabled={loading || !selectedProvider}
        className="w-full"
        size="lg"
      >
        {loading ? 'Processing...' : `Pay ${formatCurrency(total)}`}
      </Button>

      <p className="text-center text-sm text-gray-600">
        Your payment is secure and encrypted. You will be redirected to the payment provider.
      </p>
    </div>
  );
}
