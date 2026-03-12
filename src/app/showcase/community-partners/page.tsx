'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import {
  Building2, Users, Handshake, TrendingUp, Award, Heart,
  Calendar, MapPin, ExternalLink, Mail, Phone, Globe,
  Target, Zap, Star, ChevronRight, CheckCircle, Filter,
  Search, X, Sparkles, BarChart3, Clock, Loader2
} from 'lucide-react';

interface Partner {
  id: string;
  name: string;
  type_id: string;
  partner_type_name: string;
  partner_type_icon: string;
  logo_url: string;
  description: string;
  location: string;
  since_year: number;
  partnership_level: string;
  website?: string;
  email?: string;
  phone?: string;
  collaborations: Array<{ text: string }>;
  joint_events: Array<{ name: string; date: string; attendees: number }>;
  impact_metrics: Array<{ metric_name: string; metric_value: string }>;
  testimonials: Array<{ text: string; author: string; position: string }>;
}

interface PartnerType {
  id: string;
  name: string;
  icon: string;
}

export default function CommunityPartnersPage() {
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [types, setTypes] = useState<PartnerType[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPartners();
  }, [selectedType]);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedType !== 'all') params.append('type', selectedType);

      const response = await fetch(`/api/showcase/community-partners?${params}`);
      const data = await response.json();

      if (response.ok) {
        setPartners(data.partners || []);
        setTypes(data.types || []);
        setStats(data.stats || {});
      }
    } catch (error) {
      logger.error('Error fetching partners:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         partner.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getPartnershipColor = (level: string) => {
    const colors: any = {
      Strategic: 'from-purple-500 to-blue-500',
      Gold: 'from-yellow-400 to-yellow-600',
      Silver: 'from-gray-300 to-gray-500',
      Bronze: 'from-orange-400 to-orange-600'
    };
    return colors[level] || 'from-gray-400 to-gray-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-brand-start to-brand-end text-white py-20 px-8">
        <div className="max-w-7xl mx-auto text-center">
          <Handshake className="w-16 h-16 mx-auto mb-4 animate-pulse" />
          <h1 className="text-5xl font-bold mb-4">Building Together</h1>
          <p className="text-xl opacity-90 mb-8">
            Collaborating with amazing organizations to create impact
          </p>

          {/* Platform Stats */}
          <div className="grid grid-cols-5 gap-6 max-w-5xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <Building2 className="w-8 h-8 mx-auto mb-2" />
              <div className="text-3xl font-bold mb-1">{stats.total_partners || 0}+</div>
              <div className="text-sm opacity-90">Partner Organizations</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <Handshake className="w-8 h-8 mx-auto mb-2" />
              <div className="text-3xl font-bold mb-1">{stats.total_collaborations || 0}+</div>
              <div className="text-sm opacity-90">Collaborations</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <Calendar className="w-8 h-8 mx-auto mb-2" />
              <div className="text-3xl font-bold mb-1">{stats.joint_events || 0}+</div>
              <div className="text-sm opacity-90">Joint Events</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <Users className="w-8 h-8 mx-auto mb-2" />
              <div className="text-3xl font-bold mb-1">{stats.students_impacted?.toLocaleString() || 0}+</div>
              <div className="text-sm opacity-90">Students Impacted</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <TrendingUp className="w-8 h-8 mx-auto mb-2" />
              <div className="text-3xl font-bold mb-1">{stats.funding_generated || 'Rs 0'}</div>
              <div className="text-sm opacity-90">Value Generated</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search partners..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {types.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`px-6 py-2 rounded-lg font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                  selectedType === type.id
                    ? 'bg-brand-gradient text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{type.icon}</span>
                {type.name}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          </div>
        )}

        {/* Partners Grid */}
        {!loading && filteredPartners.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {filteredPartners.map((partner) => (
              <div
                key={partner.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all group"
              >
                {/* Partnership Level Badge */}
                <div className={`bg-gradient-to-r ${getPartnershipColor(partner.partnership_level)} px-6 py-3 flex items-center justify-between`}>
                  <span className="text-white font-semibold flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    {partner.partnership_level} Partner
                  </span>
                  <span className="text-white text-sm">Since {partner.since_year}</span>
                </div>

                <div className="p-6">
                  {/* Logo and Info */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                      <img
                        src={partner.logo_url}
                        alt={partner.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-1 group-hover:text-purple-600 transition-colors">
                        {partner.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">{partner.description}</p>
                      <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <MapPin className="w-4 h-4" />
                        <span>{partner.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Impact Metrics */}
                  {partner.impact_metrics && partner.impact_metrics.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="grid grid-cols-4 gap-3 text-center">
                        {partner.impact_metrics.slice(0, 4).map((metric, idx) => (
                          <div key={idx}>
                            <div className="text-lg font-bold text-purple-600">{metric.metric_value}</div>
                            <div className="text-xs text-gray-600">{metric.metric_name.replace(/([A-Z])/g, ' $1').trim()}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Collaborations */}
                  {partner.collaborations && partner.collaborations.length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs font-semibold text-gray-500 mb-2">KEY COLLABORATIONS</div>
                      <div className="space-y-1">
                        {partner.collaborations.slice(0, 3).map((collab, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{collab.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Joint Events */}
                  {partner.joint_events && partner.joint_events.length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs font-semibold text-gray-500 mb-2">RECENT JOINT EVENTS</div>
                      <div className="space-y-2">
                        {partner.joint_events.map((event, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm bg-blue-50 rounded-lg p-2">
                            <span className="font-medium">{event.name}</span>
                            <span className="text-gray-600">{event.attendees} attendees</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Testimonial */}
                  {partner.testimonials && partner.testimonials.length > 0 && (
                    <div className="bg-purple-50 rounded-lg p-4 mb-4 border-l-4 border-purple-500">
                      <p className="text-sm text-gray-700 italic mb-2">
                        "{partner.testimonials[0].text}"
                      </p>
                      <div className="text-xs text-gray-600">
                        <div className="font-semibold">{partner.testimonials[0].author}</div>
                        <div>{partner.testimonials[0].position}</div>
                      </div>
                    </div>
                  )}

                  {/* Contact */}
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    {partner.website && (
                      <a href={partner.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-purple-600">
                        <Globe className="w-4 h-4" />
                        <span className="truncate">{partner.website.replace('https://', '')}</span>
                      </a>
                    )}
                    {partner.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{partner.email}</span>
                      </div>
                    )}
                    {partner.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{partner.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* View More */}
                  <button className="w-full bg-brand-gradient text-white py-2 rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2">
                    <span>View Partnership Details</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA Section */}
        <div className="bg-brand-gradient text-white py-20 px-8 rounded-2xl">
          <div className="max-w-4xl mx-auto text-center">
            <Sparkles className="w-16 h-16 mx-auto mb-6" />
            <h2 className="text-4xl font-bold mb-4">Become a Partner</h2>
            <p className="text-xl opacity-90 mb-8">
              Join our network of amazing organizations making a difference
            </p>

            <button className="bg-white text-purple-600 px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all inline-flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Start Partnership Conversation
            </button>

            <div className="mt-8 text-sm opacity-90">
              <p>Email: partnerships@fstivo.com | Phone: +92-300-PARTNER</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
