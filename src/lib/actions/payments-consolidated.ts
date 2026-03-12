/**
 * Consolidated Payment Actions
 *
 * This file provides a unified interface for payment operations.
 * All actual implementations live in API routes.
 */

interface PaymentResult {
  success: boolean;
  paymentUrl?: string;
  orderId?: string;
  error?: string;
}

/**
 * Create JazzCash payment
 * Delegates to /api/payments/jazzcash/create
 */
export async function createJazzCashPayment(
  orderId: string,
  amount: number
): Promise<PaymentResult> {
  try {
    const response = await fetch("/api/payments/jazzcash/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, amount }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Payment creation failed",
    };
  }
}

/**
 * Create EasyPaisa payment
 * Delegates to /api/payments/easypaisa/create
 */
export async function createEasyPaisaPayment(
  orderId: string,
  amount: number
): Promise<PaymentResult> {
  try {
    const response = await fetch("/api/payments/easypaisa/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, amount }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Payment creation failed",
    };
  }
}

/**
 * Create Stripe payment
 * Delegates to /api/payments/stripe/create
 */
export async function createStripePayment(
  orderId: string,
  amount: number,
  paymentMethodId?: string
): Promise<PaymentResult> {
  try {
    const response = await fetch("/api/payments/stripe/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, amount, paymentMethodId }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Payment creation failed",
    };
  }
}

/**
 * Get payment status
 */
export async function getPaymentStatus(orderId: string) {
  try {
    const response = await fetch(`/api/payments/status/${orderId}`, {
      method: "GET",
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Status check failed",
    };
  }
}
