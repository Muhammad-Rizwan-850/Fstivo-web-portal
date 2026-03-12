'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import {
  Calendar, Handshake, Users, Heart, GraduationCap,
  Plus, Edit, Trash2, Save, X, Search, Filter,
  Upload, Image, FileText, Award, Star, CheckCircle, Loader2
} from 'lucide-react';

type SectionType = 'dashboard' | 'events' | 'sponsors' | 'team' | 'volunteers' | 'partners' | 'universities';

interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  attendees_count: number;
  rating: number;
  status: string;
}

interface Sponsor {
  id: string;
  name: string;
  tier_id: string;
  since_year: number;
  events_sponsored: number;
  total_contribution_display: string;
  is_active: boolean;
}

export default function AdminShowcaseManager() {
  const [activeSection, setActiveSection] = useState<SectionType>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [stats, setStats] = useState<any>({});
  const [events, setEvents] = useState<Event[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);

  const sections = [
    { id: 'dashboard' as SectionType, name: 'Dashboard', icon: <Award className="w-5 h-5" /> },
    { id: 'events' as SectionType, name: 'Past Events', icon: <Calendar className="w-5 h-5" /> },
    { id: 'sponsors' as SectionType, name: 'Sponsors', icon: <Handshake className="w-5 h-5" /> },
    { id: 'team' as SectionType, name: 'Team Members', icon: <Users className="w-5 h-5" /> },
    { id: 'volunteers' as SectionType, name: 'Volunteers', icon: <Heart className="w-5 h-5" /> },
    { id: 'partners' as SectionType, name: 'Community Partners', icon: <Heart className="w-5 h-5" /> },
    { id: 'universities' as SectionType, name: 'Universities', icon: <GraduationCap className="w-5 h-5" /> }
  ];

  useEffect(() => {
    fetchData();
  }, [activeSection]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch stats
      const statsResponse = await fetch('/api/showcase/past-events');
      const statsData = await statsResponse.json();
      setStats(statsData.stats || {});

      // Fetch events if on events section
      if (activeSection === 'events') {
        const eventsResponse = await fetch('/api/admin/showcase/events');
        const eventsData = await eventsResponse.json();
        setEvents(eventsData.events || []);
      }

      // Fetch sponsors if on sponsors section
      if (activeSection === 'sponsors') {
        const sponsorsResponse = await fetch('/api/admin/showcase/sponsors');
        const sponsorsData = await sponsorsResponse.json();
        setSponsors(sponsorsData.sponsors || []);
      }
    } catch (error) {
      logger.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, type: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const endpoint = type === 'events' ? 'events' : 'sponsors';
      const response = await fetch(`/api/admin/showcase/${endpoint}?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Item deleted successfully');
        fetchData();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete');
      }
    } catch (error) {
      logger.error('Error deleting:', error);
      alert('Failed to delete');
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Showcase Dashboard</h2>
        <div className="text-sm text-gray-500">Last updated: Just now</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { key: 'events', label: 'Events', total: stats.total_events || 47, active: 45, pending: 2 },
          { key: 'sponsors', label: 'Sponsors', total: stats.total_sponsors || 45, active: 42, pending: 3 },
          { key: 'team', label: 'Team', total: 6, active: 6, pending: 0 },
          { key: 'volunteers', label: 'Volunteers', total: 215, active: 198, pending: 17 },
          { key: 'partners', label: 'Partners', total: 35, active: 33, pending: 2 },
          { key: 'universities', label: 'Universities', total: 45, active: 43, pending: 2 }
        ].map((stat) => (
          <div key={stat.key} className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-700">{stat.label}</h3>
              <button className="text-blue-600 hover:text-blue-700">
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{stat.total}</div>
                <div className="text-xs text-gray-600">Total</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{stat.active}</div>
                <div className="text-xs text-gray-600">Active</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{stat.pending}</div>
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
            <div className="text-sm">Add Team</div>
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Manage Past Events</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add New Event
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
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
                  <th className="text-center p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="p-4 font-medium">{event.title}</td>
                    <td className="p-4 text-gray-600">{event.date}</td>
                    <td className="p-4 text-gray-600">{event.location}</td>
                    <td className="p-4 text-center">{event.attendees_count}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span>{event.rating}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button className="text-blue-600 hover:text-blue-700">
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(event.id, 'events')}
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Manage Sponsors</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add New Sponsor
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
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
                  <th className="text-center p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sponsors.map((sponsor) => (
                  <tr key={sponsor.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="p-4 font-medium">{sponsor.name}</td>
                    <td className="p-4 text-center">
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold capitalize">
                        {sponsor.tier_id}
                      </span>
                    </td>
                    <td className="p-4 text-center text-gray-600">{sponsor.since_year}</td>
                    <td className="p-4 text-center">{sponsor.events_sponsored}</td>
                    <td className="p-4 text-gray-600">{sponsor.total_contribution_display}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button className="text-blue-600 hover:text-blue-700">
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(sponsor.id, 'sponsors')}
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

  const renderAddEventModal = () => (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-screen overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-2xl font-bold">Add New Past Event</h3>
          <button
            onClick={() => setIsModalOpen(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2">Event Title</label>
              <input
                type="text"
                placeholder="e.g., Tech Summit 2024"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Event Date</label>
              <input
                type="date"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2">Location</label>
              <input
                type="text"
                placeholder="e.g., FAST-NUCES Karachi"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Category</label>
              <select className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none">
                <option>Technology</option>
                <option>Arts & Culture</option>
                <option>Sports</option>
                <option>Business</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Description</label>
            <textarea
              rows={4}
              placeholder="Event description..."
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-6 py-3 border-2 border-gray-200 rounded-lg hover:bg-gray-50 font-semibold"
            >
              Cancel
            </button>
            <button className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center gap-2">
              <Save className="w-5 h-5" />
              Save Event
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-gradient-to-b from-blue-600 to-purple-600 text-white min-h-screen p-6">
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

          <div className="mt-8 pt-8 border-t border-white/20">
            <div className="text-sm opacity-75">
              <div className="mb-2">Total Items: 393</div>
              <div className="mb-2">Active: 367</div>
              <div>Pending Review: 26</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {activeSection === 'dashboard' && renderDashboard()}
          {activeSection === 'events' && renderEventsList()}
          {activeSection === 'sponsors' && renderSponsorsList()}
          {activeSection === 'team' && (
            <div className="text-center py-16">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Team Management</h3>
              <p className="text-gray-600">Manage your core team members here</p>
            </div>
          )}
          {activeSection === 'volunteers' && (
            <div className="text-center py-16">
              <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Volunteer Management</h3>
              <p className="text-gray-600">Track and manage volunteers</p>
            </div>
          )}
          {activeSection === 'partners' && (
            <div className="text-center py-16">
              <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Partners Management</h3>
              <p className="text-gray-600">Manage community partnerships</p>
            </div>
          )}
          {activeSection === 'universities' && (
            <div className="text-center py-16">
              <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">University Network</h3>
              <p className="text-gray-600">Manage university partnerships</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && renderAddEventModal()}
    </div>
  );
}
