-- =====================================================
-- Migration: 20250103_subscription_system.sql
-- Description: Subscription plans, billing, and usage tracking
-- Tables: 7 tables
-- =====================================================

-- 1. Subscription Plans
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'PKR',
  features JSONB NOT NULL DEFAULT '{}',
  limits JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User Subscriptions
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'paused')),
  billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  stripe_subscription_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, plan_id)
);

-- 3. Subscription Usage Tracking
CREATE TABLE subscription_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  metric VARCHAR(50) NOT NULL,
  value INTEGER NOT NULL DEFAULT 0,
  limit_value INTEGER NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subscription_id, metric, period_start)
);

-- 4. Subscription Invoices
CREATE TABLE subscription_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'PKR',
  status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  stripe_invoice_id VARCHAR(255),
  pdf_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Subscription Invoice Items
CREATE TABLE subscription_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES subscription_invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Payment Methods
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('card', 'bank_account', 'wallet')),
  provider VARCHAR(50) NOT NULL,
  is_default BOOLEAN DEFAULT false,
  stripe_payment_method_id VARCHAR(255),
  last4 VARCHAR(4),
  brand VARCHAR(50),
  exp_month INTEGER,
  exp_year INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Subscription History
CREATE TABLE subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  old_plan_id UUID REFERENCES subscription_plans(id),
  new_plan_id UUID REFERENCES subscription_plans(id),
  old_status VARCHAR(20),
  new_status VARCHAR(20),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_subscription_usage_subscription_id ON subscription_usage(subscription_id);
CREATE INDEX idx_subscription_invoices_subscription_id ON subscription_invoices(subscription_id);
CREATE INDEX idx_subscription_invoices_status ON subscription_invoices(status);
CREATE INDEX idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX idx_subscription_history_subscription_id ON subscription_history(subscription_id);

-- RLS Policies
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

-- Public can view active plans
CREATE POLICY "Anyone can view active plans" ON subscription_plans
  FOR SELECT USING (is_active = true);

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own usage" ON subscription_usage
  FOR SELECT USING (
    subscription_id IN (
      SELECT id FROM user_subscriptions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own invoices" ON subscription_invoices
  FOR SELECT USING (
    subscription_id IN (
      SELECT id FROM user_subscriptions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own invoice items" ON subscription_invoice_items
  FOR SELECT USING (
    invoice_id IN (
      SELECT i.id FROM subscription_invoices i
      JOIN user_subscriptions s ON i.subscription_id = s.id
      WHERE s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own payment methods" ON payment_methods
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own subscription history" ON subscription_history
  FOR SELECT USING (
    subscription_id IN (
      SELECT id FROM user_subscriptions WHERE user_id = auth.uid()
    )
  );

-- Insert default subscription plans
INSERT INTO subscription_plans (name, slug, description, price_monthly, price_yearly, features, limits) VALUES
('Free', 'free', 'Perfect for getting started', 0, 0,
  '["Basic event creation", "100 attendees per event", "Email support", "Basic analytics"]'::jsonb,
  '{"events_per_year": 5, "attendees_per_event": 100, "email_campaigns": 0, "custom_branding": false, "api_access": false}'::jsonb
),
('Pro', 'pro', 'For professional event organizers', 2900, 29000,
  '["50 events per year", "1,000 attendees per event", "Priority support", "Advanced analytics", "Email campaigns", "Custom branding", "10 team members"]'::jsonb,
  '{"events_per_year": 50, "attendees_per_event": 1000, "email_campaigns": 10, "custom_branding": true, "api_access": false, "team_members": 10}'::jsonb
),
('Business', 'business', 'For growing organizations', 9900, 99000,
  '["Unlimited events", "10,000 attendees per event", "24/7 support", "Full analytics suite", "Unlimited campaigns", "White-label", "API access", "50 team members", "Dedicated account manager"]'::jsonb,
  '{"events_per_year": -1, "attendees_per_event": 10000, "email_campaigns": -1, "custom_branding": true, "api_access": true, "team_members": 50, "white_label": true}'::jsonb
),
('Enterprise', 'enterprise', 'Custom solutions for large organizations', 0, 0,
  '["Custom everything", "Unlimited attendees", "White-glove support", "Custom integrations", "SLA guarantees", "Dedicated infrastructure"]'::jsonb,
  '{"events_per_year": -1, "attendees_per_event": -1, "email_campaigns": -1, "custom_branding": true, "api_access": true, "team_members": -1, "white_label": true, "custom_integrations": true}'::jsonb
);

-- Function to check subscription limits
CREATE OR REPLACE FUNCTION check_subscription_limit(
  p_user_id UUID,
  p_metric VARCHAR,
  p_increment INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  v_subscription_id UUID;
  v_current_usage INTEGER;
  v_limit INTEGER;
BEGIN
  -- Get active subscription
  SELECT id INTO v_subscription_id
  FROM user_subscriptions
  WHERE user_id = p_user_id
    AND status = 'active'
    AND current_period_end > NOW()
  LIMIT 1;

  IF v_subscription_id IS NULL THEN
    RETURN false;
  END IF;

  -- Get current usage and limit
  SELECT value, limit_value INTO v_current_usage, v_limit
  FROM subscription_usage
  WHERE subscription_id = v_subscription_id
    AND metric = p_metric
    AND period_end > NOW()
  ORDER BY period_start DESC
  LIMIT 1;

  -- If no usage record exists, get limit from plan
  IF v_current_usage IS NULL THEN
    SELECT (sp.limits->p_metric)::INTEGER INTO v_limit
    FROM user_subscriptions us
    JOIN subscription_plans sp ON us.plan_id = sp.id
    WHERE us.id = v_subscription_id;

    v_current_usage := 0;
  END IF;

  -- -1 means unlimited
  IF v_limit = -1 THEN
    RETURN true;
  END IF;

  RETURN (v_current_usage + p_increment) <= v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment usage
CREATE OR REPLACE FUNCTION increment_subscription_usage(
  p_user_id UUID,
  p_metric VARCHAR,
  p_value INTEGER DEFAULT 1
)
RETURNS VOID AS $$
DECLARE
  v_subscription_id UUID;
  v_limit INTEGER;
  v_period_start TIMESTAMPTZ;
  v_period_end TIMESTAMPTZ;
BEGIN
  -- Get active subscription
  SELECT id, current_period_start, current_period_end
  INTO v_subscription_id, v_period_start, v_period_end
  FROM user_subscriptions
  WHERE user_id = p_user_id
    AND status = 'active'
    AND current_period_end > NOW()
  LIMIT 1;

  IF v_subscription_id IS NULL THEN
    RAISE EXCEPTION 'No active subscription found';
  END IF;

  -- Get limit
  SELECT (sp.limits->p_metric)::INTEGER INTO v_limit
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.plan_id = sp.id
  WHERE us.id = v_subscription_id;

  -- Insert or update usage
  INSERT INTO subscription_usage (
    subscription_id,
    metric,
    value,
    limit_value,
    period_start,
    period_end
  ) VALUES (
    v_subscription_id,
    p_metric,
    p_value,
    COALESCE(v_limit, -1),
    v_period_start,
    v_period_end
  )
  ON CONFLICT (subscription_id, metric, period_start)
  DO UPDATE SET value = subscription_usage.value + p_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_usage_updated_at
  BEFORE UPDATE ON subscription_usage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
