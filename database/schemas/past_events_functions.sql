-- Create function to get past events statistics
CREATE OR REPLACE FUNCTION get_past_events_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_events', (SELECT COUNT(*) FROM past_events_showcase),
    'total_attendees', (SELECT COALESCE(SUM(attendees_count), 0) FROM past_events_showcase),
    'average_rating', (SELECT COALESCE(ROUND(AVG(rating), 1), 0.0) FROM past_events_showcase WHERE rating > 0),
    'total_testimonials', (SELECT COUNT(*) FROM event_testimonials),
    'featured_events', (SELECT COUNT(*) FROM past_events_showcase WHERE is_featured = true),
    'categories', (
      SELECT json_agg(DISTINCT category ORDER BY category)
      FROM past_events_showcase
    ),
    'years', (
      SELECT json_agg(DISTINCT year ORDER BY year DESC)
      FROM past_events_showcase
    ),
    'top_rated_events', (
      SELECT json_agg(json_build_object(
        'id', id,
        'title', title,
        'rating', rating,
        'attendees', attendees_count
      ))
      FROM (
        SELECT id, title, rating, attendees_count
        FROM past_events_showcase
        WHERE rating > 0
        ORDER BY rating DESC, attendees_count DESC
        LIMIT 5
      ) top_events
    ),
    'recent_testimonials', (
      SELECT json_agg(json_build_object(
        'id', et.id,
        'name', et.attendee_name,
        'role', et.attendee_role,
        'text', et.testimonial_text,
        'event_title', pes.title,
        'rating', et.rating
      ))
      FROM (
        SELECT *
        FROM event_testimonials
        WHERE is_featured = true
        ORDER BY created_at DESC
        LIMIT 10
      ) et
      JOIN past_events_showcase pes ON pes.id = et.showcase_event_id
    ),
    'category_breakdown', (
      SELECT json_object_agg(category, event_count)
      FROM (
        SELECT
          category,
          COUNT(*) as event_count
        FROM past_events_showcase
        GROUP BY category
        ORDER BY event_count DESC
      ) cat_counts
    ),
    'yearly_breakdown', (
      SELECT json_object_agg(year, json_build_object(
        'events', event_count,
        'attendees', total_attendees,
        'avg_rating', avg_rating
      ))
      FROM (
        SELECT
          year,
          COUNT(*) as event_count,
          SUM(attendees_count) as total_attendees,
          ROUND(AVG(rating), 1) as avg_rating
        FROM past_events_showcase
        GROUP BY year
        ORDER BY year DESC
      ) year_stats
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_past_events_stats() TO anon, authenticated;

-- Insert sample data for demonstration
INSERT INTO past_events_showcase (title, description, date, year, location, category, attendees_count, rating, featured_image, highlights, is_featured, display_order) VALUES
('Tech Summit 2024', 'Largest technology conference in Pakistan with industry leaders', '2024-03-15', 2024, 'FAST-NUCES, Karachi', 'Technology', 850, 4.8, 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800', ARRAY['20+ Industry speakers', '500+ Job opportunities', 'Networking sessions'], true, 1),
('Literary Festival 2024', 'Celebration of Pakistani literature and poetry', '2024-02-20', 2024, 'Kinnaird College, Lahore', 'Arts & Culture', 650, 4.9, 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800', ARRAY['15+ Authors', 'Poetry sessions', 'Book signings'], true, 2),
('Sports Gala 2023', 'Inter-university sports competition', '2023-11-10', 2023, 'LUMS, Lahore', 'Sports', 1200, 4.7, 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800', ARRAY['10+ Sports', 'Inter-university matches', 'Prize pool: Rs 500K'], false, 3),
('Startup Pitch Competition 2023', 'Annual startup funding competition', '2023-09-05', 2023, 'IBA, Karachi', 'Business', 450, 4.6, 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800', ARRAY['50+ Startups', 'Rs 2M in funding', 'Investor networking'], true, 4),
('Music Festival 2023', 'Biggest college music festival in Pakistan', '2023-07-15', 2023, 'NCA, Lahore', 'Arts & Culture', 2000, 4.9, 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800', ARRAY['15+ Bands', 'Food festival', 'Art installations'], false, 5),
('Hackathon 2023', '36-hour coding competition', '2023-05-20', 2023, 'NUST, Islamabad', 'Technology', 300, 4.8, 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800', ARRAY['36-hour coding', 'Industry mentors', 'Prize pool: Rs 300K'], true, 6)
ON CONFLICT DO NOTHING;

-- Insert sample gallery images
INSERT INTO event_gallery (showcase_event_id, image_url, caption, display_order)
SELECT
  id,
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400',
  'Main event hall',
  1
FROM past_events_showcase
WHERE title = 'Tech Summit 2024'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO event_gallery (showcase_event_id, image_url, caption, display_order)
SELECT
  id,
  'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=400',
  'Speaker session',
  2
FROM past_events_showcase
WHERE title = 'Tech Summit 2024'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO event_gallery (showcase_event_id, image_url, caption, display_order)
SELECT
  id,
  'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=400',
  'Networking break',
  3
FROM past_events_showcase
WHERE title = 'Tech Summit 2024'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Insert sample testimonials
INSERT INTO event_testimonials (showcase_event_id, attendee_name, attendee_role, attendee_university, testimonial_text, rating, is_featured)
SELECT
  id,
  'Ahmed Khan',
  'Student',
  'FAST-NUCES',
  'Best tech event I''ve attended! Amazing speakers and networking opportunities.',
  5,
  true
FROM past_events_showcase
WHERE title = 'Tech Summit 2024'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO event_testimonials (showcase_event_id, attendee_name, attendee_role, attendee_university, testimonial_text, rating, is_featured)
SELECT
  id,
  'Sara Ahmed',
  'Literature Student',
  'Kinnaird College',
  'Inspiring event! Met my favorite authors and discovered new voices in Pakistani literature.',
  5,
  true
FROM past_events_showcase
WHERE title = 'Literary Festival 2024'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO event_testimonials (showcase_event_id, attendee_name, attendee_role, attendee_university, testimonial_text, rating, is_featured)
SELECT
  id,
  'Ali Raza',
  'Cricket Captain',
  'LUMS',
  'Excellent organization! The competitive spirit was amazing.',
  5,
  true
FROM past_events_showcase
WHERE title = 'Sports Gala 2023'
LIMIT 1
ON CONFLICT DO NOTHING;
