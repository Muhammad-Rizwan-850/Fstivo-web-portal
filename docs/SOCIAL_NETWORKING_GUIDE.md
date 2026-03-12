# Social Networking Hub Guide

## Overview

FSTIVO's Social Networking Hub transforms your event platform into a thriving community where attendees can connect, share experiences, and build meaningful relationships before, during, and after events.

## Features

### 1. User Profiles
Rich networking profiles with:
- **Basic Info**: Display name, bio, avatar, cover image
- **Academic Info**: University, major, graduation year
- **Interests & Skills**: Tag-based system for matching
- **Social Links**: LinkedIn, GitHub, Twitter, personal website
- **Location**: For finding local connections
- **Stats**: Connection count, event attendance

### 2. Social Feed
Dynamic activity feed featuring:
- **Posts**: Share thoughts, experiences, photos
- **Event Tagging**: Associate posts with specific events
- **User Tagging**: Mention and notify other users
- **Likes & Reactions**: Engagement tracking
- **Comments**: Nested conversation threads
- **Shares**: Amplify content across the network
- **Privacy Control**: Public/private post options

### 3. Connection System
Intelligent networking features:
- **Smart Suggestions**: AI-powered connection recommendations
- **Match Scoring**: Algorithm based on:
  - Shared interests (10 points each)
  - Mutual connections (5 points each)
  - Same university/major
  - Geographic proximity
- **Connection Requests**: Send, accept, or decline
- **Connection Strength**: Tracking interaction quality
- **Mutual Connections**: See who you both know

### 4. Messaging System
Direct communication features:
- **Real-time Messaging**: Instant chat with connections
- **Conversation Management**: Organized message threads
- **Read Receipts**: Know when messages are seen
- **Unread Counts**: Track pending messages
- **Message Previews**: Quick view in conversation list

### 5. Notifications
Stay updated with:
- **Connection Requests**: New connection opportunities
- **Message Alerts**: New messages
- **Post Interactions**: Likes, comments on your posts
- **Mentions**: When you're tagged in posts
- **Event Updates**: Changes to events you're attending

### 6. Event Groups
Community-building features:
- **Event-based Groups**: Automatically created for each event
- **Group Discussions**: Dedicated post feeds per event
- **Member Directory**: See all event attendees
- **Group Roles**: Admin, moderator, member
- **Public/Private Groups**: Control visibility

## Database Schema

### Core Tables

#### `user_networking_profiles`
Extended user profiles for networking.
```sql
CREATE TABLE user_networking_profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
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
  event_count INTEGER DEFAULT 0
);
```

#### `social_posts`
User posts in the social feed.
```sql
CREATE TABLE social_posts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  event_id UUID REFERENCES events(id),
  images TEXT[],
  tags TEXT[],
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true
);
```

#### `user_connections`
Connections between users.
```sql
CREATE TABLE user_connections (
  id UUID PRIMARY KEY,
  requester_id UUID REFERENCES auth.users(id),
  accepter_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending',
  connection_strength INTEGER DEFAULT 0,
  mutual_connections INTEGER DEFAULT 0
);
```

#### `messages`
Direct messages between users.
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id),
  receiver_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ
);
```

#### `social_notifications`
User notifications.
```sql
CREATE TABLE social_notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  data JSONB
);
```

See `/database/schemas/social_networking_schema.sql` for complete schema.

## API Endpoints

### Profile API

#### Get Profile
**GET** `/api/network/profile`

Get current user's networking profile or another user's profile.

```typescript
// Get current user's profile
const res = await fetch('/api/network/profile')
const { profile } = await res.json()

// Get another user's profile
const res = await fetch('/api/network/profile?userId=xxx')
const { profile } = await res.json()
```

#### Create/Update Profile
**POST** `/api/network/profile`

Create or update networking profile.

```typescript
const res = await fetch('/api/network/profile', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    display_name: 'John Doe',
    bio: 'Computer Science student',
    university: 'FAST-NUCES',
    major: 'Computer Science',
    graduation_year: 2025,
    interests: ['AI/ML', 'Web Development', 'Startups'],
    skills: ['React', 'Python', 'SQL'],
    location: 'Karachi',
    linkedin_url: 'https://linkedin.com/in/johndoe',
    github_url: 'https://github.com/johndoe'
  })
})
```

### Posts API

#### Get Feed
**GET** `/api/network/posts`

Fetch social feed with pagination.

```typescript
// Get general feed
const res = await fetch('/api/network/posts?limit=20&offset=0')
const { posts, pagination } = await res.json()

// Get specific user's posts
const res = await fetch('/api/network/posts?userId=xxx&limit=10')
```

#### Create Post
**POST** `/api/network/posts`

Create a new social post.

```typescript
const res = await fetch('/api/network/posts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: 'Excited to attend FSTIVO 2025! 🎉',
    event_id: 'xxx', // Optional
    images: ['https://example.com/image.jpg'], // Optional
    tags: ['user-id-1', 'user-id-2'], // Optional: Tagged users
    isPublic: true
  })
})
```

#### Delete Post
**DELETE** `/api/network/posts?id=xxx`

Delete a post (owner only).

```typescript
const res = await fetch('/api/network/posts?id=xxx', {
  method: 'DELETE'
})
```

### Connections API

#### Get Connections/Suggestions
**GET** `/api/network/connections`

Fetch connections, suggestions, or pending requests.

```typescript
// Get suggested connections
const res = await fetch('/api/network/connections?type=suggestions&limit=10')
const { suggestions } = await res.json()

// Get accepted connections
const res = await fetch('/api/network/connections?type=connections')
const { connections } = await res.json()

// Get pending requests
const res = await fetch('/api/network/connections?type=pending')
const { pending } = await res.json()
```

#### Send/Accept/Reject Connection
**POST** `/api/network/connections`

Manage connection requests.

```typescript
// Send connection request
const res = await fetch('/api/network/connections', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'send',
    userId: 'xxx',
    message: 'Hi! I\'d love to connect with you.'
  })
})

// Accept connection request
const res = await fetch('/api/network/connections', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'accept',
    requestId: 'xxx'
  })
})

// Reject connection request
const res = await fetch('/api/network/connections', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'reject',
    requestId: 'xxx'
  })
})
```

### Messages API

#### Get Conversations/Messages
**GET** `/api/network/messages`

Fetch conversations or specific messages.

```typescript
// Get all conversations
const res = await fetch('/api/network/messages')
const { conversations } = await res.json()

// Get messages for a conversation
const res = await fetch('/api/network/messages?conversationId=xxx')
const { messages } = await res.json()
```

#### Send Message
**POST** `/api/network/messages`

Send a new message.

```typescript
const res = await fetch('/api/network/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    receiverId: 'xxx',
    content: 'Hey! How are you?'
  })
})
```

#### Mark Messages as Read
**PUT** `/api/network/messages`

Mark messages as read.

```typescript
const res = await fetch('/api/network/messages', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    conversationId: 'xxx',
    senderId: 'xxx'
  })
})
```

### Notifications API

#### Get Notifications
**GET** `/api/network/notifications`

Fetch user notifications with unread count.

```typescript
const res = await fetch('/api/network/notifications?limit=20&offset=0')
const { notifications, unread_count } = await res.json()
```

#### Mark Notifications as Read
**PUT** `/api/network/notifications`

Mark notifications as read.

```typescript
// Mark specific notification as read
const res = await fetch('/api/network/notifications', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    notificationId: 'xxx'
  })
})

// Mark all as read
const res = await fetch('/api/network/notifications', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    markAll: true
  })
})
```

## Database Functions

### get_suggested_connections

Returns suggested connections with match scores.

```sql
SELECT * FROM get_suggested_connections(
  current_user_id := 'user-uuid',
  limit_count := 10
);
```

**Returns:**
- `user_id`: Suggested user's ID
- `display_name`: User's display name
- `avatar_url`: Profile picture URL
- `university`: University
- `major`: Major field of study
- `location`: Geographic location
- `interests`: Array of interests
- `match_score`: Calculated compatibility score
- `mutual_connections`: Count of mutual connections

**Match Score Calculation:**
```sql
-- 10 points per shared interest
(SELECT COUNT(*) FROM unnest(profile.interests) interest
 WHERE interest = ANY(my_profile.interests)) * 10

-- 5 points per mutual connection
+ COALESCE((SELECT COUNT(*) FROM user_connections
           WHERE status = 'accepted'), 0) * 5
```

## Page Component

The main Social Networking Hub is at `/src/app/network/page.tsx`.

### Features

1. **Multi-tab Interface**
   - Feed: Social posts and activity
   - Connections: Network management
   - Messages: Direct communication
   - Notifications: Updates and alerts
   - Profile: User profile viewing/editing

2. **Real-time Updates**
   - Auto-refresh on actions
   - Live message updates
   - Notification badges

3. **Responsive Design**
   - Mobile-friendly layout
   - Adaptive grid system
   - Touch-optimized interactions

### Usage

```typescript
import SocialNetworkingHub from '@/app/network/page'

// In your app
<SocialNetworkingHub />
```

Or navigate to:
```typescript
router.push('/network')
```

## Setup Instructions

### 1. Run Database Schema

Execute the schema SQL in Supabase SQL Editor:

```sql
-- Copy contents of:
-- /database/schemas/social_networking_schema.sql
```

### 2. Create Initial Profiles

Create networking profiles for existing users:

```sql
INSERT INTO user_networking_profiles (
  user_id,
  display_name,
  bio,
  university,
  major,
  interests
)
SELECT
  id,
  COALESCE(raw_user_meta_data->>'full_name', 'User'),
  'Computer Science student',
  'FAST-NUCES',
  'Computer Science',
  ARRAY['AI/ML', 'Web Development']
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
```

### 3. Configure RLS Policies

Review and adjust Row Level Security policies in the schema for your security requirements.

### 4. Test the API

Test each endpoint to ensure proper setup:

```bash
# Test profile endpoint
curl -X GET http://localhost:3000/api/network/profile

# Test posts endpoint
curl -X GET http://localhost:3000/api/network/posts

# Test connections endpoint
curl -X GET http://localhost:3000/api/network/connections?type=suggestions
```

## User Flow Examples

### New User Onboarding

1. User signs up for FSTIVO
2. Redirected to complete networking profile
3. System suggests connections based on:
   - Same university
   - Shared interests
   - Mutual connections
4. User sends connection requests
5. Connections accepted, networking begins

### Event Networking Flow

1. User registers for an event
2. Added to event group
3. Can see other attendees
4. Posts in event discussion
5. Arranges to meet at event
6. Connects with people met at event

### Post-Event Engagement

1. User posts about event experience
2. Tags event and other attendees
3. Receives likes and comments
4. Continues discussions in messages
5. Plans to meet at future events

## Best Practices

### 1. Privacy & Security
- Always check authentication
- Validate user permissions
- Use RLS policies
- Sanitize user input
- Rate limit API calls

### 2. Performance
- Implement pagination for feeds
- Cache user profiles
- Use indexes for common queries
- Lazy load images
- Debounce search input

### 3. User Experience
- Show loading states
- Handle errors gracefully
- Provide clear feedback
- Support keyboard navigation
- Optimize for mobile

### 4. Content Moderation
- Implement content filtering
- Add report functionality
- Review flagged content
- Enforce community guidelines
- Block abusive users

## Troubleshooting

### Profile Not Creating

```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname LIKE '%user_networking_profiles%';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'user_networking_profiles';
```

### Suggestions Not Showing

```sql
-- Test the function manually
SELECT * FROM get_suggested_connections('user-uuid', 10);

-- Check if interests are set
SELECT user_id, interests FROM user_networking_profiles;
```

### Messages Not Sending

```typescript
// Check conversation creation
const { data, error } = await supabase
  .from('conversations')
  .select('*')
  .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${receiverId}`)

console.log('Conversation:', data, error)
```

## Future Enhancements

### Planned Features
1. **Video Chat**: Integration for video calls
2. **Events Discovery**: Browse and discover events
3. **Job Board**: Career opportunities
4. **Mentorship**: Connect mentors with mentees
5. **Achievements**: Badges and milestones
6. **Analytics**: Network insights and statistics
7. **Advanced Search**: Filter by multiple criteria
8. **Export Data**: Download network data

### Potential Improvements
1. **GraphQL API**: More efficient data fetching
2. **Real-time Sync**: WebSocket integration
3. **AI Matching**: ML-based compatibility scoring
4. **Video Sharing**: Upload and share videos
5. **Voice Messages**: Audio messaging
6. **File Sharing**: Document and media sharing
7. **Calendar Integration**: Schedule meetings
8. **CRM Features**: Manage professional relationships

## Resources

- Database Schema: `/database/schemas/social_networking_schema.sql`
- API Routes: `/src/app/api/network/`
- Page Component: `/src/app/network/page.tsx`
- PWA Integration: `/docs/PWA_GUIDE.md`

## Support

For issues or questions:
1. Check the database schema
2. Review API endpoint documentation
3. Test with Supabase SQL Editor
4. Check browser console for errors
5. Review RLS policies

---

**Version**: 1.0.0
**Last Updated**: 2025
**Maintained By**: FSTIVO Development Team
