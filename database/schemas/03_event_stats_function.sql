-- Database function to get event statistics
CREATE OR REPLACE FUNCTION get_event_stats(event_id UUID)
RETURNS TABLE (
  total_registrations BIGINT,
  total_revenue DECIMAL,
  total_checked_in BIGINT,
  capacity INTEGER,
  tickets_sold_by_type JSONB,
  registrations_by_day JSONB
) AS $$
DECLARE
  v_event RECORD;
  v_total_registrations BIGINT;
  v_total_revenue DECIMAL;
  v_total_checked_in BIGINT;
  v_tickets_by_type JSONB;
  v_regs_by_day JSONB;
BEGIN
  -- Get event details
  SELECT * INTO v_event
  FROM events
  WHERE id = event_id;

  -- Get total registrations
  SELECT COUNT(*) INTO v_total_registrations
  FROM registrations
  WHERE event_id = event_id AND status IN ('confirmed', 'attended');

  -- Get total revenue from payments
  SELECT COALESCE(SUM(amount), 0) INTO v_total_revenue
  FROM payments
  WHERE registration_id IN (
    SELECT id FROM registrations WHERE event_id = event_id
  ) AND status = 'completed';

  -- Get total checked in
  SELECT COUNT(*) INTO v_total_checked_in
  FROM registrations
  WHERE event_id = event_id AND checked_in_at IS NOT NULL;

  -- Get tickets sold by type (using ticket_types table if exists)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'type', COALESCE(tt.name, 'General'),
    'sold', COUNT(r.id),
    'revenue', COALESCE(SUM(p.amount), 0)
  )), '[]'::jsonb) INTO v_tickets_by_type
  FROM ticket_types tt
  LEFT JOIN registrations r ON r.event_id = tt.event_id
  LEFT JOIN payments p ON p.registration_id = r.id AND p.status = 'completed'
  WHERE tt.event_id = event_id
  GROUP BY tt.id, tt.name
  ORDER BY COUNT(r.id) DESC;

  -- Fallback if no ticket_types
  IF v_tickets_by_type = '[]'::jsonb THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'type', 'General',
      'sold', COUNT(*),
      'revenue', v_total_revenue
    )), '[]'::jsonb) INTO v_tickets_by_type
    FROM registrations
    WHERE event_id = event_id AND status IN ('confirmed', 'attended');
  END IF;

  -- Get registrations by day (last 30 days)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'date', DATE(registered_at),
    'count', COUNT(*)
  )), '[]'::jsonb) INTO v_regs_by_day
  FROM (
    SELECT DATE(registered_at) as registered_at
    FROM registrations
    WHERE event_id = event_id
      AND registered_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(registered_at)
    ORDER BY DATE(registered_at) DESC
    LIMIT 10
  ) daily_regs;

  RETURN QUERY
  SELECT
    v_total_registrations,
    v_total_revenue,
    v_total_checked_in,
    v_event.capacity,
    v_tickets_by_type,
    v_regs_by_day;
END;
$$ LANGUAGE plpgsql;

-- Create a view for event statistics
CREATE OR REPLACE VIEW event_statistics AS
SELECT
  e.id as event_id,
  e.title,
  e.start_date,
  e.capacity,
  COUNT(DISTINCT r.id) as total_registrations,
  COALESCE(SUM(p.amount), 0) as total_revenue,
  COUNT(DISTINCT CASE WHEN r.checked_in_at IS NOT NULL THEN r.id END) as total_checked_in
FROM events e
LEFT JOIN registrations r ON r.event_id = e.id AND r.status IN ('confirmed', 'attended')
LEFT JOIN payments p ON p.registration_id = r.id AND p.status = 'completed'
GROUP BY e.id, e.title, e.start_date, e.capacity;
