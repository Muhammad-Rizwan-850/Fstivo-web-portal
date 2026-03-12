-- Social Networking Hub Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- SOCIAL NETWORKING TABLES
-- ==========================================

-- Create user_profiles table (extended profiles for networking)
CREATE TABLE IF NOT EXISTS user_networking_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  cover_image_url TEXT,
  university TEXT,
  major TEXT,
  graduation_year INTEGER,
  interests TEXT[],
  skills TEXT[],
  location TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  twitter_url TEXT,
  website_url TEXT,
  is_profile_complete BOOLEAN DEFAULT false,
  connection_count INTEGER DEFAULT 0,
  event_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_connections table (friend/follow system)
CREATE TABLE IF NOT EXISTS user_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  accepter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
  connection_strength INTEGER DEFAULT 0, -- Based on interactions
  mutual_connections INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, accepter_id)
);

-- Create social_posts table
CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  images TEXT[], -- Array of image URLs
  tags TEXT[], -- Array of tagged user IDs
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create post_likes table
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Create post_comments table
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create post_shares table
CREATE TABLE IF NOT EXISTS post_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  share_type TEXT DEFAULT 'post', -- 'post', 'event', 'profile'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create conversations table (for grouping messages)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  messages_count INTEGER DEFAULT 0,
  unread_count_p1 INTEGER DEFAULT 0,
  unread_count_p2 INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant_1_id, participant_2_id)
);

-- Create event_groups table
CREATE TABLE IF NOT EXISTS event_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  group_image_url TEXT,
  is_public BOOLEAN DEFAULT true,
  member_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES event_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Create group_posts table
CREATE TABLE IF NOT EXISTS group_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES event_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS social_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'connection_request', 'post_like', 'comment', 'message', 'event_invite', etc.
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  data JSONB, -- Additional data
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create connection_requests table (explicit tracking)
CREATE TABLE IF NOT EXISTS connection_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, receiver_id)
);

-- ==========================================
-- INDEXES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_user_networking_profiles_user ON user_networking_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_networking_profiles_university ON user_networking_profiles(university);
CREATE INDEX IF NOT EXISTS idx_user_networking_profiles_location ON user_networking_profiles(location);
CREATE INDEX IF NOT EXISTS idx_user_networking_profiles_interests ON user_networking_profiles USING GIN(interests);

CREATE INDEX IF NOT EXISTS idx_user_connections_requester ON user_connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_accepter ON user_connections(accepter_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_status ON user_connections(status);

CREATE INDEX IF NOT EXISTS idx_social_posts_user ON social_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_event ON social_posts(event_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_created ON social_posts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_post_likes_post ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user ON post_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user ON post_comments(user_id);

CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_p1 ON conversations(participant_1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_p2 ON conversations(participant_2_id);

CREATE INDEX IF NOT EXISTS idx_event_groups_event ON event_groups(event_id);
CREATE INDEX IF NOT EXISTS idx_event_groups_public ON event_groups(is_public);

CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);

CREATE INDEX IF NOT EXISTS idx_social_notifications_user ON social_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_social_notifications_read ON social_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_social_notifications_created ON social_notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_connection_requests_requester ON connection_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_receiver ON connection_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_status ON connection_requests(status);

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE user_networking_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;

-- Public read policies for public posts
CREATE POLICY "Anyone can view public posts" ON social_posts FOR SELECT USING (is_public = true);
CREATE POLICY "Anyone can view post likes" ON post_likes FOR SELECT USING (true);
CREATE POLICY "Anyone can view post comments" ON post_comments FOR SELECT USING (true);

-- Users can view their own data
CREATE POLICY "Users can view own profile" ON user_networking_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own profile" ON user_networking_profiles FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can view own connections" ON user_connections FOR SELECT USING (requester_id = auth.uid() OR accepter_id = auth.uid());

CREATE POLICY "Users can view own messages" ON messages FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());
CREATE POLICY "Users can create messages" ON messages FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can view own conversations" ON conversations FOR SELECT USING (participant_1_id = auth.uid() OR participant_2_id = auth.uid());

CREATE POLICY "Users can view own notifications" ON social_notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can mark notifications read" ON social_notifications FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can view public groups" ON event_groups FOR SELECT USING (is_public = true);
CREATE POLICY "Users can view group members" ON group_members FOR SELECT USING (true);

CREATE POLICY "Users can manage connection requests" ON connection_requests FOR ALL USING (
  requester_id = auth.uid() OR receiver_id = auth.uid()
);

-- ==========================================
-- FUNCTIONS
-- ==========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS user_networking_profiles_updated_at ON user_networking_profiles;
CREATE TRIGGER user_networking_profiles_updated_at
  BEFORE UPDATE ON user_networking_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS user_connections_updated_at ON user_connections;
CREATE TRIGGER user_connections_updated_at
  BEFORE UPDATE ON user_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS social_posts_updated_at ON social_posts;
CREATE TRIGGER social_posts_updated_at
  BEFORE UPDATE ON social_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS messages_updated_at ON messages;
CREATE TRIGGER messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS conversations_updated_at ON conversations;
CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS event_groups_updated_at ON event_groups;
CREATE TRIGGER event_groups_updated_at
  BEFORE UPDATE ON event_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS connection_requests_updated_at ON connection_requests;
CREATE TRIGGER connection_requests_updated_at
  BEFORE UPDATE ON connection_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to get suggested connections
CREATE OR REPLACE FUNCTION get_suggested_connections(
  current_user_id UUID,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  university TEXT,
  major TEXT,
  location TEXT,
  interests TEXT[],
  match_score INTEGER,
  mutual_connections INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.user_id,
    p.display_name,
    p.avatar_url,
    p.university,
    p.major,
    p.location,
    p.interests,
    -- Calculate match score based on shared interests
    CASE
      WHEN p.interests && p.interests <> '{}' THEN
        (SELECT COUNT(*) FROM unnest(p.interests) interest
         WHERE interest = ANY(my_profile.interests)) * 10
      ELSE 0
    END +
    -- Add points for mutual connections
    COALESCE((SELECT COUNT(*) FROM user_connections
              WHERE (requester_id = current_user_id AND accepter_id = p.user_id)
                 OR (requester_id = p.user_id AND accepter_id = current_user_id)
              AND status = 'accepted'), 0) * 5
    AS match_score,
    COALESCE((SELECT COUNT(*) FROM user_connections
              WHERE (requester_id = current_user_id AND accepter_id = p.user_id)
                 OR (requester_id = p.user_id AND accepter_id = current_user_id)
              AND status = 'accepted'), 0) AS mutual_connections
  FROM user_networking_profiles p
  CROSS JOIN user_networking_profiles my_profile
  WHERE my_profile.user_id = current_user_id
    AND p.user_id != current_user_id
    AND NOT EXISTS (
      SELECT 1 FROM user_connections
      WHERE ((requester_id = current_user_id AND accepter_id = p.user_id)
          OR (requester_id = p.user_id AND accepter_id = current_user_id))
        AND status IN ('accepted', 'pending')
    )
  ORDER BY match_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_suggested_connections(UUID, INTEGER) TO authenticated;

-- ==========================================
-- SAMPLE DATA
-- ==========================================

-- Insert sample networking profiles (you would typically create these from existing users)
-- This is just an example structure
INSERT INTO user_networking_profiles (user_id, display_name, bio, university, major, location, interests)
SELECT
  id,
  COALESCE(raw_user_meta_data->>'full_name', 'User') as display_name,
  'Computer Science student passionate about tech',
  'FAST-NUCES',
  'Computer Science',
  'Karachi',
  ARRAY['AI/ML', 'Web Development', 'Startups']
FROM auth.users
WHERE id IN (
  -- Replace with actual user IDs from your system
  SELECT id FROM auth.users LIMIT 3
)
ON CONFLICT (user_id) DO NOTHING;
