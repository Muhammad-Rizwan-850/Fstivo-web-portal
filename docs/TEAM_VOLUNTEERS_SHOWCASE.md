# 👥 Team & Volunteers Showcase - Implementation Guide

## Overview

The Team & Volunteers Showcase displays your core team, volunteer leaderboard with rankings, 5-tier level system, achievement badges, and an appreciation wall. This builds community engagement and recognizes valuable contributors.

**Time to implement:** 3 hours
**Value:** $3,000
**Priority:** HIGH

---

## Files Created

### 1. Database Schema (`database/schemas/team_volunteers_schema.sql`)
```
✅ 12 tables created:
   Team Tables:
   - team_members (core team data)
   - team_member_stats (performance metrics)
   - team_member_achievements (achievements & awards)
   - team_member_skills (skill inventory)
   - team_member_social (social media links)

   Volunteer Tables:
   - volunteer_levels (5-tier system: Diamond to Bronze)
   - volunteers (main volunteer data)
   - volunteer_badges (10 achievement badges)
   - volunteer_badges_earned (badge tracking)
   - volunteer_contributions (point system)
   - volunteer_event_participation (event tracking)
   - appreciation_messages (public testimonials)

✅ RLS policies
✅ Indexes for performance
✅ SQL views: team_members_full, volunteers_full
✅ Functions: get_team_volunteer_stats(), calculate_volunteer_ranks()
✅ Triggers: Auto-level updates
✅ Sample data
```

### 2. API Routes
```
✅ GET  /api/showcase/team-volunteers (list with filters)
✅ POST /api/showcase/team-volunteers (admin create)
✅ PATCH /api/showcase/team-volunteers (admin update)
✅ POST /api/showcase/team-volunteers/appreciation (public submit)
✅ GET  /api/showcase/team-volunteers/appreciation (admin view)
```

### 3. Next.js Page (`app/showcase/team-volunteers/page.tsx`)
```
✅ Three-tab interface (Team, Volunteers, Achievements)
✅ Server-side data fetching
✅ Level-based filtering
✅ Appreciation modal
✅ Email notifications
✅ Responsive design
✅ Real-time rankings
```

---

## Setup Instructions

### Step 1: Run Database Scripts (30 minutes)

1. Open your Supabase SQL Editor
2. Run `database/schemas/team_volunteers_schema.sql`
3. Verify tables:
   ```sql
   SELECT * FROM team_members;
   SELECT * FROM volunteers;
   SELECT * FROM volunteer_levels;
   SELECT * FROM volunteer_badges;
   ```

### Step 2: Access the Page

Navigate to: `http://localhost:3000/showcase/team-volunteers`

---

## Features Included

### 1. Team Members Section
- ✅ Profile cards with images
- ✅ Role & department display
- ✅ Performance stats (events, volunteers managed, hours)
- ✅ Skills inventory
- ✅ Social media links
- ✅ Achievement showcase
- ✅ Appreciation button

### 2. Volunteer Leaderboard
- ✅ Real-time rankings
- ✅ 5-tier level system (Diamond, Platinum, Gold, Silver, Bronze)
- ✅ Point-based progression
- ✅ Level badges with icons
- ✅ Color-coded tiers
- ✅ Stats display (points, events, hours)
- ✅ Earned badges showcase

### 3. Achievement Badges
- ✅ 10 unique badges:
  - 🎯 First Event (50 pts)
  - 🏅 Event Champion (500 pts)
  - 🤝 Team Player (300 pts)
  - 👑 Leader (1000 pts)
  - 📚 Mentor (600 pts)
  - 🌅 Early Bird (200 pts)
  - ⚡ Super Volunteer (1000 pts)
  - 🌐 Networker (400 pts)
  - 💡 Creative Mind (350 pts)
  - ⭐ All Star (5000 pts)
- ✅ Category organization
- ✅ Visual badges with emoji icons
- ✅ Progress tracking

### 4. Appreciation Wall
- ✅ Public testimonials
- ✅ Featured messages
- ✅ Approval workflow
- ✅ Email notifications
- ✅ Sender confirmation
- ✅ Admin moderation

### 5. Level System
- ✅ **Diamond** (5000+ pts)
  - Exclusive leadership opportunities
  - VIP access to all events
  - Priority mentorship
  - Certificate of excellence
  - Letter of recommendation

- ✅ **Platinum** (2000-4999 pts)
  - Leadership opportunities
  - VIP event access
  - Mentorship program
  - Certificate of achievement

- ✅ **Gold** (1000-1999 pts)
  - Team lead opportunities
  - Priority volunteer selection
  - Mentorship access
  - Certificate

- ✅ **Silver** (500-999 pts)
  - Event coordination
  - Skill development
  - Certificate
  - Networking access

- ✅ **Bronze** (0-499 pts)
  - Event participation
  - Basic training
  - Community access
  - Volunteer certificate

---

## API Endpoints

### GET /api/showcase/team-volunteers
Fetch team members, volunteers, and achievements

**Query Parameters:**
- `section` - Filter: 'team', 'volunteers', 'achievements', or 'all'
- `role` - Filter team by role
- `department` - Filter team by department
- `level` - Filter volunteers by level
- `featured` - Show only featured
- `limit` - Results per page
- `offset` - Pagination

**Response:**
```json
{
  "team": [...],
  "volunteers": [...],
  "levels": [...],
  "badges": [...],
  "appreciation": [...],
  "stats": {
    "team": {
      "total_members": 4,
      "departments": {...},
      "total_events_organized": 125,
      "total_volunteers_managed": 1100
    },
    "volunteers": {
      "total_volunteers": 4,
      "total_points": 5800,
      "by_level": {...}
    }
  }
}
```

### POST /api/showcase/team-volunteers/appreciation
Submit appreciation message

**Request:**
```json
{
  "sender_name": "John Doe",
  "sender_email": "john@example.com",
  "volunteer_id": "uuid", // or team_member_id
  "message": "Amazing work!"
}
```

**Response:**
```json
{
  "message": "Appreciation submitted successfully",
  "appreciation": {...}
}
```

---

## Adding New Team Members

### Via SQL
```sql
-- Insert team member
INSERT INTO team_members (
  name, role, department, bio, email, phone,
  location, joined_date, is_featured, display_order
) VALUES (
  'Jane Smith',
  'Marketing Lead',
  'Marketing',
  'Creative marketing professional with 5+ years experience.',
  'jane.smith@fstivo.com',
  '+92-300-9999999',
  'Lahore, Pakistan',
  '2024-01-01',
  true,
  5
) RETURNING id;

-- Insert stats
INSERT INTO team_member_stats (
  team_member_id, events_organized, volunteers_managed,
  hours_contributed, projects_led, mentoring_score
) VALUES (
  'team-member-id',
  20,
  150,
  800.00,
  8,
  85
);

-- Insert skills
INSERT INTO team_member_skills (team_member_id, skill_name, skill_level, years_experience)
VALUES
  ('team-member-id', 'Digital Marketing', 'expert', 6),
  ('team-member-id', 'Content Creation', 'advanced', 4);

-- Insert social links
INSERT INTO team_member_social (team_member_id, platform, url, username)
VALUES
  ('team-member-id', 'linkedin', 'https://linkedin.com/in/janesmith', 'janesmith'),
  ('team-member-id', 'twitter', 'https://twitter.com/janesmith', '@janesmith');
```

---

## Adding New Volunteers

### Via SQL
```sql
-- Insert volunteer
INSERT INTO volunteers (
  name, email, phone, location, bio,
  skills, interests, total_points, is_featured
) VALUES (
  'Ahmad Khan',
  'ahmad.khan@student.com',
  '+92-301-1234567',
  'Karachi, Pakistan',
  'Passionate event volunteer',
  ARRAY['Event Management', 'Public Speaking'],
  ARRAY['Technology', 'Education'],
  100,
  false
) RETURNING id;

-- Award a badge
INSERT INTO volunteer_badges_earned (volunteer_id, badge_id)
VALUES ('volunteer-id', 'first_event');

-- Record event participation
INSERT INTO volunteer_event_participation (
  volunteer_id, event_id, role, hours_contributed,
  points_earned, performance_rating
) VALUES (
  'volunteer-id',
  'event-id',
  'Event Coordinator',
  8.5,
  100,
  5
);

-- This will automatically update their level based on total points
```

---

## Awarding Achievement Badges

### Via SQL
```sql
-- Award badge to volunteer
INSERT INTO volunteer_badges_earned (volunteer_id, badge_id)
VALUES (
  'volunteer-id',
  'event_champion'
);

-- Add contribution points
INSERT INTO volunteer_contributions (
  volunteer_id, contribution_type, points, description
) VALUES (
  'volunteer-id',
  'event_participation',
  50,
  'Volunteered at Tech Summit 2024'
);

-- Update volunteer points (triggers automatic level update)
UPDATE volunteers
SET total_points = total_points + 50
WHERE id = 'volunteer-id';

-- Recalculate ranks
SELECT calculate_volunteer_ranks();
```

---

## Email Configuration

Add to `.env.local`:
```bash
RESEND_API_KEY=your_resend_api_key
```

---

## Volunteer Level Progression

Volunteers automatically level up based on total points:

| Level | Points Required | Benefits |
|-------|----------------|----------|
| 💎 Diamond | 5000+ | Leadership roles, VIP access, priority mentorship, recommendation letters |
| 🏆 Platinum | 2000-4999 | Leadership opportunities, VIP events, mentorship program |
| 🥇 Gold | 1000-1999 | Team lead roles, priority selection, skill workshops |
| 🥈 Silver | 500-999 | Event coordination, skill development, networking |
| 🥉 Bronze | 0-499 | Event participation, basic training, community access |

---

## Achievement Badge Categories

### Milestone Badges
- 🎯 **First Event** - Complete your first event
- 🏅 **Event Champion** - Volunteer at 10+ events
- ⚡ **Super Volunteer** - Complete 50+ hours
- ⭐ **All Star** - Earn all other badges

### Teamwork Badges
- 🤝 **Team Player** - Great teamwork in 5+ events

### Leadership Badges
- 👑 **Leader** - Lead a team of volunteers
- 📚 **Mentor** - Mentor 5+ new volunteers

### Reliability Badges
- 🌅 **Early Bird** - Consistently arrive early

### Skill Badges
- 🌐 **Networker** - Connect with 20+ partners
- 💡 **Creative Mind** - Contribute creative solutions

---

## Managing Appreciation Messages

### View Pending Messages (Admin)
```sql
SELECT
  am.id,
  am.sender_name,
  am.sender_email,
  COALESCE(v.name, tm.name) as recipient_name,
  am.message,
  am.status,
  am.created_at
FROM appreciation_messages am
LEFT JOIN volunteers v ON v.id = am.volunteer_id
LEFT JOIN team_members tm ON tm.id = am.team_member_id
WHERE am.status = 'pending'
ORDER BY am.created_at DESC;
```

### Approve Message
```sql
UPDATE appreciation_messages
SET status = 'approved', is_featured = true
WHERE id = 'message-id';
```

---

## Completion Checklist

- [ ] Database schema created
- [ ] Sample team members added
- [ ] Sample volunteers added
- [ ] API routes working
- [ ] Page displays correctly
- [ ] Team tab functional
- [ ] Volunteers tab functional
- [ ] Achievements tab functional
- [ ] Appreciation form working
- [ ] Email configured
- [ ] Level system tested
- [ ] Badge awarding tested
- [ ] Mobile tested
- [ ] Ranks calculated

**Status:** Ready to implement! 🚀

---

## Next Steps

1. Community Partners Page (2 hours)
2. University Network Hub (3 hours)
3. Impact Dashboard (4 hours)

---

## Maintenance Tips

### Weekly Tasks
- Calculate volunteer ranks: `SELECT calculate_volunteer_ranks();`
- Review pending appreciation messages
- Award badges to deserving volunteers

### Monthly Tasks
- Update team member stats
- Review level progression
- Feature top performers on homepage
- Send recognition emails to top volunteers

### Quarterly Tasks
- Review and adjust level thresholds
- Add new achievement badges
- Update volunteer benefits
- Showcase success stories
