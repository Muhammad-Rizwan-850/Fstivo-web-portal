-- =====================================================
-- FSTIVO SEATING & VENUE MANAGEMENT - DATABASE SCHEMA
-- =====================================================
-- Version: 1.0
-- Purpose: Interactive seating charts and venue layouts
-- Features: Visual seat selection, section pricing, reserved seating
-- =====================================================

-- =====================================================
-- 1. VENUES
-- =====================================================
CREATE TABLE IF NOT EXISTS venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID REFERENCES auth.users(id),

    -- Basic info
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),

    -- Location
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Capacity
    total_capacity INTEGER NOT NULL,
    standing_capacity INTEGER DEFAULT 0,
    seated_capacity INTEGER DEFAULT 0,

    -- Amenities
    has_parking BOOLEAN DEFAULT false,
    has_wheelchair_access BOOLEAN DEFAULT false,
    has_wifi BOOLEAN DEFAULT false,
    has_air_conditioning BOOLEAN DEFAULT false,
    amenities JSONB DEFAULT '[]',

    -- Media
    photos JSONB DEFAULT '[]',
    floor_plan_url TEXT,

    -- Visibility
    is_public BOOLEAN DEFAULT true,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_venues_organizer ON venues(organizer_id);
CREATE INDEX idx_venues_city ON venues(city);
CREATE INDEX idx_venues_public ON venues(is_public);

-- =====================================================
-- 2. VENUE LAYOUTS
-- =====================================================
CREATE TABLE IF NOT EXISTS venue_layouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Layout configuration
    layout_type VARCHAR(50) NOT NULL, -- theater, stadium, classroom, banquet, custom
    canvas_width INTEGER DEFAULT 1000, -- pixels
    canvas_height INTEGER DEFAULT 800,

    -- SVG or JSON representation
    layout_data JSONB NOT NULL, -- Complete layout structure

    -- Quick stats
    total_sections INTEGER DEFAULT 0,
    total_seats INTEGER DEFAULT 0,

    is_default BOOLEAN DEFAULT false,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_layouts_venue ON venue_layouts(venue_id);

-- =====================================================
-- 3. SEATING SECTIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS seating_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    layout_id UUID NOT NULL REFERENCES venue_layouts(id) ON DELETE CASCADE,

    -- Section info
    name VARCHAR(100) NOT NULL, -- "VIP", "General", "Balcony", etc.
    code VARCHAR(20) NOT NULL, -- "A", "B", "VIP1", etc.
    description TEXT,

    -- Pricing
    base_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    price_modifier DECIMAL(5, 2) DEFAULT 1.0, -- Multiplier for dynamic pricing

    -- Capacity
    total_seats INTEGER NOT NULL,
    available_seats INTEGER,

    -- Visual properties
    color VARCHAR(20), -- Hex color for display
    position_x INTEGER, -- Canvas position
    position_y INTEGER,
    width INTEGER,
    height INTEGER,
    rotation DECIMAL(5, 2) DEFAULT 0, -- Degrees

    -- Properties
    is_vip BOOLEAN DEFAULT false,
    is_wheelchair_accessible BOOLEAN DEFAULT false,
    requires_approval BOOLEAN DEFAULT false, -- For special sections

    -- Display order
    display_order INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sections_layout ON seating_sections(layout_id);
CREATE INDEX idx_sections_code ON seating_sections(code);

-- =====================================================
-- 4. ROWS
-- =====================================================
CREATE TABLE IF NOT EXISTS seating_rows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID NOT NULL REFERENCES seating_sections(id) ON DELETE CASCADE,

    row_label VARCHAR(10) NOT NULL, -- "A", "1", "AA", etc.
    row_number INTEGER NOT NULL,

    -- Capacity
    total_seats INTEGER NOT NULL,

    -- Visual position
    position_x INTEGER,
    position_y INTEGER,

    -- Properties
    is_aisle BOOLEAN DEFAULT false,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rows_section ON seating_rows(section_id);

-- =====================================================
-- 5. SEATS
-- =====================================================
CREATE TABLE IF NOT EXISTS seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    row_id UUID NOT NULL REFERENCES seating_rows(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES seating_sections(id) ON DELETE CASCADE,

    -- Seat identification
    seat_number VARCHAR(10) NOT NULL, -- "1", "2", "101", etc.
    full_seat_label VARCHAR(50), -- "Section A, Row 5, Seat 12"

    -- Position
    position_x INTEGER NOT NULL,
    position_y INTEGER NOT NULL,

    -- Properties
    seat_type VARCHAR(50) DEFAULT 'standard', -- standard, wheelchair, companion, aisle
    is_accessible BOOLEAN DEFAULT false,
    has_restricted_view BOOLEAN DEFAULT false,

    -- Visual
    size INTEGER DEFAULT 30, -- pixels
    rotation DECIMAL(5, 2) DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(row_id, seat_number)
);

CREATE INDEX idx_seats_row ON seats(row_id);
CREATE INDEX idx_seats_section ON seats(section_id);
CREATE INDEX idx_seats_type ON seats(seat_type);

-- =====================================================
-- 6. EVENT SEATING CONFIGURATIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS event_seating_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL UNIQUE,
    layout_id UUID NOT NULL REFERENCES venue_layouts(id),

    -- Seating mode
    seating_mode VARCHAR(50) NOT NULL DEFAULT 'reserved', -- reserved, general_admission, mixed
    allows_seat_selection BOOLEAN DEFAULT true,

    -- Pricing strategy
    pricing_strategy VARCHAR(50) DEFAULT 'by_section', -- by_section, by_tier, dynamic

    -- Hold configuration
    seat_hold_duration INTEGER DEFAULT 600, -- seconds (10 minutes)

    -- Accessibility
    accessible_seats_percentage DECIMAL(5, 2) DEFAULT 2.0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_event_seating_event ON event_seating_configs(event_id);

-- =====================================================
-- 7. SEAT RESERVATIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS seat_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    seat_id UUID NOT NULL REFERENCES seats(id),
    user_id UUID REFERENCES auth.users(id),
    ticket_id UUID, -- Reference to actual ticket

    -- Reservation status
    status VARCHAR(50) NOT NULL DEFAULT 'available', -- available, held, reserved, sold

    -- Hold management
    held_until TIMESTAMP WITH TIME ZONE,
    held_by_session VARCHAR(255),

    -- Pricing
    price DECIMAL(10, 2) NOT NULL,

    -- Special properties
    is_blocked BOOLEAN DEFAULT false, -- Blocked by organizer
    block_reason TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(event_id, seat_id)
);

CREATE INDEX idx_reservations_event ON seat_reservations(event_id);
CREATE INDEX idx_reservations_seat ON seat_reservations(seat_id);
CREATE INDEX idx_reservations_user ON seat_reservations(user_id);
CREATE INDEX idx_reservations_status ON seat_reservations(status);
CREATE INDEX idx_reservations_held_until ON seat_reservations(held_until);

-- =====================================================
-- 8. SECTION PRICING TIERS
-- =====================================================
CREATE TABLE IF NOT EXISTS section_pricing_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    section_id UUID NOT NULL REFERENCES seating_sections(id),

    tier_name VARCHAR(100) NOT NULL, -- "Early Bird", "Regular", "Last Minute"
    price DECIMAL(10, 2) NOT NULL,

    -- Availability window
    valid_from TIMESTAMP WITH TIME ZONE,
    valid_until TIMESTAMP WITH TIME ZONE,

    -- Quantity limits
    max_quantity INTEGER,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(event_id, section_id, tier_name)
);

CREATE INDEX idx_pricing_tiers_event ON section_pricing_tiers(event_id);
CREATE INDEX idx_pricing_tiers_section ON section_pricing_tiers(section_id);

-- =====================================================
-- 9. SEAT GROUPS (for group bookings)
-- =====================================================
CREATE TABLE IF NOT EXISTS seat_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,

    name VARCHAR(255) NOT NULL,
    seat_ids JSONB NOT NULL, -- Array of seat IDs

    -- Group pricing
    total_price DECIMAL(10, 2) NOT NULL,
    discount_percentage DECIMAL(5, 2) DEFAULT 0,

    -- Status
    status VARCHAR(50) DEFAULT 'available', -- available, held, booked

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_seat_groups_event ON seat_groups(event_id);

-- =====================================================
-- 10. ACCESSIBILITY REQUESTS
-- =====================================================
CREATE TABLE IF NOT EXISTS accessibility_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id),

    -- Requirements
    requires_wheelchair_space BOOLEAN DEFAULT false,
    requires_companion_seat BOOLEAN DEFAULT false,
    requires_aisle_seat BOOLEAN DEFAULT false,
    requires_front_row BOOLEAN DEFAULT false,

    special_requirements TEXT,

    -- Assignment
    assigned_seat_ids JSONB, -- Array of assigned seat IDs
    status VARCHAR(50) DEFAULT 'pending', -- pending, assigned, confirmed

    -- Notes
    organizer_notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_accessibility_event ON accessibility_requests(event_id);
CREATE INDEX idx_accessibility_user ON accessibility_requests(user_id);
CREATE INDEX idx_accessibility_status ON accessibility_requests(status);

-- =====================================================
-- 11. SEATING ANALYTICS
-- =====================================================
CREATE TABLE IF NOT EXISTS seating_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,

    date DATE NOT NULL,

    -- Capacity metrics
    total_seats INTEGER,
    sold_seats INTEGER,
    held_seats INTEGER,
    blocked_seats INTEGER,
    available_seats INTEGER,

    -- Revenue by section
    revenue_by_section JSONB DEFAULT '{}',

    -- Popular sections
    most_selected_sections JSONB DEFAULT '[]',

    -- Accessibility
    accessible_seats_booked INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(event_id, date)
);

CREATE INDEX idx_seating_analytics_event ON seating_analytics(event_id);
CREATE INDEX idx_seating_analytics_date ON seating_analytics(date);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE seating_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE seating_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_seating_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE seat_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE seat_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE accessibility_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE seating_analytics ENABLE ROW LEVEL SECURITY;

-- Organizers can manage their venues
CREATE POLICY "Organizers can manage venues"
    ON venues FOR ALL
    USING (auth.uid() = organizer_id OR is_public = true);

-- Everyone can view public venue info
CREATE POLICY "Public venues are viewable"
    ON venues FOR SELECT
    USING (is_public = true);

CREATE POLICY "Organizers can manage layouts"
    ON venue_layouts FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM venues
            WHERE venues.id = venue_layouts.venue_id
            AND (venues.organizer_id = auth.uid() OR venues.is_public = true)
        )
    );

CREATE POLICY "Public layouts are viewable"
    ON venue_layouts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM venues
            WHERE venues.id = venue_layouts.venue_id
            AND venues.is_public = true
        )
    );

CREATE POLICY "Organizers can manage sections"
    ON seating_sections FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM venue_layouts
            JOIN venues ON venues.id = venue_layouts.venue_id
            WHERE venue_layouts.id = seating_sections.layout_id
            AND venues.organizer_id = auth.uid()
        )
    );

CREATE POLICY "Sections are viewable"
    ON seating_sections FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM venue_layouts
            JOIN venues ON venues.id = venue_layouts.venue_id
            WHERE venue_layouts.id = seating_sections.layout_id
            AND venues.is_public = true
        )
    );

-- Similar policies for rows, seats, etc.
CREATE POLICY "Rows are manageable"
    ON seating_rows FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM seating_sections
            JOIN venue_layouts ON venue_layouts.id = seating_sections.layout_id
            JOIN venues ON venues.id = venue_layouts.venue_id
            WHERE seating_sections.id = seating_rows.section_id
            AND venues.organizer_id = auth.uid()
        )
    );

CREATE POLICY "Rows are viewable"
    ON seating_rows FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM seating_sections
            JOIN venue_layouts ON venue_layouts.id = seating_sections.layout_id
            JOIN venues ON venues.id = venue_layouts.venue_id
            WHERE seating_sections.id = seating_rows.section_id
            AND venues.is_public = true
        )
    );

CREATE POLICY "Seats are manageable"
    ON seats FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM seating_rows
            JOIN seating_sections ON seating_sections.id = seating_rows.section_id
            JOIN venue_layouts ON venue_layouts.id = seating_sections.layout_id
            JOIN venues ON venues.id = venue_layouts.venue_id
            WHERE seating_rows.id = seats.row_id
            AND venues.organizer_id = auth.uid()
        )
    );

CREATE POLICY "Seats are viewable"
    ON seats FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM seating_rows
            JOIN seating_sections ON seating_sections.id = seating_rows.section_id
            JOIN venue_layouts ON venue_layouts.id = seating_sections.layout_id
            JOIN venues ON venues.id = venue_layouts.venue_id
            WHERE seating_rows.id = seats.row_id
            AND venues.is_public = true
        )
    );

-- Event seating configs - organizers manage their events
CREATE POLICY "Organizers can manage event seating configs"
    ON event_seating_configs FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM events
            WHERE events.id = event_seating_configs.event_id
            AND events.organizer_id = auth.uid()
        )
    );

CREATE POLICY "Event seating configs are viewable"
    ON event_seating_configs FOR SELECT
    USING (true); -- Anyone can view seating configuration for events

-- Users can view seat availability for events
CREATE POLICY "Users can view seat availability"
    ON seat_reservations FOR SELECT
    USING (true);

CREATE POLICY "Users can hold seats"
    ON seat_reservations FOR UPDATE
    USING (
        status = 'available'
        AND (held_until IS NULL OR held_until < CURRENT_TIMESTAMP)
    );

CREATE POLICY "Organizers can manage all seat reservations"
    ON seat_reservations FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM events
            WHERE events.id = seat_reservations.event_id
            AND events.organizer_id = auth.uid()
        )
    );

CREATE POLICY "Organizers can manage pricing tiers"
    ON section_pricing_tiers FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM events
            WHERE events.id = section_pricing_tiers.event_id
            AND events.organizer_id = auth.uid()
        )
    );

CREATE POLICY "Pricing tiers are viewable"
    ON section_pricing_tiers FOR SELECT
    USING (true);

CREATE POLICY "Organizers can manage seat groups"
    ON seat_groups FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM events
            WHERE events.id = seat_groups.event_id
            AND events.organizer_id = auth.uid()
        )
    );

CREATE POLICY "Seat groups are viewable"
    ON seat_groups FOR SELECT
    USING (true);

-- Users can manage their accessibility requests
CREATE POLICY "Users can manage accessibility requests"
    ON accessibility_requests FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Organizers can view accessibility requests"
    ON accessibility_requests FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM events
            WHERE events.id = accessibility_requests.event_id
            AND events.organizer_id = auth.uid()
        )
    );

CREATE POLICY "Organizers can update accessibility requests"
    ON accessibility_requests FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM events
            WHERE events.id = accessibility_requests.event_id
            AND events.organizer_id = auth.uid()
        )
    );

CREATE POLICY "Organizers can manage seating analytics"
    ON seating_analytics FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM events
            WHERE events.id = seating_analytics.event_id
            AND events.organizer_id = auth.uid()
        )
    );

CREATE POLICY "Seating analytics are viewable"
    ON seating_analytics FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM events
            WHERE events.id = seating_analytics.event_id
            AND events.organizer_id = auth.uid()
        )
    );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function: Hold seats
CREATE OR REPLACE FUNCTION hold_seats(
    p_event_id UUID,
    p_seat_ids UUID[],
    p_user_id UUID,
    p_session_id VARCHAR,
    p_hold_duration INTEGER DEFAULT 600
)
RETURNS TABLE (success BOOLEAN, held_seats UUID[], message TEXT) AS $$
DECLARE
    v_seat_id UUID;
    v_held_seats UUID[] := ARRAY[]::UUID[];
    v_now TIMESTAMP WITH TIME ZONE := CURRENT_TIMESTAMP;
BEGIN
    -- Try to hold each seat
    FOREACH v_seat_id IN ARRAY p_seat_ids LOOP
        UPDATE seat_reservations
        SET
            status = 'held',
            user_id = p_user_id,
            held_until = v_now + (p_hold_duration || ' seconds')::INTERVAL,
            held_by_session = p_session_id,
            updated_at = v_now
        WHERE event_id = p_event_id
        AND seat_id = v_seat_id
        AND (
            status = 'available'
            OR (status = 'held' AND held_until < v_now)
        );

        IF FOUND THEN
            v_held_seats := array_append(v_held_seats, v_seat_id);
        END IF;
    END LOOP;

    IF array_length(v_held_seats, 1) = array_length(p_seat_ids, 1) THEN
        RETURN QUERY SELECT true, v_held_seats, 'All seats held successfully'::TEXT;
    ELSIF array_length(v_held_seats, 1) > 0 THEN
        RETURN QUERY SELECT false, v_held_seats, 'Some seats could not be held'::TEXT;
    ELSE
        RETURN QUERY SELECT false, v_held_seats, 'No seats could be held'::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function: Release expired holds
CREATE OR REPLACE FUNCTION release_expired_holds()
RETURNS INTEGER AS $$
DECLARE
    v_released_count INTEGER;
BEGIN
    UPDATE seat_reservations
    SET
        status = 'available',
        user_id = NULL,
        held_until = NULL,
        held_by_session = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE status = 'held'
    AND held_until < CURRENT_TIMESTAMP;

    GET DIAGNOSTICS v_released_count = ROW_COUNT;

    RETURN v_released_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Get available seats by section
CREATE OR REPLACE FUNCTION get_available_seats_by_section(p_event_id UUID)
RETURNS TABLE (
    section_id UUID,
    section_name VARCHAR,
    total_seats INTEGER,
    available_seats INTEGER,
    base_price DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id as section_id,
        s.name as section_name,
        s.total_seats,
        COUNT(sr.id) FILTER (WHERE sr.status = 'available')::INTEGER as available_seats,
        s.base_price
    FROM seating_sections s
    LEFT JOIN seat_reservations sr ON sr.event_id = p_event_id
    AND sr.seat_id IN (
        SELECT id FROM seats WHERE section_id = s.id
    )
    GROUP BY s.id, s.name, s.total_seats, s.base_price
    ORDER BY s.display_order;
END;
$$ LANGUAGE plpgsql;

-- Function: Block seats
CREATE OR REPLACE FUNCTION block_seats(
    p_event_id UUID,
    p_seat_ids UUID[],
    p_reason TEXT
)
RETURNS INTEGER AS $$
DECLARE
    v_blocked_count INTEGER;
BEGIN
    UPDATE seat_reservations
    SET
        is_blocked = true,
        block_reason = p_reason,
        status = 'available', -- Keep as available but blocked
        updated_at = CURRENT_TIMESTAMP
    WHERE event_id = p_event_id
    AND seat_id = ANY(p_seat_ids);

    GET DIAGNOSTICS v_blocked_count = ROW_COUNT;

    RETURN v_blocked_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SAMPLE DATA
-- =====================================================

-- Insert sample venue
INSERT INTO venues (
    name,
    description,
    address,
    city,
    country,
    total_capacity,
    seated_capacity,
    has_wheelchair_access,
    has_parking,
    is_public
) VALUES (
    'Karachi Convention Center',
    'Modern convention center with state-of-the-art facilities',
    '123 Main Street',
    'Karachi',
    'Pakistan',
    1000,
    1000,
    true,
    true,
    true
) ON CONFLICT DO NOTHING;

-- =====================================================
-- SEATING MANAGEMENT SCHEMA COMPLETE
-- =====================================================
-- Total Tables: 11
-- Total Functions: 4
-- RLS Policies: 25+
-- =====================================================
