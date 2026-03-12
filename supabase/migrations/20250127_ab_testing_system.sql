-- A/B Testing System Migration
-- Creates tables for managing A/B tests, variants, and tracking results

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- A/B Tests table
CREATE TABLE IF NOT EXISTS ab_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  campaign_id VARCHAR(255), -- Optional campaign grouping
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'completed', 'paused')),
  target_metric VARCHAR(255) NOT NULL, -- Primary metric to optimize for
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  winner_variant_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- A/B Test Variants table
CREATE TABLE IF NOT EXISTS ab_test_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id UUID NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  weight DECIMAL(5,2) NOT NULL DEFAULT 50.00 CHECK (weight >= 0 AND weight <= 100),
  config JSONB DEFAULT '{}', -- Variant-specific configuration
  metrics JSONB DEFAULT '{
    "impressions": 0,
    "clicks": 0,
    "conversions": 0,
    "revenue": 0.0,
    "custom_metrics": {}
  }',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(test_id, name)
);

-- A/B Test Results table (event tracking)
CREATE TABLE IF NOT EXISTS ab_test_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id UUID NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES ab_test_variants(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL, -- Can be anonymous user ID
  session_id VARCHAR(255), -- Optional session tracking
  action VARCHAR(255) NOT NULL, -- 'impression', 'click', 'conversion', etc.
  value DECIMAL(10,2), -- Optional value (revenue, custom metric)
  metadata JSONB DEFAULT '{}', -- Additional event data
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ab_tests_status ON ab_tests(status);
CREATE INDEX IF NOT EXISTS idx_ab_tests_campaign_id ON ab_tests(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_variants_test_id ON ab_test_variants(test_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_test_id ON ab_test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_variant_id ON ab_test_results(variant_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_user_id ON ab_test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_action ON ab_test_results(action);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_timestamp ON ab_test_results(timestamp);

-- Row Level Security (RLS) policies
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_results ENABLE ROW LEVEL SECURITY;

-- Admin-only access for managing tests
CREATE POLICY "Admin can manage A/B tests" ON ab_tests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can manage test variants" ON ab_test_variants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Public read access for test results (aggregated data only)
CREATE POLICY "Authenticated users can read test results" ON ab_test_results
  FOR SELECT USING (auth.role() = 'authenticated');

-- Admin can manage all test results
CREATE POLICY "Admin can manage test results" ON ab_test_results
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Functions for A/B testing

-- Function to get active tests
CREATE OR REPLACE FUNCTION get_active_ab_tests()
RETURNS TABLE (
  id UUID,
  name VARCHAR(255),
  target_metric VARCHAR(255),
  variants JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.name,
    t.target_metric,
    jsonb_agg(
      jsonb_build_object(
        'id', v.id,
        'name', v.name,
        'weight', v.weight,
        'config', v.config
      )
    ) as variants
  FROM ab_tests t
  JOIN ab_test_variants v ON t.id = v.test_id
  WHERE t.status = 'running'
    AND (t.start_date IS NULL OR t.start_date <= NOW())
    AND (t.end_date IS NULL OR t.end_date >= NOW())
  GROUP BY t.id, t.name, t.target_metric;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get test statistics
CREATE OR REPLACE FUNCTION get_ab_test_statistics(test_uuid UUID)
RETURNS TABLE (
  variant_id UUID,
  variant_name VARCHAR(255),
  impressions BIGINT,
  clicks BIGINT,
  conversions BIGINT,
  revenue DECIMAL(10,2),
  ctr DECIMAL(5,2),
  conversion_rate DECIMAL(5,2),
  aov DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id as variant_id,
    v.name as variant_name,
    COUNT(CASE WHEN r.action = 'impression' THEN 1 END) as impressions,
    COUNT(CASE WHEN r.action = 'click' THEN 1 END) as clicks,
    COUNT(CASE WHEN r.action = 'conversion' THEN 1 END) as conversions,
    COALESCE(SUM(r.value), 0) as revenue,
    CASE
      WHEN COUNT(CASE WHEN r.action = 'impression' THEN 1 END) > 0
      THEN ROUND(
        (COUNT(CASE WHEN r.action = 'click' THEN 1 END)::DECIMAL /
         COUNT(CASE WHEN r.action = 'impression' THEN 1 END)) * 100, 2
      )
      ELSE 0
    END as ctr,
    CASE
      WHEN COUNT(CASE WHEN r.action = 'click' THEN 1 END) > 0
      THEN ROUND(
        (COUNT(CASE WHEN r.action = 'conversion' THEN 1 END)::DECIMAL /
         COUNT(CASE WHEN r.action = 'click' THEN 1 END)) * 100, 2
      )
      ELSE 0
    END as conversion_rate,
    CASE
      WHEN COUNT(CASE WHEN r.action = 'conversion' THEN 1 END) > 0
      THEN ROUND(
        COALESCE(SUM(r.value), 0) /
        COUNT(CASE WHEN r.action = 'conversion' THEN 1 END), 2
      )
      ELSE 0
    END as aov
  FROM ab_test_variants v
  LEFT JOIN ab_test_results r ON v.id = r.variant_id
  WHERE v.test_id = test_uuid
  GROUP BY v.id, v.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to determine test winner (simple version based on conversion rate)
CREATE OR REPLACE FUNCTION determine_ab_test_winner(test_uuid UUID)
RETURNS UUID AS $$
DECLARE
  winner_id UUID;
BEGIN
  SELECT variant_id INTO winner_id
  FROM get_ab_test_statistics(test_uuid)
  ORDER BY conversion_rate DESC, impressions DESC
  LIMIT 1;

  RETURN winner_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ab_tests_updated_at
  BEFORE UPDATE ON ab_tests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ab_test_variants_updated_at
  BEFORE UPDATE ON ab_test_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO ab_tests (id, name, description, status, target_metric, created_at, updated_at)
VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'Homepage CTA Button Color', 'Testing red vs blue CTA button colors', 'running', 'conversion_rate', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440001', 'Pricing Page Layout', 'Testing single vs multi-column pricing layout', 'draft', 'conversion_rate', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO ab_test_variants (id, test_id, name, description, weight, config, created_at, updated_at)
VALUES
  ('660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', 'Red Button', 'Primary red CTA button', 50.00, '{"button_color": "red", "button_text": "Get Started"}', NOW(), NOW()),
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Blue Button', 'Primary blue CTA button', 50.00, '{"button_color": "blue", "button_text": "Get Started"}', NOW(), NOW()),
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Single Column', 'Traditional single column pricing', 50.00, '{"layout": "single"}', NOW(), NOW()),
  ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Multi Column', 'Modern multi-column pricing grid', 50.00, '{"layout": "multi"}', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;