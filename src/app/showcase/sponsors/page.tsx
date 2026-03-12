'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import {
  Award, Star, TrendingUp, Users, DollarSign, Heart,
  Building2, Mail, ExternalLink, ChevronRight, Sparkles,
  Target, Zap, Globe, Phone, MapPin, Calendar, Loader2,
  X, Send
} from 'lucide-react';

interface Sponsor {
  id: string;
  name: string;
  tier_id: string;
  tier_name: string;
  tier_icon: string;
  tier_color: string;
  logo_url: string;
  description: string;
  industry: string;
  website?: string;
  email?: string;
  phone?: string;
  location?: string;
  since_year: number;
  events_sponsored: number;
  total_contribution_display: string;
  impact_metrics: Array<{
    metric_name: string;
    metric_value: string;
    metric_label: string;
  }>;
  testimonials: Array<{
    text: string;
    author: string;
    position: string;
  }>;
}

interface Tier {
  id: string;
  name: string;
  display_order: number;
  color_gradient: string;
  icon_emoji: string;
  benefits: string[];
}

export default function SponsorsPage() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState('all');
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    interested_tier: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSponsors();
  }, [selectedTier]);

  const fetchSponsors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedTier !== 'all') params.append('tier', selectedTier);

      const response = await fetch(`/api/showcase/sponsors?${params}`);
      const data = await response.json();

      if (response.ok) {
        setSponsors(data.sponsors || []);
        setTiers(data.tiers || []);
        setStats(data.stats || {});
      }
    } catch (error) {
      logger.error('Error fetching sponsors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/showcase/sponsors/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm)
      });

      if (response.ok) {
        alert('Thank you! We will contact you shortly.');
        setContactModalOpen(false);
        setContactForm({
          company_name: '',
          contact_name: '',
          email: '',
          phone: '',
          interested_tier: '',
          message: ''
        });
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to submit request');
      }
    } catch (error) {
      logger.error('Error submitting contact form:', error);
      alert('Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const getTierBgColor = (tierId: string) => {
    const colors: any = {
      platinum: 'bg-slate-50 border-slate-200',
      gold: 'bg-yellow-50 border-yellow-200',
      silver: 'bg-gray-50 border-gray-200',
      bronze: 'bg-orange-50 border-orange-200'
    };
    return colors[tierId] || 'bg-gray-50 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20 px-8">
        <div className="max-w-7xl mx-auto text-center">
          <Sparkles className="w-16 h-16 mx-auto mb-4 animate-pulse" />
          <h1 className="text-5xl font-bold mb-4">Powered by Amazing Partners</h1>
          <p className="text-xl opacity-90 mb-8">
            Building the future together with industry leaders
          </p>

          {/* Platform Stats */}
          <div className="grid grid-cols-5 gap-6 max-w-5xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <Building2 className="w-8 h-8 mx-auto mb-2" />
              <div className="text-3xl font-bold mb-1">{stats.total_sponsors || 0}+</div>
              <div className="text-sm opacity-90">Partner Companies</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <DollarSign className="w-8 h-8 mx-auto mb-2" />
              <div className="text-3xl font-bold mb-1">{stats.total_contribution_display || 'Rs 25M+'}</div>
              <div className="text-sm opacity-90">Total Contribution</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <Calendar className="w-8 h-8 mx-auto mb-2" />
              <div className="text-3xl font-bold mb-1">{stats.events_sponsored || 0}+</div>
              <div className="text-sm opacity-90">Events Sponsored</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <Users className="w-8 h-8 mx-auto mb-2" />
              <div className="text-3xl font-bold mb-1">{(stats.students_impacted || 30000).toLocaleString()}+</div>
              <div className="text-sm opacity-90">Students Impacted</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <Star className="w-8 h-8 mx-auto mb-2" />
              <div className="text-3xl font-bold mb-1">{stats.average_satisfaction || 4.8}/5</div>
              <div className="text-sm opacity-90">Partner Satisfaction</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Filter Buttons */}
        <div className="flex items-center justify-center gap-4 mb-8 flex-wrap">
          <button
            onClick={() => setSelectedTier('all')}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              selectedTier === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Partners ({sponsors.length})
          </button>
          {tiers.map((tier) => {
            const count = sponsors.filter(s => s.tier_id === tier.id).length;
            return (
              <button
                key={tier.id}
                onClick={() => setSelectedTier(tier.id)}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                  selectedTier === tier.id
                    ? `bg-gradient-to-r ${tier.color_gradient} text-white`
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tier.icon_emoji} {tier.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          </div>
        )}

        {/* Sponsors Grid */}
        {!loading && sponsors.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sponsors.map((sponsor) => (
              <div
                key={sponsor.id}
                className={`bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all ${getTierBgColor(sponsor.tier_id)} border-2`}
              >
                {/* Tier Badge */}
                <div className={`bg-gradient-to-r ${sponsor.tier_color} px-4 py-2 flex items-center justify-between`}>
                  <span className="text-white font-semibold flex items-center gap-2">
                    {sponsor.tier_icon} {sponsor.tier_name} Partner
                  </span>
                  <span className="text-white text-sm">Since {sponsor.since_year}</span>
                </div>

                <div className="p-6">
                  {/* Logo and Info */}
                  <div className="flex items-start gap-4 mb-4">
                    {sponsor.logo_url && (
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-white shadow-md">
                        <img
                          src={sponsor.logo_url}
                          alt={sponsor.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-1">{sponsor.name}</h3>
                      <p className="text-sm text-gray-600">{sponsor.description}</p>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full inline-block mt-2">
                        {sponsor.industry}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{sponsor.events_sponsored}</div>
                        <div className="text-xs text-gray-600">Events</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">{sponsor.total_contribution_display}</div>
                        <div className="text-xs text-gray-600">Support</div>
                      </div>
                    </div>
                  </div>

                  {/* Impact Metrics */}
                  {sponsor.impact_metrics && sponsor.impact_metrics.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {sponsor.impact_metrics.slice(0, 3).map((metric, idx) => (
                        <div key={idx} className="text-center bg-white rounded-lg p-3 border">
                          <div className="font-bold text-purple-600">{metric.metric_value}</div>
                          <div className="text-xs text-gray-600">{metric.metric_label}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Testimonial */}
                  {sponsor.testimonials && sponsor.testimonials.length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-4 mb-4 border-l-4 border-blue-500">
                      <p className="text-sm text-gray-700 italic mb-2">
                        "{sponsor.testimonials[0].text}"
                      </p>
                      <div className="text-xs text-gray-600">
                        <div className="font-semibold">{sponsor.testimonials[0].author}</div>
                        <div>{sponsor.testimonials[0].position}</div>
                      </div>
                    </div>
                  )}

                  {/* Contact */}
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    {sponsor.website && (
                      <a href={sponsor.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-blue-600">
                        <Globe className="w-4 h-4" />
                        <span className="truncate">{sponsor.website.replace('https://', '')}</span>
                      </a>
                    )}
                  </div>

                  <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg hover:shadow-lg transition-all">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Building2 className="w-16 h-16 mx-auto mb-6" />
          <h2 className="text-4xl font-bold mb-4">Become a Sponsor</h2>
          <p className="text-xl opacity-90 mb-8">
            Join leading companies in shaping Pakistan's future talent
          </p>

          <button
            onClick={() => setContactModalOpen(true)}
            className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all inline-flex items-center gap-2"
          >
            <Mail className="w-5 h-5" />
            Request Partnership Package
          </button>
        </div>
      </div>

      {/* Contact Modal */}
      {contactModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-8 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setContactModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-2xl font-bold mb-6">Partnership Inquiry</h2>

            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={contactForm.company_name}
                    onChange={(e) => setContactForm({...contactForm, company_name: e.target.value})}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Contact Name *</label>
                  <input
                    type="text"
                    required
                    value={contactForm.contact_name}
                    onChange={(e) => setContactForm({...contactForm, contact_name: e.target.value})}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Email *</label>
                  <input
                    type="email"
                    required
                    value={contactForm.email}
                    onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Phone</label>
                  <input
                    type="tel"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Interested Tier</label>
                <select
                  value={contactForm.interested_tier}
                  onChange={(e) => setContactForm({...contactForm, interested_tier: e.target.value})}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select a tier</option>
                  {tiers.map(tier => (
                    <option key={tier.id} value={tier.id}>
                      {tier.icon_emoji} {tier.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Message</label>
                <textarea
                  rows={4}
                  value={contactForm.message}
                  onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="Tell us about your goals..."
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 font-semibold disabled:opacity-50"
              >
                {submitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</>
                ) : (
                  <><Send className="w-5 h-5" /> Submit Inquiry</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
