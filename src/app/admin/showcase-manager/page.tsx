'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import {
  Calendar, Handshake, Users, Heart, GraduationCap,
  Plus, Edit, Trash2, Save, X, Search, Filter,
  Upload, Image as ImageIcon, FileText, Award, Star, CheckCircle,
  Loader2
} from 'lucide-react';

// Types
interface Stats {
  total: number;
  active: number;
  pending: number;
}

interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  attendees_count?: number;
  rating?: number;
  status: 'published' | 'draft' | 'archived';
}

interface Sponsor {
  id: string;
  name: string;
  tier: string;
  since: string;
  events_count?: number;
  contribution?: string;
  status: 'active' | 'inactive' | 'pending';
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'inactive';
}

interface Volunteer {
  id: string;
  name: string;
  hours: number;
  rank?: number;
  status: 'active' | 'inactive';
}

interface Partner {
  id: string;
  name: string;
  partnership_level: string;
  since_year?: number;
  status: 'active' | 'inactive';
}

interface University {
  id: string;
  name: string;
  tier_id?: string;
  rank?: number;
  students_active?: number;
  events_hosted?: number;
  status: 'active' | 'inactive';
}

type SectionType = 'dashboard' | 'events' | 'sponsors' | 'team' | 'volunteers' | 'partners' | 'universities';

export default function AdminShowcaseManager() {
  const [activeSection, setActiveSection] = useState<SectionType>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Data states
  const [stats, setStats] = useState<Record<string, Stats>>({});
  const [events, setEvents] = useState<Event[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);

  const sections = [
    { id: 'dashboard' as SectionType, name: 'Dashboard', icon: <Award className="w-5 h-5" /> },
    { id: 'events' as SectionType, name: 'Past Events', icon: <Calendar className="w-5 h-5" /> },
    { id: 'sponsors' as SectionType, name: 'Sponsors', icon: <Handshake className="w-5 h-5" /> },
    { id: 'team' as SectionType, name: 'Team Members', icon: <Users className="w-5 h-5" /> },
    { id: 'volunteers' as SectionType, name: 'Volunteers', icon: <Heart className="w-5 h-5" /> },
    { id: 'partners' as SectionType, name: 'Community Partners', icon: <Heart className="w-5 h-5" /> },
    { id: 'universities' as SectionType, name: 'Universities', icon: <GraduationCap className="w-5 h-5" /> }
  ];

  // Fetch data based on active section
  useEffect(() => {
    fetchData();
  }, [activeSection]);

  const fetchData = async () => {
    setLoading(true);
    try {
      switch (activeSection) {
        case 'dashboard':
          await fetchStats();
          break;
        case 'events':
          await fetchEvents();
          break;
        case 'sponsors':
          await fetchSponsors();
          break;
        case 'team':
          await fetchTeam();
          break;
        case 'volunteers':
          await fetchVolunteers();
          break;
        case 'partners':
          await fetchPartners();
          break;
        case 'universities':
          await fetchUniversities();
          break;
      }
    } catch (error) {
      logger.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    const response = await fetch('/api/admin/showcase/stats');
    const data = await response.json();
    setStats(data.stats || {});
  };

  const fetchEvents = async () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (statusFilter) params.append('status', statusFilter);

    const response = await fetch(`/api/admin/showcase/events?${params}`);
    const data = await response.json();
    setEvents(data.events || []);
  };

  const fetchSponsors = async () => {
    const response = await fetch('/api/admin/showcase/sponsors');
    const data = await response.json();
    setSponsors(data.sponsors || []);
  };

  const fetchTeam = async () => {
    const response = await fetch('/api/admin/showcase/team');
    const data = await response.json();
    setTeam(data.team || []);
  };

  const fetchVolunteers = async () => {
    const response = await fetch('/api/admin/showcase/volunteers');
    const data = await response.json();
    setVolunteers(data.volunteers || []);
  };

  const fetchPartners = async () => {
    const response = await fetch('/api/admin/showcase/partners');
    const data = await response.json();
    setPartners(data.partners || []);
  };

  const fetchUniversities = async () => {
    const response = await fetch('/api/admin/showcase/universities');
    const data = await response.json();
    setUniversities(data.universities || []);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    setLoading(true);
    try {
      const endpoint = `/api/admin/showcase/${activeSection}`;
      const response = await fetch(`${endpoint}?id=${id}`, { method: 'DELETE' });

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      logger.error('Error deleting item:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      platinum: 'bg-slate-100 text-slate-700',
      gold: 'bg-yellow-100 text-yellow-700',
      silver: 'bg-gray-100 text-gray-700',
      bronze: 'bg-orange-100 text-orange-700',
      strategic: 'bg-purple-100 text-purple-700',
      diamond: 'bg-cyan-100 text-cyan-700'
    };
    return colors[tier.toLowerCase()] || 'bg-gray-100 text-gray-700';
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Showcase Dashboard</h2>
        <div className="text-sm text-gray-500">Last updated: Just now</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(stats).map(([key, value]) => (
          <div key={key} className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-700 capitalize">{key}</h3>
              <button
                onClick={() => setActiveSection(key as SectionType)}
                className="text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{value.total}</div>
                <div className="text-xs text-gray-600">Total</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{value.active}</div>
                <div className="text-xs text-gray-600">Active</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{value.pending}</div>
                <div className="text-xs text-gray-600">Pending</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-6">
        <h3 className="text-xl font-bold mb-2">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <button
            onClick={() => setActiveSection('events')}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-4 transition-all"
          >
            <Calendar className="w-6 h-6 mx-auto mb-2" />
            <div className="text-sm">Add Event</div>
          </button>
          <button
            onClick={() => setActiveSection('sponsors')}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-4 transition-all"
          >
            <Handshake className="w-6 h-6 mx-auto mb-2" />
            <div className="text-sm">Add Sponsor</div>
          </button>
          <button
            onClick={() => setActiveSection('team')}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-4 transition-all"
          >
            <Users className="w-6 h-6 mx-auto mb-2" />
            <div className="text-sm">Add Team Member</div>
          </button>
          <button
            onClick={() => setActiveSection('universities')}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-4 transition-all"
          >
            <GraduationCap className="w-6 h-6 mx-auto mb-2" />
            <div className="text-sm">Add University</div>
          </button>
        </div>
      </div>
    </div>
  );

  const renderEventsList = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Manage Past Events</h2>
        <button
          onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add New Event
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4 font-semibold">Event Name</th>
                  <th className="text-left p-4 font-semibold">Date</th>
                  <th className="text-left p-4 font-semibold">Location</th>
                  <th className="text-center p-4 font-semibold">Attendees</th>
                  <th className="text-center p-4 font-semibold">Rating</th>
                  <th className="text-center p-4 font-semibold">Status</th>
                  <th className="text-center p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="p-4 font-medium">{event.title}</td>
                    <td className="p-4 text-gray-600">{event.date}</td>
                    <td className="p-4 text-gray-600">{event.location}</td>
                    <td className="p-4 text-center">{event.attendees_count || 0}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span>{event.rating || 0}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        event.status === 'published' ? 'bg-green-100 text-green-700' :
                        event.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {event.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => { setEditingItem(event); setIsModalOpen(true); }}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(event.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderSponsorsList = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Manage Sponsors</h2>
        <button
          onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add New Sponsor
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4 font-semibold">Company Name</th>
                  <th className="text-center p-4 font-semibold">Tier</th>
                  <th className="text-center p-4 font-semibold">Since</th>
                  <th className="text-center p-4 font-semibold">Events</th>
                  <th className="text-left p-4 font-semibold">Contribution</th>
                  <th className="text-center p-4 font-semibold">Status</th>
                  <th className="text-center p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sponsors.map((sponsor) => (
                  <tr key={sponsor.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="p-4 font-medium">{sponsor.name}</td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${getTierColor(sponsor.tier)}`}>
                        {sponsor.tier}
                      </span>
                    </td>
                    <td className="p-4 text-center text-gray-600">{sponsor.since}</td>
                    <td className="p-4 text-center">{sponsor.events_count || 0}</td>
                    <td className="p-4 text-gray-600">{sponsor.contribution || '-'}</td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        sponsor.status === 'active' ? 'bg-green-100 text-green-700' :
                        sponsor.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {sponsor.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button className="text-blue-600 hover:text-blue-700">
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(sponsor.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderComingSoon = (title: string) => (
    <div className="text-center py-16">
      <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-xl font-bold mb-2 text-gray-900">{title}</h3>
      <p className="text-gray-600">Management interface coming soon</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col md:flex-row">
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-gradient-to-b from-blue-600 to-purple-600 text-white p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2">Showcase Admin</h1>
            <p className="text-sm opacity-90">Content Management</p>
          </div>

          <nav className="space-y-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeSection === section.id
                    ? 'bg-white/20 backdrop-blur-sm'
                    : 'hover:bg-white/10'
                }`}
              >
                {section.icon}
                <span>{section.name}</span>
              </button>
            ))}
          </nav>

          <div className="mt-8 pt-8 border-t border-white/20 text-sm opacity-75">
            <div className="mb-2">Total Items: {stats.events?.total || 0 + stats.sponsors?.total || 0}</div>
            <div className="mb-2">Active: {stats.events?.active || 0 + stats.sponsors?.active || 0}</div>
            <div>Pending Review: {stats.events?.pending || 0 + stats.sponsors?.pending || 0}</div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {activeSection === 'dashboard' && renderDashboard()}
          {activeSection === 'events' && renderEventsList()}
          {activeSection === 'sponsors' && renderSponsorsList()}
          {activeSection === 'team' && renderComingSoon('Team Management')}
          {activeSection === 'volunteers' && renderComingSoon('Volunteer Management')}
          {activeSection === 'partners' && renderComingSoon('Partners Management')}
          {activeSection === 'universities' && renderComingSoon('University Network')}
        </div>
      </div>

      {/* Modal placeholder - would implement based on section */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-2xl font-bold">
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-center text-gray-500">
                Modal form for {activeSection} would be implemented here
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
