-- =====================================================
-- FSTIVO EVENT CLONING & TEMPLATES - DATABASE SCHEMA
-- =====================================================
-- Version: 1.0
-- Purpose: Quickly create recurring events
-- Features: Clone events, save templates, template marketplace
-- =====================================================

-- =====================================================
-- 1. EVENT TEMPLATES
-- =====================================================
CREATE TABLE IF NOT EXISTS event_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID NOT NULL REFERENCES auth.users(id),

    -- Template metadata
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100), -- conference, workshop, concert, sports, etc.
    thumbnail_url TEXT,

    -- Template content (complete event structure)
    template_data JSONB NOT NULL, -- All event fields

    -- Marketplace
    is_public BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    price DECIMAL(10, 2) DEFAULT 0, -- 0 for free templates
    downloads_count INTEGER DEFAULT 0,
    rating DECIMAL(3, 2) DEFAULT 0,
    reviews_count INTEGER DEFAULT 0,

    -- Tags for discovery
    tags JSONB DEFAULT '[]',

    -- What's included
    includes_email_templates BOOLEAN DEFAULT false,
    includes_landing_page BOOLEAN DEFAULT false,
    includes_ticket_types BOOLEAN DEFAULT false,
    includes_schedule BOOLEAN DEFAULT false,
    includes_seating BOOLEAN DEFAULT false,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_templates_organizer ON event_templates(organizer_id);
CREATE INDEX idx_templates_category ON event_templates(category);
CREATE INDEX idx_templates_public ON event_templates(is_public);
CREATE INDEX idx_templates_featured ON event_templates(is_featured);

-- =====================================================
-- 2. EVENT SERIES
-- =====================================================
CREATE TABLE IF NOT EXISTS event_series (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID NOT NULL REFERENCES auth.users(id),

    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Series configuration
    recurrence_pattern VARCHAR(50) NOT NULL, -- daily, weekly, monthly, yearly, custom
    recurrence_config JSONB, -- { interval: 2, days_of_week: [1,3,5], etc. }

    -- Base event template
    base_template_id UUID REFERENCES event_templates(id),
    base_event_data JSONB NOT NULL,

    -- Series timeline
    series_start_date DATE NOT NULL,
    series_end_date DATE,
    total_events INTEGER,

    -- Status
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_series_organizer ON event_series(organizer_id);
CREATE INDEX idx_series_active ON event_series(is_active);

-- =====================================================
-- 3. SERIES EVENTS (Individual events in a series)
-- =====================================================
CREATE TABLE IF NOT EXISTS series_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    series_id UUID NOT NULL REFERENCES event_series(id) ON DELETE CASCADE,
    event_id UUID UNIQUE, -- Reference to actual event

    -- Occurrence info
    occurrence_number INTEGER NOT NULL,
    scheduled_date DATE NOT NULL,

    -- Status
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, created, cancelled, completed

    -- Overrides from series defaults
    custom_data JSONB, -- Any fields that differ from series template

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(series_id, occurrence_number)
);

CREATE INDEX idx_series_events_series ON series_events(series_id);
CREATE INDEX idx_series_events_date ON series_events(scheduled_date);
CREATE INDEX idx_series_events_status ON series_events(status);

-- =====================================================
-- 4. TEMPLATE MARKETPLACE PURCHASES
-- =====================================================
CREATE TABLE IF NOT EXISTS template_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES event_templates(id),
    buyer_id UUID NOT NULL REFERENCES auth.users(id),

    price_paid DECIMAL(10, 2) NOT NULL,

    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(template_id, buyer_id)
);

CREATE INDEX idx_purchases_template ON template_purchases(template_id);
CREATE INDEX idx_purchases_buyer ON template_purchases(buyer_id);

-- =====================================================
-- 5. TEMPLATE REVIEWS
-- =====================================================
CREATE TABLE IF NOT EXISTS template_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES event_templates(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES auth.users(id),

    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,

    -- Helpful votes
    helpful_count INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(template_id, reviewer_id)
);

CREATE INDEX idx_reviews_template ON template_reviews(template_id);
CREATE INDEX idx_reviews_rating ON template_reviews(rating);

-- =====================================================
-- 6. EVENT CLONING HISTORY
-- =====================================================
CREATE TABLE IF NOT EXISTS event_cloning_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID NOT NULL REFERENCES auth.users(id),

    source_event_id UUID, -- Original event
    cloned_event_id UUID, -- New event
    template_id UUID REFERENCES event_templates(id),

    cloning_method VARCHAR(50) NOT NULL, -- direct_clone, from_template, from_series

    -- What was cloned
    cloned_fields JSONB, -- List of fields that were copied
    modified_fields JSONB, -- Fields that were changed during cloning

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cloning_organizer ON event_cloning_history(organizer_id);
CREATE INDEX idx_cloning_source ON event_cloning_history(source_event_id);

-- =====================================================
-- 7. BULK EVENT OPERATIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS bulk_event_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID NOT NULL REFERENCES auth.users(id),

    operation_type VARCHAR(50) NOT NULL, -- bulk_create, bulk_update, bulk_delete

    -- Operation config
    template_id UUID REFERENCES event_templates(id),
    series_id UUID REFERENCES event_series(id),
    config JSONB NOT NULL, -- Details of the operation

    -- Status tracking
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
    total_events INTEGER DEFAULT 0,
    processed_events INTEGER DEFAULT 0,
    failed_events INTEGER DEFAULT 0,

    -- Results
    created_event_ids JSONB DEFAULT '[]',
    error_log JSONB DEFAULT '[]',

    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bulk_ops_organizer ON bulk_event_operations(organizer_id);
CREATE INDEX idx_bulk_ops_status ON bulk_event_operations(status);

-- =====================================================
-- 8. TEMPLATE COLLECTIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS template_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(255) NOT NULL,
    description TEXT,
    slug VARCHAR(255) UNIQUE NOT NULL,

    -- Display
    cover_image_url TEXT,
    icon VARCHAR(50),

    -- Ordering
    display_order INTEGER DEFAULT 0,

    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 9. TEMPLATE COLLECTION ITEMS
-- =====================================================
CREATE TABLE IF NOT EXISTS template_collection_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID NOT NULL REFERENCES template_collections(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES event_templates(id) ON DELETE CASCADE,

    display_order INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(collection_id, template_id)
);

CREATE INDEX idx_collection_items_collection ON template_collection_items(collection_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE event_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE series_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_cloning_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_event_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_collection_items ENABLE ROW LEVEL SECURITY;

-- Organizers can manage their own templates
CREATE POLICY "Organizers can manage templates"
    ON event_templates FOR ALL
    USING (auth.uid() = organizer_id);

-- Everyone can view public templates
CREATE POLICY "Public templates are viewable"
    ON event_templates FOR SELECT
    USING (is_public = true OR auth.uid() = organizer_id);

-- Organizers can manage series
CREATE POLICY "Organizers can manage series"
    ON event_series FOR ALL
    USING (auth.uid() = organizer_id);

CREATE POLICY "Organizers can manage series events"
    ON series_events FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM event_series
            WHERE event_series.id = series_events.series_id
            AND event_series.organizer_id = auth.uid()
        )
    );

CREATE POLICY "Users can view own purchases"
    ON template_purchases FOR SELECT
    USING (auth.uid() = buyer_id);

CREATE POLICY "Users can create purchases"
    ON template_purchases FOR INSERT
    WITH CHECK (auth.uid() = buyer_id);

-- Users can review templates they purchased
CREATE POLICY "Users can review purchased templates"
    ON template_reviews FOR INSERT
    WITH CHECK (
        auth.uid() = reviewer_id
        AND EXISTS (
            SELECT 1 FROM template_purchases
            WHERE template_id = template_reviews.template_id
            AND buyer_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own reviews"
    ON template_reviews FOR UPDATE
    USING (auth.uid() = reviewer_id);

-- Everyone can view reviews
CREATE POLICY "Reviews are publicly viewable"
    ON template_reviews FOR SELECT
    USING (true);

CREATE POLICY "Organizers can manage cloning history"
    ON event_cloning_history FOR ALL
    USING (auth.uid() = organizer_id);

CREATE POLICY "Organizers can manage bulk operations"
    ON bulk_event_operations FOR ALL
    USING (auth.uid() = organizer_id);

CREATE POLICY "Public collections are viewable"
    ON template_collections FOR SELECT
    USING (true);

CREATE POLICY "Collection items are viewable"
    ON template_collection_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM template_collections
            WHERE template_collections.id = template_collection_items.collection_id
            AND template_collections.is_active = true
        )
    );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function: Clone event
CREATE OR REPLACE FUNCTION clone_event(
    p_source_event_id UUID,
    p_organizer_id UUID,
    p_new_event_data JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    v_new_event_id UUID;
    v_source_event RECORD;
BEGIN
    -- Get source event (simplified - would need to adapt to actual events table)
    -- This is a placeholder implementation

    -- Create cloning history record
    INSERT INTO event_cloning_history (
        organizer_id,
        source_event_id,
        cloned_event_id,
        cloning_method,
        cloned_fields
    ) VALUES (
        p_organizer_id,
        p_source_event_id,
        v_new_event_id,
        'direct_clone',
        '[]'::jsonb
    );

    RETURN v_new_event_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Create event from template
CREATE OR REPLACE FUNCTION create_event_from_template(
    p_template_id UUID,
    p_organizer_id UUID,
    p_custom_data JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    v_template RECORD;
    v_new_event_id UUID;
    v_template_data JSONB;
BEGIN
    -- Get template
    SELECT * INTO v_template FROM event_templates WHERE id = p_template_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template not found';
    END IF;

    -- Merge template data with custom data
    v_template_data := v_template.template_data || p_custom_data;

    -- Create event from template data (simplified - would need actual events table)
    -- v_new_event_id := ... (event creation logic)

    -- Update template download count
    UPDATE event_templates
    SET downloads_count = downloads_count + 1
    WHERE id = p_template_id;

    -- Log operation
    INSERT INTO event_cloning_history (
        organizer_id,
        cloned_event_id,
        template_id,
        cloning_method
    ) VALUES (
        p_organizer_id,
        v_new_event_id,
        p_template_id,
        'from_template'
    );

    RETURN v_new_event_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Generate series events
CREATE OR REPLACE FUNCTION generate_series_events(p_series_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_series RECORD;
    v_current_date DATE;
    v_occurrence_num INTEGER := 0;
    v_events_created INTEGER := 0;
BEGIN
    SELECT * INTO v_series FROM event_series WHERE id = p_series_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Series not found';
    END IF;

    v_current_date := v_series.series_start_date;

    -- Generate events based on recurrence pattern (simplified)
    WHILE v_current_date <= COALESCE(v_series.series_end_date, v_current_date + INTERVAL '1 year') LOOP
        v_occurrence_num := v_occurrence_num + 1;

        -- Insert series event placeholder
        INSERT INTO series_events (
            series_id,
            occurrence_number,
            scheduled_date,
            status
        ) VALUES (
            p_series_id,
            v_occurrence_num,
            v_current_date,
            'scheduled'
        );

        v_events_created := v_events_created + 1;

        -- Calculate next date based on pattern
        IF v_series.recurrence_pattern = 'daily' THEN
            v_current_date := v_current_date + INTERVAL '1 day';
        ELSIF v_series.recurrence_pattern = 'weekly' THEN
            v_current_date := v_current_date + INTERVAL '1 week';
        ELSIF v_series.recurrence_pattern = 'monthly' THEN
            v_current_date := v_current_date + INTERVAL '1 month';
        ELSE
            EXIT; -- Unknown pattern
        END IF;

        -- Safety limit
        IF v_events_created >= 100 THEN
            EXIT;
        END IF;
    END LOOP;

    -- Update series
    UPDATE event_series
    SET total_events = v_events_created
    WHERE id = p_series_id;

    RETURN v_events_created;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SAMPLE DATA
-- =====================================================

-- Insert sample template collections
INSERT INTO template_collections (name, description, slug, cover_image_url, display_order) VALUES
('Conference Templates', 'Professional templates for conferences and summits', 'conferences', '/templates/conferences.jpg', 1),
('Workshop Templates', 'Interactive workshop and training session templates', 'workshops', '/templates/workshops.jpg', 2),
('Concert Templates', 'Music and entertainment event templates', 'concerts', '/templates/concerts.jpg', 3),
('Sports Templates', 'Sports events and tournaments', 'sports', '/templates/sports.jpg', 4)
ON CONFLICT (slug) DO NOTHING;

-- Insert sample template
INSERT INTO event_templates (
    organizer_id,
    name,
    description,
    category,
    template_data,
    is_public,
    is_featured,
    tags,
    includes_email_templates,
    includes_landing_page,
    includes_ticket_types
) VALUES (
    (SELECT id FROM auth.users LIMIT 1),
    'Tech Conference Template',
    'Complete template for technology conferences with speakers, schedule, and networking',
    'conference',
    '{
        "name": "Tech Conference [Year]",
        "description": "Annual technology conference bringing together industry leaders",
        "capacity": 500,
        "ticket_types": [
            {"name": "Early Bird", "price": 5000, "quantity": 100},
            {"name": "Regular", "price": 7500, "quantity": 300},
            {"name": "VIP", "price": 15000, "quantity": 100}
        ]
    }'::jsonb,
    true,
    true,
    '["technology", "conference", "networking", "speakers"]'::jsonb,
    true,
    true,
    true
) ON CONFLICT DO NOTHING;

-- =====================================================
-- EVENT CLONING SCHEMA COMPLETE
-- =====================================================
-- Total Tables: 9
-- Total Functions: 3
-- RLS Policies: 10+
-- =====================================================
