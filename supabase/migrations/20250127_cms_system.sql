-- CMS (Content Management System) Migration
-- Creates tables for managing dynamic content, pages, posts, and announcements

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CMS Content table
CREATE TABLE IF NOT EXISTS cms_content (
  id VARCHAR(255) PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  content_type VARCHAR(50) NOT NULL DEFAULT 'page' CHECK (content_type IN ('page', 'post', 'announcement', 'faq')),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  published_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  seo_title VARCHAR(500),
  seo_description TEXT,
  featured_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CMS Content Versions table (for revision history)
CREATE TABLE IF NOT EXISTS cms_content_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id VARCHAR(255) NOT NULL REFERENCES cms_content(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE(content_id, version)
);

-- CMS Media Assets table (for file management)
CREATE TABLE IF NOT EXISTS cms_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes INTEGER NOT NULL,
  url TEXT NOT NULL,
  alt_text TEXT,
  caption TEXT,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CMS Categories/Tags table (for organizing content)
CREATE TABLE IF NOT EXISTS cms_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES cms_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Junction table for content-category relationships
CREATE TABLE IF NOT EXISTS cms_content_categories (
  content_id VARCHAR(255) NOT NULL REFERENCES cms_content(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES cms_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (content_id, category_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cms_content_slug ON cms_content(slug);
CREATE INDEX IF NOT EXISTS idx_cms_content_status ON cms_content(status);
CREATE INDEX IF NOT EXISTS idx_cms_content_type ON cms_content(content_type);
CREATE INDEX IF NOT EXISTS idx_cms_content_author ON cms_content(author_id);
CREATE INDEX IF NOT EXISTS idx_cms_content_published_at ON cms_content(published_at);
CREATE INDEX IF NOT EXISTS idx_cms_content_tags ON cms_content USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_cms_content_versions_content_id ON cms_content_versions(content_id);
CREATE INDEX IF NOT EXISTS idx_cms_content_versions_version ON cms_content_versions(version);
CREATE INDEX IF NOT EXISTS idx_cms_media_uploaded_by ON cms_media(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_cms_categories_parent ON cms_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_cms_content_categories_content ON cms_content_categories(content_id);
CREATE INDEX IF NOT EXISTS idx_cms_content_categories_category ON cms_content_categories(category_id);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_cms_content_fts ON cms_content
  USING GIN (to_tsvector('english', title || ' ' || coalesce(content, '') || ' ' || coalesce(excerpt, '')));

-- Row Level Security (RLS) policies
ALTER TABLE cms_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_content_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_content_categories ENABLE ROW LEVEL SECURITY;

-- Public read access for published content
CREATE POLICY "Public can read published CMS content" ON cms_content
  FOR SELECT USING (status = 'published');

-- Authenticated users can read all content they have access to
CREATE POLICY "Authenticated users can read CMS content" ON cms_content
  FOR SELECT USING (auth.role() = 'authenticated');

-- Authors and admins can manage their own content
CREATE POLICY "Users can manage their own CMS content" ON cms_content
  FOR ALL USING (
    auth.uid() = author_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'organizer')
    )
  );

-- Admin full access to all content
CREATE POLICY "Admin full access to CMS content" ON cms_content
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Content versions policies
CREATE POLICY "Users can read versions of their content" ON cms_content_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cms_content
      WHERE cms_content.id = cms_content_versions.content_id
      AND (cms_content.author_id = auth.uid() OR
           EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'organizer')))
    )
  );

CREATE POLICY "Users can create versions for their content" ON cms_content_versions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM cms_content
      WHERE cms_content.id = cms_content_versions.content_id
      AND cms_content.author_id = auth.uid()
    )
  );

-- Media policies
CREATE POLICY "Authenticated users can read media" ON cms_media
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage their own media" ON cms_media
  FOR ALL USING (auth.uid() = uploaded_by);

CREATE POLICY "Admin can manage all media" ON cms_media
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Categories policies (public read, admin write)
CREATE POLICY "Public can read categories" ON cms_categories
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage categories" ON cms_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Content-categories junction policies
CREATE POLICY "Users can manage category relationships for their content" ON cms_content_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM cms_content
      WHERE cms_content.id = cms_content_categories.content_id
      AND (cms_content.author_id = auth.uid() OR
           EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'organizer')))
    )
  );

-- Functions for CMS operations

-- Function to get published content by type
CREATE OR REPLACE FUNCTION get_published_cms_content(content_type_filter VARCHAR(50) DEFAULT NULL, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  id VARCHAR(255),
  slug VARCHAR(255),
  title VARCHAR(500),
  excerpt TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  author_name VARCHAR(255),
  tags TEXT[],
  featured_image TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.slug,
    c.title,
    c.excerpt,
    c.published_at,
    p.full_name as author_name,
    c.tags,
    c.featured_image
  FROM cms_content c
  LEFT JOIN profiles p ON c.author_id = p.id
  WHERE c.status = 'published'
    AND (content_type_filter IS NULL OR c.content_type = content_type_filter)
  ORDER BY c.published_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search CMS content
CREATE OR REPLACE FUNCTION search_cms_content(search_query TEXT, content_type_filter VARCHAR(50) DEFAULT NULL, limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
  id VARCHAR(255),
  slug VARCHAR(255),
  title VARCHAR(500),
  excerpt TEXT,
  content_type VARCHAR(50),
  status VARCHAR(50),
  published_at TIMESTAMP WITH TIME ZONE,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.slug,
    c.title,
    c.excerpt,
    c.content_type,
    c.status,
    c.published_at,
    ts_rank_cd(to_tsvector('english', c.title || ' ' || coalesce(c.content, '') || ' ' || coalesce(c.excerpt, '')), plainto_tsquery('english', search_query)) as rank
  FROM cms_content c
  WHERE (content_type_filter IS NULL OR c.content_type = content_type_filter)
    AND to_tsvector('english', c.title || ' ' || coalesce(c.content, '') || ' ' || coalesce(c.excerpt, '')) @@ plainto_tsquery('english', search_query)
  ORDER BY rank DESC, c.updated_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get content with categories
CREATE OR REPLACE FUNCTION get_cms_content_with_categories(content_slug VARCHAR(255))
RETURNS TABLE (
  id VARCHAR(255),
  slug VARCHAR(255),
  title VARCHAR(500),
  content TEXT,
  excerpt TEXT,
  content_type VARCHAR(50),
  published_at TIMESTAMP WITH TIME ZONE,
  author_name VARCHAR(255),
  categories JSONB,
  tags TEXT[],
  metadata JSONB,
  seo_title VARCHAR(500),
  seo_description TEXT,
  featured_image TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.slug,
    c.title,
    c.content,
    c.excerpt,
    c.content_type,
    c.published_at,
    p.full_name as author_name,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', cat.id,
          'name', cat.name,
          'slug', cat.slug
        )
      ) FILTER (WHERE cat.id IS NOT NULL),
      '[]'::jsonb
    ) as categories,
    c.tags,
    c.metadata,
    c.seo_title,
    c.seo_description,
    c.featured_image
  FROM cms_content c
  LEFT JOIN profiles p ON c.author_id = p.id
  LEFT JOIN cms_content_categories cc ON c.id = cc.content_id
  LEFT JOIN cms_categories cat ON cc.category_id = cat.id
  WHERE c.slug = content_slug AND c.status = 'published'
  GROUP BY c.id, c.slug, c.title, c.content, c.excerpt, c.content_type, c.published_at, p.full_name, c.tags, c.metadata, c.seo_title, c.seo_description, c.featured_image;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_cms_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cms_content_updated_at
  BEFORE UPDATE ON cms_content
  FOR EACH ROW EXECUTE FUNCTION update_cms_updated_at_column();

CREATE TRIGGER update_cms_categories_updated_at
  BEFORE UPDATE ON cms_categories
  FOR EACH ROW EXECUTE FUNCTION update_cms_updated_at_column();

-- Insert sample data
INSERT INTO cms_categories (id, name, slug, description) VALUES
  ('550e8400-e29b-41d4-a716-446655440010', 'Announcements', 'announcements', 'Event announcements and news'),
  ('550e8400-e29b-41d4-a716-446655440011', 'Help & FAQ', 'help-faq', 'Frequently asked questions and help articles'),
  ('550e8400-e29b-41d4-a716-446655440012', 'Event Planning', 'event-planning', 'Guides for planning events'),
  ('550e8400-e29b-41d4-a716-446655440013', 'Community', 'community', 'Community news and updates')
ON CONFLICT (id) DO NOTHING;

-- Note: Sample content will be inserted by the application when users create content