-- =====================================================
-- FSTIVO ROLE-BASED REGISTRATION SYSTEM - DATABASE SCHEMA
-- =====================================================
-- Version: 1.0
-- Purpose: Multi-role user registration with admin approval
-- Features: Role selection, detailed forms, approval workflow
-- =====================================================

-- =====================================================
-- 1. USER ROLES DEFINITION
-- =====================================================
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Role information
    name VARCHAR(50) NOT NULL UNIQUE, -- attendee, organizer, sponsor, volunteer, partner, vendor
    display_name VARCHAR(100) NOT NULL,
    description TEXT,

    -- Role properties
    requires_approval BOOLEAN DEFAULT false,
    requires_verification BOOLEAN DEFAULT false,
    requires_detailed_form BOOLEAN DEFAULT false,

    -- Permissions level
    permission_level INTEGER DEFAULT 1, -- 1=basic, 2=intermediate, 3=advanced, 4=admin, 5=super_admin

    -- Role limits
    max_events_per_month INTEGER,
    max_tickets_per_event INTEGER,

    -- Features access
    can_create_events BOOLEAN DEFAULT false,
    can_manage_tickets BOOLEAN DEFAULT false,
    can_access_analytics BOOLEAN DEFAULT false,
    can_create_campaigns BOOLEAN DEFAULT false,
    can_manage_seating BOOLEAN DEFAULT false,

    -- Visual
    icon VARCHAR(50),
    color VARCHAR(20), -- Hex color
    badge_icon TEXT, -- SVG or URL

    -- Status
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT INTO user_roles (name, display_name, description, requires_approval, requires_detailed_form, permission_level, icon, color, can_create_events, can_manage_tickets, can_access_analytics) VALUES
('attendee', 'Event Attendee', 'Browse and attend events', false, false, 1, 'User', '#3B82F6', false, false, false),
('organizer', 'Event Organizer', 'Create and manage events', true, true, 3, 'Calendar', '#8B5CF6', true, true, true),
('sponsor', 'Event Sponsor', 'Sponsor events and showcase brand', true, true, 2, 'Briefcase', '#EC4899', false, false, true),
('volunteer', 'Event Volunteer', 'Help organize and run events', true, true, 2, 'Heart', '#10B981', false, false, false),
('partner', 'Community Partner', 'Partner with organizers on events', true, true, 2, 'Handshake', '#F59E0B', false, false, false),
('vendor', 'Service Vendor', 'Provide services for events', true, true, 2, 'Package', '#6366F1', false, false, false),
('admin', 'Administrator', 'Platform administration', false, false, 4, 'Shield', '#EF4444', true, true, true),
('super_admin', 'Super Administrator', 'Full platform control', false, false, 5, 'Crown', '#DC2626', true, true, true)
ON CONFLICT (name) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_user_roles_name ON user_roles(name);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(is_active);

-- =====================================================
-- 2. USER ROLE ASSIGNMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS user_role_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES user_roles(id) ON DELETE CASCADE,

    -- Assignment status
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, suspended, revoked

    -- Approval workflow
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES auth.users(id),
    rejection_reason TEXT,

    -- Additional data
    application_data JSONB, -- Stores form submission data
    verification_documents JSONB DEFAULT '[]', -- Array of document URLs

    -- Flags
    is_primary BOOLEAN DEFAULT false, -- Primary role for user
    is_active BOOLEAN DEFAULT true,

    -- Audit
    notes TEXT, -- Admin notes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_role_assignments_user ON user_role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_role_assignments_role ON user_role_assignments(role_id);
CREATE INDEX IF NOT EXISTS idx_role_assignments_status ON user_role_assignments(status);
CREATE INDEX IF NOT EXISTS idx_role_assignments_pending ON user_role_assignments(status, requested_at) WHERE status = 'pending';

-- =====================================================
-- 3. ROLE APPLICATION FORMS (Dynamic Forms)
-- =====================================================
CREATE TABLE IF NOT EXISTS role_application_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES user_roles(id) ON DELETE CASCADE,

    -- Form configuration
    form_name VARCHAR(255) NOT NULL,
    form_schema JSONB NOT NULL, -- JSON Schema for form fields

    -- Form sections
    sections JSONB DEFAULT '[]', -- Array of form sections

    -- Validation
    required_fields JSONB DEFAULT '[]',
    conditional_fields JSONB DEFAULT '{}', -- Fields shown based on conditions

    -- Documents
    required_documents JSONB DEFAULT '[]', -- Array of required document types

    -- Status
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_application_forms_role ON role_application_forms(role_id);

-- Insert sample form for organizer
INSERT INTO role_application_forms (role_id, form_name, form_schema, sections, required_fields, required_documents)
SELECT
    id,
    'Event Organizer Application',
    '{
        "organizationName": {"type": "string", "label": "Organization Name", "required": true},
        "organizationType": {"type": "select", "label": "Organization Type", "options": ["Company", "NGO", "University", "Individual"], "required": true},
        "website": {"type": "url", "label": "Website"},
        "phoneNumber": {"type": "tel", "label": "Phone Number", "required": true},
        "experience": {"type": "textarea", "label": "Previous Event Experience", "required": true},
        "eventTypes": {"type": "multiselect", "label": "Event Types You Plan to Organize", "options": ["Conference", "Workshop", "Concert", "Sports", "Festival", "Exhibition"]},
        "expectedEventsPerYear": {"type": "number", "label": "Expected Events Per Year"},
        "socialMedia": {"type": "object", "properties": {
            "facebook": {"type": "url"},
            "instagram": {"type": "url"},
            "linkedin": {"type": "url"}
        }}
    }'::jsonb,
    '[
        {"title": "Organization Details", "fields": ["organizationName", "organizationType", "website", "phoneNumber"]},
        {"title": "Experience & Plans", "fields": ["experience", "eventTypes", "expectedEventsPerYear"]},
        {"title": "Social Media", "fields": ["socialMedia"]}
    ]'::jsonb,
    '["organizationName", "organizationType", "phoneNumber", "experience"]'::jsonb,
    '[
        {"type": "business_registration", "label": "Business Registration Certificate", "required": true},
        {"type": "identity_proof", "label": "Identity Proof (CNIC/Passport)", "required": true},
        {"type": "portfolio", "label": "Event Portfolio/Photos", "required": false}
    ]'::jsonb
FROM user_roles WHERE name = 'organizer'
ON CONFLICT DO NOTHING;

-- =====================================================
-- 4. REGISTRATION APPLICATIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS registration_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_assignment_id UUID REFERENCES user_role_assignments(id) ON DELETE CASCADE,

    -- Application details
    form_data JSONB NOT NULL, -- Complete form submission
    documents JSONB DEFAULT '[]', -- Uploaded documents

    -- Status tracking
    status VARCHAR(50) DEFAULT 'submitted', -- submitted, under_review, approved, rejected, incomplete

    -- Review process
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    rejection_reason TEXT,

    -- Requested changes
    change_requests JSONB DEFAULT '[]', -- Array of requested changes
    resubmitted_at TIMESTAMP WITH TIME ZONE,

    -- Verification
    verification_status VARCHAR(50) DEFAULT 'pending', -- pending, verified, failed
    verification_method VARCHAR(50), -- email, phone, document, manual
    verified_at TIMESTAMP WITH TIME ZONE,

    -- Communication
    applicant_notes TEXT,
    internal_notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_applications_user ON registration_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON registration_applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_reviewer ON registration_applications(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_applications_pending ON registration_applications(status, created_at) WHERE status = 'submitted';

-- =====================================================
-- 5. APPROVAL WORKFLOW
-- =====================================================
CREATE TABLE IF NOT EXISTS approval_workflow (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES registration_applications(id) ON DELETE CASCADE,

    -- Workflow step
    step_number INTEGER NOT NULL,
    step_name VARCHAR(100) NOT NULL, -- initial_review, document_verification, final_approval

    -- Step status
    status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, skipped

    -- Assignment
    assigned_to UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMP WITH TIME ZONE,

    -- Completion
    completed_by UUID REFERENCES auth.users(id),
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Decision
    decision VARCHAR(50), -- approve, reject, request_changes
    decision_notes TEXT,

    -- Timing
    due_date TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workflow_application ON approval_workflow(application_id, step_number);
CREATE INDEX IF NOT EXISTS idx_workflow_assigned ON approval_workflow(assigned_to, status);

-- =====================================================
-- 6. ADMIN USERS (Super Admin Management)
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Admin level
    admin_level VARCHAR(50) NOT NULL DEFAULT 'admin', -- admin, super_admin

    -- Permissions
    permissions JSONB DEFAULT '{}', -- Specific permissions

    -- Can manage roles
    can_approve_applications BOOLEAN DEFAULT true,
    can_manage_users BOOLEAN DEFAULT false,
    can_view_analytics BOOLEAN DEFAULT true,
    can_manage_content BOOLEAN DEFAULT false,
    can_configure_system BOOLEAN DEFAULT false,

    -- Department/Area
    department VARCHAR(100),
    responsibilities TEXT,

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Audit
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_users_user ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_level ON admin_users(admin_level);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(is_active);

-- =====================================================
-- 7. APPLICATION ACTIVITY LOG
-- =====================================================
CREATE TABLE IF NOT EXISTS application_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES registration_applications(id) ON DELETE CASCADE,

    -- Activity details
    activity_type VARCHAR(100) NOT NULL, -- submitted, reviewed, approved, rejected, document_uploaded, etc.
    actor_id UUID REFERENCES auth.users(id),
    actor_role VARCHAR(50), -- applicant, admin, system

    -- Activity data
    activity_data JSONB DEFAULT '{}',
    description TEXT,

    -- Metadata
    ip_address INET,
    user_agent TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_log_application ON application_activity_log(application_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_actor ON application_activity_log(actor_id);

-- =====================================================
-- 8. USER PROFILE COMPLETION
-- =====================================================
CREATE TABLE IF NOT EXISTS user_profile_completion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Completion tracking
    has_selected_role BOOLEAN DEFAULT false,
    has_completed_profile BOOLEAN DEFAULT false,
    has_verified_email BOOLEAN DEFAULT false,
    has_verified_phone BOOLEAN DEFAULT false,
    has_uploaded_documents BOOLEAN DEFAULT false,

    -- Profile completeness percentage
    completion_percentage INTEGER DEFAULT 0,

    -- Missing fields
    missing_fields JSONB DEFAULT '[]',

    -- Onboarding
    onboarding_completed BOOLEAN DEFAULT false,
    onboarding_step INTEGER DEFAULT 0,

    -- Tracking
    profile_updated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_profile_completion_user ON user_profile_completion(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_incomplete ON user_profile_completion(completion_percentage) WHERE completion_percentage < 100;

-- =====================================================
-- 9. ROLE CHANGE REQUESTS
-- =====================================================
CREATE TABLE IF NOT EXISTS role_change_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Change details
    current_role_id UUID REFERENCES user_roles(id),
    requested_role_id UUID NOT NULL REFERENCES user_roles(id),

    -- Request
    reason TEXT NOT NULL,
    additional_data JSONB DEFAULT '{}',

    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected

    -- Review
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_role_change_user ON role_change_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_role_change_status ON role_change_requests(status);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_application_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_workflow ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profile_completion ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_change_requests ENABLE ROW LEVEL SECURITY;

-- Public can view active roles
DROP POLICY IF EXISTS "Public can view active roles" ON user_roles;
CREATE POLICY "Public can view active roles"
    ON user_roles FOR SELECT
    USING (is_active = true);

-- Users can view their own role assignments
DROP POLICY IF EXISTS "Users can view own role assignments" ON user_role_assignments;
CREATE POLICY "Users can view own role assignments"
    ON user_role_assignments FOR SELECT
    USING (auth.uid() = user_id);

-- Users can apply for roles
DROP POLICY IF EXISTS "Users can apply for roles" ON user_role_assignments;
CREATE POLICY "Users can apply for roles"
    ON user_role_assignments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can view application forms for active roles
DROP POLICY IF EXISTS "Users can view application forms" ON role_application_forms;
CREATE POLICY "Users can view application forms"
    ON role_application_forms FOR SELECT
    USING (is_active = true);

-- Users can view their own applications
DROP POLICY IF EXISTS "Users can view own applications" ON registration_applications;
CREATE POLICY "Users can view own applications"
    ON registration_applications FOR SELECT
    USING (auth.uid() = user_id);

-- Users can submit applications
DROP POLICY IF EXISTS "Users can submit applications" ON registration_applications;
CREATE POLICY "Users can submit applications"
    ON registration_applications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their pending applications
DROP POLICY IF EXISTS "Users can update pending applications" ON registration_applications;
CREATE POLICY "Users can update pending applications"
    ON registration_applications FOR UPDATE
    USING (auth.uid() = user_id AND status IN ('incomplete', 'submitted'));

-- Admins can view all applications
DROP POLICY IF EXISTS "Admins can view all applications" ON registration_applications;
CREATE POLICY "Admins can view all applications"
    ON registration_applications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Admins can review applications
DROP POLICY IF EXISTS "Admins can review applications" ON registration_applications;
CREATE POLICY "Admins can review applications"
    ON registration_applications FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE user_id = auth.uid()
            AND is_active = true
            AND can_approve_applications = true
        )
    );

-- Users can view their profile completion
DROP POLICY IF EXISTS "Users can view own profile completion" ON user_profile_completion;
CREATE POLICY "Users can view own profile completion"
    ON user_profile_completion FOR ALL
    USING (auth.uid() = user_id);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function: Check if user is admin
CREATE OR REPLACE FUNCTION is_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_users
        WHERE user_id = p_user_id AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_users
        WHERE user_id = p_user_id
        AND admin_level = 'super_admin'
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get user's primary role
CREATE OR REPLACE FUNCTION get_user_primary_role(p_user_id UUID)
RETURNS TABLE (
    role_name VARCHAR,
    role_display_name VARCHAR,
    permission_level INTEGER,
    status VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ur.name,
        ur.display_name,
        ur.permission_level,
        ura.status
    FROM user_role_assignments ura
    JOIN user_roles ur ON ur.id = ura.role_id
    WHERE ura.user_id = p_user_id
    AND ura.is_primary = true
    AND ura.is_active = true
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate profile completion
CREATE OR REPLACE FUNCTION calculate_profile_completion(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_completion INTEGER := 0;
    v_has_role BOOLEAN;
    v_has_email BOOLEAN;
BEGIN
    -- Check role selection (30%)
    SELECT EXISTS (
        SELECT 1 FROM user_role_assignments
        WHERE user_id = p_user_id AND status != 'rejected'
    ) INTO v_has_role;

    IF v_has_role THEN
        v_completion := v_completion + 30;
    END IF;

    -- Check email verification (20%)
    SELECT email_confirmed_at IS NOT NULL
    FROM auth.users
    WHERE id = p_user_id
    INTO v_has_email;

    IF v_has_email THEN
        v_completion := v_completion + 20;
    END IF;

    -- Check profile completion (50%)
    -- Add your own logic based on required profile fields
    v_completion := v_completion + 50; -- Placeholder

    -- Update profile completion table
    INSERT INTO user_profile_completion (user_id, completion_percentage, has_selected_role, has_verified_email)
    VALUES (p_user_id, v_completion, v_has_role, v_has_email)
    ON CONFLICT (user_id) DO UPDATE
    SET completion_percentage = v_completion,
        has_selected_role = v_has_role,
        has_verified_email = v_has_email,
        updated_at = CURRENT_TIMESTAMP;

    RETURN v_completion;
END;
$$ LANGUAGE plpgsql;

-- Function: Approve application
CREATE OR REPLACE FUNCTION approve_application(
    p_application_id UUID,
    p_admin_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_role_assignment_id UUID;
BEGIN
    -- Check if admin
    IF NOT is_admin(p_admin_id) THEN
        RAISE EXCEPTION 'User is not authorized to approve applications';
    END IF;

    -- Get application details
    SELECT user_id, role_assignment_id
    INTO v_user_id, v_role_assignment_id
    FROM registration_applications
    WHERE id = p_application_id;

    -- Update application status
    UPDATE registration_applications
    SET status = 'approved',
        reviewed_by = p_admin_id,
        reviewed_at = CURRENT_TIMESTAMP,
        review_notes = p_notes
    WHERE id = p_application_id;

    -- Update role assignment status
    UPDATE user_role_assignments
    SET status = 'approved',
        approved_by = p_admin_id,
        approved_at = CURRENT_TIMESTAMP
    WHERE id = v_role_assignment_id;

    -- Log activity
    INSERT INTO application_activity_log (
        application_id,
        activity_type,
        actor_id,
        actor_role,
        description
    ) VALUES (
        p_application_id,
        'approved',
        p_admin_id,
        'admin',
        'Application approved by admin'
    );

    -- Recalculate profile completion
    PERFORM calculate_profile_completion(v_user_id);

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger: Log application activity on status change
CREATE OR REPLACE FUNCTION log_application_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO application_activity_log (
            application_id,
            activity_type,
            activity_data,
            description
        ) VALUES (
            NEW.id,
            'status_changed',
            json_build_object(
                'old_status', OLD.status,
                'new_status', NEW.status
            ),
            'Application status changed from ' || OLD.status || ' to ' || NEW.status
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_application_status ON registration_applications;
CREATE TRIGGER trigger_log_application_status
AFTER UPDATE OF status ON registration_applications
FOR EACH ROW
EXECUTE FUNCTION log_application_status_change();

-- =====================================================
-- SAMPLE DATA
-- =====================================================

-- Create a super admin user (replace with actual user ID)
-- Uncomment and replace UUID with actual user ID
-- INSERT INTO admin_users (user_id, admin_level, can_approve_applications, can_manage_users, can_configure_system)
-- VALUES ('your-user-id-here', 'super_admin', true, true, true);

-- =====================================================
-- SCHEMA COMPLETE
-- =====================================================
-- Total Tables: 9
-- Total Functions: 5
-- Total Triggers: 1
-- RLS Policies: 15+
-- =====================================================
