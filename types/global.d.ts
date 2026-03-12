// ========== Global Type Declarations ==========
// This file contains global type definitions for the entire application

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Core Application
      NEXT_PUBLIC_SITE_URL: string;
      NEXT_PUBLIC_APP_NAME: string;
      NODE_ENV: 'development' | 'production' | 'test';

      // Supabase Configuration
      NEXT_PUBLIC_SUPABASE_URL: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
      SUPABASE_SERVICE_ROLE_KEY: string;
      DATABASE_URL?: string;

      // Stripe Payment Processing
      STRIPE_SECRET_KEY: string;
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
      STRIPE_WEBHOOK_SECRET: string;

      // JazzCash (Pakistan Payment Gateway)
      JAZZCASH_MERCHANT_ID?: string;
      JAZZCASH_PASSWORD?: string;
      JAZZCASH_INTEGRITY_SALT?: string;
      JAZZCASH_RETURN_URL?: string;

      // EasyPaisa (Pakistan Payment Gateway)
      EASYPAISA_STORE_ID?: string;
      EASYPAISA_SECRET_KEY?: string;
      EASYPAISA_CALLBACK_URL?: string;

      // Resend Email Service
      RESEND_API_KEY?: string;
      RESEND_FROM_EMAIL?: string;

      // Twilio SMS/WhatsApp
      TWILIO_ACCOUNT_SID?: string;
      TWILIO_AUTH_TOKEN?: string;
      TWILIO_PHONE_NUMBER?: string;
      TWILIO_WHATSAPP_NUMBER?: string;

      // Web Push Notifications
      NEXT_PUBLIC_VAPID_PUBLIC_KEY?: string;
      VAPID_PRIVATE_KEY?: string;
      VAPID_SUBJECT?: string;

      // OpenAI API
      OPENAI_API_KEY?: string;

      // Upstash Redis (Caching)
      UPSTASH_REDIS_REST_URL?: string;
      UPSTASH_REDIS_REST_TOKEN?: string;

      // Sentry Error Tracking
      SENTRY_DSN?: string;
      SENTRY_AUTH_TOKEN?: string;
      NEXT_PUBLIC_SENTRY_DSN?: string;

      // Analytics
      NEXT_PUBLIC_GA_MEASUREMENT_ID?: string;
      NEXT_PUBLIC_POSTHOG_KEY?: string;
      NEXT_PUBLIC_POSTHOG_HOST?: string;
    }
  }

  interface Window {
    // Google Analytics
    gtag?: (
      command: 'config' | 'event',
      targetId: string,
      config?: Record<string, unknown>
    ) => void;

    // PWA Install Prompt
    deferredPrompt?: Event & {
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
    };

    // Service Worker Registration
    serviceWorkerReady?: boolean;
  }
}

export {};
