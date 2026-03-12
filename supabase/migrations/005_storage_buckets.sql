-- =============================================================================
-- FSTIVO STORAGE BUCKETS & RLS POLICIES
-- =============================================================================
-- Migration: 005_storage_buckets.sql
-- Purpose: Create storage buckets and Row Level Security policies
-- Created: 2024-12-30
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. STORAGE BUCKETS
-- -----------------------------------------------------------------------------

-- Insert storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    -- Event images bucket (cover images, banners, gallery)
    ('event-images', 'event-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
    -- User avatars bucket
    ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    -- Event gallery bucket
    ('event-gallery', 'event-gallery', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
    -- Documents bucket (PDFs, contracts, etc.)
    ('documents', 'documents', false, 20971520, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- -----------------------------------------------------------------------------
-- 2. RLS POLICIES FOR STORAGE
-- -----------------------------------------------------------------------------

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- EVENT-IMAGES BUCKET POLICIES
-- -----------------------------------------------------------------------------

-- Public can view event images
CREATE POLICY "Public can view event images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'event-images');

-- Event organizers can upload to their events
CREATE POLICY "Organizers can upload event images"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'event-images' AND
        auth.role() = 'authenticated'
    );

-- Event organizers can update their event images
CREATE POLICY "Organizers can update event images"
    ON storage.objects FOR UPDATE
    WITH CHECK (
        bucket_id = 'event-images' AND
        auth.role() = 'authenticated'
    );

-- Event organizers can delete their event images
CREATE POLICY "Organizers can delete event images"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'event-images' AND
        auth.role() = 'authenticated'
    );

-- -----------------------------------------------------------------------------
-- AVATARS BUCKET POLICIES
-- -----------------------------------------------------------------------------

-- Public can view avatars
CREATE POLICY "Public can view avatars"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

-- Users can upload their own avatar
CREATE POLICY "Users can upload own avatar"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'avatars' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Users can update their own avatar
CREATE POLICY "Users can update own avatar"
    ON storage.objects FOR UPDATE
    WITH CHECK (
        bucket_id = 'avatars' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'avatars' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- -----------------------------------------------------------------------------
-- EVENT-GALLERY BUCKET POLICIES
-- -----------------------------------------------------------------------------

-- Public can view event gallery images
CREATE POLICY "Public can view event gallery"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'event-gallery');

-- Event organizers can upload to their event gallery
CREATE POLICY "Organizers can upload to event gallery"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'event-gallery' AND
        auth.role() = 'authenticated'
    );

-- Event organizers can update their event gallery
CREATE POLICY "Organizers can update event gallery"
    ON storage.objects FOR UPDATE
    WITH CHECK (
        bucket_id = 'event-gallery' AND
        auth.role() = 'authenticated'
    );

-- Event organizers can delete their event gallery images
CREATE POLICY "Organizers can delete event gallery images"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'event-gallery' AND
        auth.role() = 'authenticated'
    );

-- -----------------------------------------------------------------------------
-- DOCUMENTS BUCKET POLICIES
-- -----------------------------------------------------------------------------

-- Authenticated users can view documents they have access to
CREATE POLICY "Users can view documents"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'documents' AND
        auth.role() = 'authenticated'
    );

-- Users can upload their own documents
CREATE POLICY "Users can upload own documents"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'documents' AND
        auth.role() = 'authenticated'
    );

-- Users can update their own documents
CREATE POLICY "Users can update own documents"
    ON storage.objects FOR UPDATE
    WITH CHECK (
        bucket_id = 'documents' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Users can delete their own documents
CREATE POLICY "Users can delete own documents"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'documents' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- -----------------------------------------------------------------------------
-- 3. HELPER FUNCTIONS
-- -----------------------------------------------------------------------------

-- Function to get file size in MB
CREATE OR REPLACE FUNCTION get_file_size_mb(size_bytes BIGINT)
RETURNS NUMERIC AS $$
BEGIN
    RETURN ROUND((size_bytes::NUMERIC / 1024 / 1024)::NUMERIC, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to check if user owns event
CREATE OR REPLACE FUNCTION user_owns_event(user_id UUID, event_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM events
        WHERE id = event_id AND organizer_id = user_id
    );
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 4. GRANTS
-- -----------------------------------------------------------------------------

-- Grant usage on storage schema
GRANT USAGE ON SCHEMA storage TO authenticated, anon;

-- Grant select on buckets
GRANT SELECT ON storage.buckets TO authenticated, anon;

-- Grant all on storage objects to authenticated
GRANT ALL ON storage.objects TO authenticated;

-- Grant select on storage objects to anon
GRANT SELECT ON storage.objects TO anon;

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
