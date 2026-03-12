'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import {
  GraduationCap, Users, Trophy, TrendingUp, Award, Star,
  Calendar, MapPin, Target, Zap, Crown, Medal, Flame,
  Building2, BookOpen, Search, Filter, ChevronRight,
  BarChart3, Heart, Sparkles, UserCheck, Clock, Loader2
} from 'lucide-react';

interface University {
  id: string;
  name: string;
  full_name: string;
  city: string;
  logo_url: string;
  tier_id: string;
  tier_name: string;
  rank: number;
  campuses: string[];
  students_active: number;
  events_hosted: number;
  ambassadors_count: number;
  total_attendance: number;
  rating: number;
  joined_date: string;
  achievements: Array<{ text: string }>;
  top_events: Array<{ name: string; date: string; attendees: number }>;
  student_orgs: Array<{ name: string; members: number }>;
}

interface Competition {
  id: string;
  competition_name: string;
  competition_date: string;
  participants_count: number;
  prize_amount: string;
  university: { name: string };
}

interface Tier {
  id: string;
  name: string;
  min_points: number;
  color_gradient: string;
}

export default function UniversityNetworkPage() {
  const [selectedCity, setSelectedCity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'leaderboard'>('grid');
  const [universities, setUniversities] = useState<University[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const cities = ['all', 'Karachi', 'Lahore', 'Islamabad', 'Peshawar', 'Quetta', 'Faisalabad'];

  useEffect(() => {
    fetchUniversities();
  }, [selectedCity]);

  const fetchUniversities = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCity !== 'all') params.append('city', selectedCity);

      const response = await fetch(`/api/showcase/university-network?${params}`);
      const data = await response.json();

      if (response.ok) {
        setUniversities(data.universities || []);
        setTiers(data.tiers || []);
        setCompetitions(data.competitions || []);
        setStats(data.stats || {});
      }
    } catch (error) {
      logger.error('Error fetching universities:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUniversities = universities.filter(uni => {
    const matchesSearch = uni.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         uni.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getTierColor = (tierId: string) => {
    const tier = tiers.find(t => t.id === tierId);
    return tier?.color_gradient || 'from-gray-400 to-gray-600';
  };

  const getTierIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Trophy className="w-6 h-6 text-orange-600" />;
    return <Award className="w-6 h-6 text-blue-500" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-brand-start to-brand-end text-white py-20 px-8">
        <div className="max-w-7xl mx-auto text-center">
          <GraduationCap className="w-16 h-16 mx-auto mb-4 animate-pulse" />
          <h1 className="text-5xl font-bold mb-4">Connecting Campuses</h1>
          <p className="text-xl opacity-90 mb-8">
            Pakistan's largest university network for events and collaboration
          </p>

          {/* Platform Stats */}
          <div className="grid grid-cols-5 gap-6 max-w-5xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <Building2 className="w-8 h-8 mx-auto mb-2" />
              <div className="text-3xl font-bold mb-1">{stats.total_universities || 0}+</div>
              <div className="text-sm opacity-90">Universities</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <Users className="w-8 h-8 mx-auto mb-2" />
              <div className="text-3xl font-bold mb-1">{stats.total_students?.toLocaleString() || 0}+</div>
              <div className="text-sm opacity-90">Active Students</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <Calendar className="w-8 h-8 mx-auto mb-2" />
              <div className="text-3xl font-bold mb-1">{stats.total_events || 0}+</div>
              <div className="text-sm opacity-90">Events Hosted</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <UserCheck className="w-8 h-8 mx-auto mb-2" />
              <div className="text-3xl font-bold mb-1">{stats.total_ambassadors || 0}+</div>
              <div className="text-sm opacity-90">Ambassadors</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <MapPin className="w-8 h-8 mx-auto mb-2" />
              <div className="text-3xl font-bold mb-1">{stats.cities || 0}+</div>
              <div className="text-sm opacity-90">Cities</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and View Toggle */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search universities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
              />
            </div>

            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
            >
              {cities.map(city => (
                <option key={city} value={city}>
                  {city === 'all' ? 'All Cities' : city}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  viewMode === 'grid' ? 'bg-white shadow' : ''
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('leaderboard')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  viewMode === 'leaderboard' ? 'bg-white shadow' : ''
                }`}
              >
                Leaderboard
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          </div>
        )}

        {/* Grid View */}
        {!loading && viewMode === 'grid' && filteredUniversities.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {filteredUniversities.map((uni) => (
              <div
                key={uni.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all group"
              >
                {/* Rank Badge */}
                <div className={`bg-gradient-to-r ${getTierColor(uni.tier_id)} px-4 py-3 flex items-center justify-between`}>
                  <div className="flex items-center gap-2 text-white font-semibold">
                    {getTierIcon(uni.rank)}
                    <span>#{uni.rank} - {uni.tier_name}</span>
                  </div>
                  <div className="flex items-center gap-1 text-white">
                    <Star className="w-4 h-4 fill-white" />
                    <span>{uni.rating}</span>
                  </div>
                </div>

                <div className="p-6">
                  {/* Logo and Info */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                      <img
                        src={uni.logo_url}
                        alt={uni.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-1 group-hover:text-purple-600 transition-colors">
                        {uni.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-1">{uni.full_name}</p>
                      <div className="flex items-center gap-1 text-gray-500 text-sm">
                        <MapPin className="w-4 h-4" />
                        <span>{uni.city}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="text-center bg-blue-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-blue-600">{uni.events_hosted}</div>
                      <div className="text-xs text-gray-600">Events</div>
                    </div>
                    <div className="text-center bg-green-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-green-600">{uni.students_active.toLocaleString()}</div>
                      <div className="text-xs text-gray-600">Students</div>
                    </div>
                    <div className="text-center bg-purple-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-purple-600">{uni.ambassadors_count}</div>
                      <div className="text-xs text-gray-600">Ambassadors</div>
                    </div>
                    <div className="text-center bg-orange-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-orange-600">{uni.total_attendance.toLocaleString()}</div>
                      <div className="text-xs text-gray-600">Attendance</div>
                    </div>
                  </div>

                  {/* Achievements */}
                  {uni.achievements && uni.achievements.length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs font-semibold text-gray-500 mb-2">ACHIEVEMENTS</div>
                      <div className="flex flex-wrap gap-2">
                        {uni.achievements.map((achievement, idx) => (
                          <span key={idx} className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full flex items-center gap-1">
                            <Trophy className="w-3 h-3" />
                            {achievement.text}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Student Organizations */}
                  {uni.student_orgs && uni.student_orgs.length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs font-semibold text-gray-500 mb-2">TOP STUDENT ORGANIZATIONS</div>
                      <div className="space-y-1">
                        {uni.student_orgs.slice(0, 3).map((org, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm bg-gray-50 rounded p-2">
                            <span className="font-medium">{org.name}</span>
                            <span className="text-gray-600">{org.members} members</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* View Profile */}
                  <button className="w-full bg-brand-gradient text-white py-2 rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2">
                    <span>View Campus Profile</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Leaderboard View */}
        {!loading && viewMode === 'leaderboard' && filteredUniversities.length > 0 && (
          <div className="space-y-4 mb-16">
            {filteredUniversities.map((uni) => (
              <div
                key={uni.id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all"
              >
                <div className="flex items-center gap-6">
                  {/* Rank */}
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${getTierColor(uni.tier_id)} flex items-center justify-center flex-shrink-0`}>
                    {uni.rank <= 3 ? (
                      <div className="text-3xl">
                        {uni.rank === 1 ? '🥇' : uni.rank === 2 ? '🥈' : '🥉'}
                      </div>
                    ) : (
                      <div className="text-2xl font-bold text-white">#{uni.rank}</div>
                    )}
                  </div>

                  {/* Logo */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={uni.logo_url}
                      alt={uni.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="text-xl font-bold">{uni.name}</h3>
                        <p className="text-gray-600 text-sm">{uni.full_name} • {uni.city}</p>
                      </div>
                      <div className={`px-4 py-2 bg-gradient-to-r ${getTierColor(uni.tier_id)} text-white rounded-lg font-bold`}>
                        {uni.tier_name}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-5 gap-4">
                      <div className="text-center bg-blue-50 rounded-lg p-3">
                        <div className="text-xl font-bold text-blue-600">{uni.events_hosted}</div>
                        <div className="text-xs text-gray-600">Events</div>
                      </div>
                      <div className="text-center bg-green-50 rounded-lg p-3">
                        <div className="text-xl font-bold text-green-600">{uni.students_active.toLocaleString()}</div>
                        <div className="text-xs text-gray-600">Students</div>
                      </div>
                      <div className="text-center bg-purple-50 rounded-lg p-3">
                        <div className="text-xl font-bold text-purple-600">{uni.ambassadors_count}</div>
                        <div className="text-xs text-gray-600">Ambassadors</div>
                      </div>
                      <div className="text-center bg-orange-50 rounded-lg p-3">
                        <div className="text-xl font-bold text-orange-600">{uni.total_attendance.toLocaleString()}</div>
                        <div className="text-xs text-gray-600">Attendance</div>
                      </div>
                      <div className="text-center bg-yellow-50 rounded-lg p-3">
                        <div className="text-xl font-bold text-yellow-600 flex items-center justify-center gap-1">
                          {uni.rating} <Star className="w-4 h-4 fill-yellow-600" />
                        </div>
                        <div className="text-xs text-gray-600">Rating</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Inter-University Competitions */}
        {!loading && competitions.length > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-8 mb-16">
            <div className="text-center mb-8">
              <Trophy className="w-12 h-12 text-amber-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-4">Recent Championships</h2>
              <p className="text-gray-600">Inter-university competition winners</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {competitions.slice(0, 3).map((comp, idx) => (
                <div key={comp.id} className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="text-4xl mb-4 text-center">
                    {idx === 0 ? '🏆' : idx === 1 ? '🥇' : '🥈'}
                  </div>
                  <h3 className="text-lg font-bold text-center mb-2">{comp.competition_name}</h3>
                  <div className="text-center text-2xl font-bold text-purple-600 mb-2">
                    {comp.university?.name}
                  </div>
                  <div className="text-center text-sm text-gray-600 mb-4">
                    {comp.participants_count} universities • {new Date(comp.competition_date).toLocaleDateString()}
                  </div>
                  <div className="text-center">
                    <span className="inline-block bg-green-100 text-green-700 px-4 py-2 rounded-full font-semibold">
                      Prize: {comp.prize_amount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA Section */}
        <div className="bg-brand-gradient text-white py-20 px-8 rounded-2xl">
          <div className="max-w-4xl mx-auto text-center">
            <Sparkles className="w-16 h-16 mx-auto mb-6" />
            <h2 className="text-4xl font-bold mb-4">Join the Network</h2>
            <p className="text-xl opacity-90 mb-8">
              Connect your university with Pakistan's largest student event network
            </p>

            <button className="bg-white text-purple-600 px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all">
              Register Your University
            </button>

            <div className="mt-8 text-sm opacity-90">
              <p>Contact: universities@fstivo.com | +92-300-CAMPUS</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
