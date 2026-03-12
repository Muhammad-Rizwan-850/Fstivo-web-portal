'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import {
  Users, Trophy, Award, Heart, Mail, Send, Loader2, X,
  Building2, Calendar, MapPin, ExternalLink, Linkedin,
  Github, Twitter, Star, Target, Zap, Medal, Crown,
  TrendingUp, Shield, Sparkles, ChevronRight
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  department: string;
  bio: string;
  profile_image_url: string;
  email?: string;
  phone?: string;
  location?: string;
  joined_date: string;
  events_organized: number;
  volunteers_managed: number;
  hours_contributed: number;
  projects_led: number;
  mentoring_score: number;
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    date: string;
    is_featured: boolean;
  }>;
  skills: Array<{
    skill_name: string;
    skill_level: string;
    years_experience: number;
  }>;
  social_links: Array<{
    platform: string;
    url: string;
    username: string;
  }>;
}

interface Volunteer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  profile_image_url: string;
  bio: string;
  level_id: string;
  level_name: string;
  level_icon: string;
  level_color: string;
  total_points: number;
  rank_position: number;
  total_hours: number;
  events_participated: number;
  badges: Array<{
    id: string;
    name: string;
    description: string;
    icon_emoji: string;
    color: string;
    category: string;
    earned_date: string;
  }>;
}

interface VolunteerLevel {
  id: string;
  name: string;
  min_points: number;
  max_points: number;
  color_gradient: string;
  icon_emoji: string;
  benefits: string[];
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon_emoji: string;
  color: string;
  category: string;
}

type TabType = 'team' | 'volunteers' | 'achievements';

export default function TeamVolunteersPage() {
  const [activeTab, setActiveTab] = useState<TabType>('team');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [appreciationModalOpen, setAppreciationModalOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<{id: string, name: string, type: 'volunteer' | 'team'} | null>(null);
  const [appreciationForm, setAppreciationForm] = useState({
    sender_name: '',
    sender_email: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab, selectedLevel]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('section', activeTab);

      if (activeTab === 'volunteers' && selectedLevel !== 'all') {
        params.append('level', selectedLevel);
      }

      const response = await fetch(`/api/showcase/team-volunteers?${params}`);
      const result = await response.json();

      if (response.ok) {
        setData(result);
      }
    } catch (error) {
      logger.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAppreciationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipient) return;

    setSubmitting(true);

    try {
      const response = await fetch('/api/showcase/team-volunteers/appreciation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...appreciationForm,
          [selectedRecipient.type === 'volunteer' ? 'volunteer_id' : 'team_member_id']: selectedRecipient.id
        })
      });

      if (response.ok) {
        alert('Thank you for your appreciation!');
        setAppreciationModalOpen(false);
        setAppreciationForm({ sender_name: '', sender_email: '', message: '' });
        setSelectedRecipient(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to submit appreciation');
      }
    } catch (error) {
      logger.error('Error submitting appreciation:', error);
      alert('Failed to submit appreciation');
    } finally {
      setSubmitting(false);
    }
  };

  const getLevelColor = (levelId: string) => {
    const colors: any = {
      diamond: 'bg-gradient-to-r from-cyan-400 to-blue-600',
      platinum: 'bg-gradient-to-r from-slate-300 to-slate-500',
      gold: 'bg-gradient-to-r from-yellow-300 to-yellow-600',
      silver: 'bg-gradient-to-r from-gray-300 to-gray-500',
      bronze: 'bg-gradient-to-r from-orange-300 to-orange-600'
    };
    return colors[levelId] || colors.bronze;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="bg-brand-gradient text-white py-20 px-8">
        <div className="max-w-7xl mx-auto text-center">
          <Users className="w-16 h-16 mx-auto mb-4 animate-pulse" />
          <h1 className="text-5xl font-bold mb-4">Meet Our Team & Volunteers</h1>
          <p className="text-xl opacity-90 mb-8">
            The passionate people making FSTIVO possible
          </p>

          {/* Platform Stats */}
          <div className="grid grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <Building2 className="w-8 h-8 mx-auto mb-2" />
              <div className="text-3xl font-bold mb-1">{data?.stats?.team?.total_members || 0}</div>
              <div className="text-sm opacity-90">Team Members</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <Users className="w-8 h-8 mx-auto mb-2" />
              <div className="text-3xl font-bold mb-1">{data?.stats?.volunteers?.total_volunteers || 0}+</div>
              <div className="text-sm opacity-90">Volunteers</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <Calendar className="w-8 h-8 mx-auto mb-2" />
              <div className="text-3xl font-bold mb-1">{data?.stats?.team?.total_events_organized || 0}+</div>
              <div className="text-sm opacity-90">Events Organized</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <Award className="w-8 h-8 mx-auto mb-2" />
              <div className="text-3xl font-bold mb-1">{data?.stats?.achievements?.badges_earned || 0}</div>
              <div className="text-sm opacity-90">Badges Earned</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex gap-4 mb-8 border-b">
          <button
            onClick={() => { setActiveTab('team'); setSelectedLevel('all'); }}
            className={`px-6 py-3 font-semibold transition-all border-b-2 ${
              activeTab === 'team'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-purple-600'
            }`}
          >
            <Building2 className="w-5 h-5 inline mr-2" />
            Team ({data?.team?.length || 0})
          </button>
          <button
            onClick={() => { setActiveTab('volunteers'); setSelectedLevel('all'); }}
            className={`px-6 py-3 font-semibold transition-all border-b-2 ${
              activeTab === 'volunteers'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-purple-600'
            }`}
          >
            <Users className="w-5 h-5 inline mr-2" />
            Volunteers ({data?.volunteers?.length || 0})
          </button>
          <button
            onClick={() => { setActiveTab('achievements'); }}
            className={`px-6 py-3 font-semibold transition-all border-b-2 ${
              activeTab === 'achievements'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-purple-600'
            }`}
          >
            <Trophy className="w-5 h-5 inline mr-2" />
            Achievements ({data?.badges?.length || 0})
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          </div>
        )}

        {/* Team Members Tab */}
        {!loading && activeTab === 'team' && data?.team && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {data.team.map((member: TeamMember) => (
              <div
                key={member.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all"
              >
                {/* Header */}
                <div className="bg-brand-gradient px-6 py-4">
                  <h3 className="text-xl font-bold text-white">{member.name}</h3>
                  <p className="text-purple-100">{member.role}</p>
                  {member.department && (
                    <span className="inline-block bg-white/20 px-3 py-1 rounded-full text-white text-sm mt-2">
                      {member.department}
                    </span>
                  )}
                </div>

                <div className="p-6">
                  {/* Profile */}
                  {member.profile_image_url && (
                    <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 border-4 border-purple-100">
                      <img
                        src={member.profile_image_url}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <p className="text-gray-600 text-sm text-center mb-4">{member.bio}</p>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center bg-purple-50 rounded-lg p-2">
                      <div className="font-bold text-purple-600">{member.events_organized}</div>
                      <div className="text-xs text-gray-600">Events</div>
                    </div>
                    <div className="text-center bg-blue-50 rounded-lg p-2">
                      <div className="font-bold text-blue-600">{member.volunteers_managed}</div>
                      <div className="text-xs text-gray-600">Volunteers</div>
                    </div>
                    <div className="text-center bg-green-50 rounded-lg p-2">
                      <div className="font-bold text-green-600">{Math.floor(member.hours_contributed)}h</div>
                      <div className="text-xs text-gray-600">Hours</div>
                    </div>
                  </div>

                  {/* Skills */}
                  {member.skills && member.skills.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-sm mb-2">Skills</h4>
                      <div className="flex flex-wrap gap-1">
                        {member.skills.slice(0, 3).map((skill, idx) => (
                          <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                            {skill.skill_name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Social Links */}
                  {member.social_links && member.social_links.length > 0 && (
                    <div className="flex gap-2 mb-4">
                      {member.social_links.map((social, idx) => (
                        <a
                          key={idx}
                          href={social.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-purple-600"
                        >
                          {social.platform === 'linkedin' && <Linkedin className="w-5 h-5" />}
                          {social.platform === 'github' && <Github className="w-5 h-5" />}
                          {social.platform === 'twitter' && <Twitter className="w-5 h-5" />}
                        </a>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setSelectedRecipient({ id: member.id, name: member.name, type: 'team' });
                      setAppreciationModalOpen(true);
                    }}
                    className="w-full bg-brand-gradient text-white py-2 rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Heart className="w-4 h-4" />
                    Appreciate
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Volunteers Tab */}
        {!loading && activeTab === 'volunteers' && (
          <>
            {/* Level Filter */}
            <div className="flex items-center justify-center gap-4 mb-8 flex-wrap">
              <button
                onClick={() => setSelectedLevel('all')}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                  selectedLevel === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Levels ({data?.volunteers?.length || 0})
              </button>
              {data?.levels?.map((level: VolunteerLevel) => {
                const count = data.volunteers?.filter((v: Volunteer) => v.level_id === level.id).length || 0;
                return (
                  <button
                    key={level.id}
                    onClick={() => setSelectedLevel(level.id)}
                    className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                      selectedLevel === level.id
                        ? 'bg-gradient-to-r ' + level.color_gradient + ' text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {level.icon_emoji} {level.name} ({count})
                  </button>
                );
              })}
            </div>

            {/* Leaderboard */}
            <div className="space-y-4">
              {data?.volunteers?.map((volunteer: Volunteer, index: number) => (
                <div
                  key={volunteer.id}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all border-2 border-transparent hover:border-purple-200"
                >
                  <div className="flex items-center gap-6">
                    {/* Rank */}
                    <div className="flex-shrink-0">
                      {volunteer.rank_position <= 3 ? (
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                          volunteer.rank_position === 1 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                          volunteer.rank_position === 2 ? 'bg-gradient-to-r from-gray-300 to-gray-500' :
                          'bg-gradient-to-r from-orange-400 to-orange-600'
                        }`}>
                          <Medal className="w-6 h-6" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600">
                          #{volunteer.rank_position}
                        </div>
                      )}
                    </div>

                    {/* Profile */}
                    {volunteer.profile_image_url && (
                      <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                        <img
                          src={volunteer.profile_image_url}
                          alt={volunteer.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold">{volunteer.name}</h3>
                        <div className={`px-2 py-0.5 rounded-full text-xs text-white ${getLevelColor(volunteer.level_id)}`}>
                          {volunteer.level_icon} {volunteer.level_name}
                        </div>
                      </div>
                      {volunteer.bio && (
                        <p className="text-sm text-gray-600 mb-2">{volunteer.bio}</p>
                      )}

                      {/* Stats */}
                      <div className="flex gap-4 text-sm">
                        <div className="flex items-center gap-1 text-purple-600">
                          <Star className="w-4 h-4" />
                          <span className="font-semibold">{volunteer.total_points} pts</span>
                        </div>
                        <div className="flex items-center gap-1 text-blue-600">
                          <Calendar className="w-4 h-4" />
                          <span>{volunteer.events_participated} events</span>
                        </div>
                        <div className="flex items-center gap-1 text-green-600">
                          <Target className="w-4 h-4" />
                          <span>{Math.floor(volunteer.total_hours)}h</span>
                        </div>
                      </div>

                      {/* Badges */}
                      {volunteer.badges && volunteer.badges.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {volunteer.badges.slice(0, 5).map((badge, idx) => (
                            <div
                              key={idx}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                              style={{ backgroundColor: badge.color + '20' }}
                              title={badge.name}
                            >
                              {badge.icon_emoji}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <button
                      onClick={() => {
                        setSelectedRecipient({ id: volunteer.id, name: volunteer.name, type: 'volunteer' });
                        setAppreciationModalOpen(true);
                      }}
                      className="bg-brand-gradient text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all flex items-center gap-2 flex-shrink-0"
                    >
                      <Heart className="w-4 h-4" />
                      Appreciate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Achievements Tab */}
        {!loading && activeTab === 'achievements' && data?.badges && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.badges.map((badge: Badge) => (
              <div
                key={badge.id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all border-2"
                style={{ borderColor: badge.color }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                    style={{ backgroundColor: badge.color + '20' }}
                  >
                    {badge.icon_emoji}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{badge.name}</h3>
                    <span className="text-sm text-gray-600">{badge.category}</span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm">{badge.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Appreciation Modal */}
      {appreciationModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-8 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setAppreciationModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center mb-6">
              <Heart className="w-16 h-16 text-purple-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Show Appreciation</h2>
              <p className="text-gray-600">
                Share your gratitude for {selectedRecipient?.name}
              </p>
            </div>

            <form onSubmit={handleAppreciationSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Your Name *</label>
                <input
                  type="text"
                  required
                  value={appreciationForm.sender_name}
                  onChange={(e) => setAppreciationForm({...appreciationForm, sender_name: e.target.value})}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Your Email</label>
                <input
                  type="email"
                  value={appreciationForm.sender_email}
                  onChange={(e) => setAppreciationForm({...appreciationForm, sender_email: e.target.value})}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Your Message *</label>
                <textarea
                  rows={5}
                  required
                  value={appreciationForm.message}
                  onChange={(e) => setAppreciationForm({...appreciationForm, message: e.target.value})}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                  placeholder="Share your appreciation..."
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-brand-gradient text-white py-3 rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 font-semibold disabled:opacity-50"
              >
                {submitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</>
                ) : (
                  <><Send className="w-5 h-5" /> Send Appreciation</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
