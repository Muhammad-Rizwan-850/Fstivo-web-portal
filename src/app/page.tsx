'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar, Users, Briefcase, Heart, Award, TrendingUp,
  ArrowRight, Star, MapPin, Clock, CheckCircle, Globe,
  Target, Zap, Shield, Play, ChevronLeft, ChevronRight,
  User as UserIcon
} from 'lucide-react';

// Role Selection Component
const RoleSelectionSection = () => {
  const router = useRouter();

  const roles = [
    {
      id: 'attendee',
      name: 'Event Attendee',
      icon: UserIcon,
      color: 'from-blue-500 to-blue-600',
      description: 'Browse and attend amazing events',
      features: ['Browse events', 'Buy tickets', 'Join communities', 'Get recommendations'],
      requiresApproval: false,
      badge: null,
    },
    {
      id: 'organizer',
      name: 'Event Organizer',
      icon: Calendar,
      color: 'from-purple-500 to-purple-600',
      description: 'Create and manage incredible events',
      features: ['Create events', 'Manage tickets', 'Analytics dashboard', 'Email campaigns'],
      requiresApproval: true,
      badge: 'Verified Required',
    },
    {
      id: 'sponsor',
      name: 'Event Sponsor',
      icon: Briefcase,
      color: 'from-pink-500 to-pink-600',
      description: 'Sponsor events and grow your brand',
      features: ['Sponsor showcase', 'ROI metrics', 'Brand visibility', 'Lead generation'],
      requiresApproval: true,
      badge: 'Business Verification',
    },
    {
      id: 'volunteer',
      name: 'Event Volunteer',
      icon: Heart,
      color: 'from-green-500 to-green-600',
      description: 'Help make events successful',
      features: ['Volunteer dashboard', 'Achievement badges', 'Leaderboard', 'Rewards program'],
      requiresApproval: true,
      badge: 'Background Check',
    },
    {
      id: 'partner',
      name: 'Community Partner',
      icon: Target,
      color: 'from-orange-500 to-orange-600',
      description: 'Partner on community initiatives',
      features: ['Partnership dashboard', 'Collaboration tools', 'Impact tracking'],
      requiresApproval: true,
      badge: 'Organization Verification',
    },
    {
      id: 'vendor',
      name: 'Service Vendor',
      icon: Zap,
      color: 'from-indigo-500 to-indigo-600',
      description: 'Provide services for events',
      features: ['Service listings', 'Booking management', 'Client reviews'],
      requiresApproval: true,
      badge: 'License Verification',
    },
  ];

  const handleRoleSelect = (roleId: string) => {
    // Navigate to role selection page with pre-selected role
    router.push(`/auth/role-selection?role=${roleId}`);
  };

  const RoleCard = ({ role }: { role: typeof roles[0] }) => {
    const Icon = role.icon;
    return (
      <button
        onClick={() => handleRoleSelect(role.id)}
        className="relative bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-purple-500 transition-all duration-300 hover:shadow-xl group text-left"
      >
        {role.badge && (
          <div className="absolute -top-3 right-4 bg-brand-gradient text-white text-xs font-bold px-3 py-1 rounded-full">
            {role.badge}
          </div>
        )}

        <div className={`w-16 h-16 bg-gradient-to-br ${role.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
          <Icon className="w-8 h-8 text-white" />
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-2">{role.name}</h3>
        <p className="text-sm text-gray-600 mb-4">{role.description}</p>

        <div className="space-y-2 mb-4">
          {role.features.slice(0, 3).map((feature, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>{feature}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <span className={`text-sm font-medium ${role.requiresApproval ? 'text-orange-600' : 'text-green-600'}`}>
            {role.requiresApproval ? 'Requires Approval' : 'Instant Access'}
          </span>
          <ArrowRight className="w-5 h-5 text-purple-600 group-hover:translate-x-1 transition-transform" />
        </div>
      </button>
    );
  };

  return (
    <section className="py-20 bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Role</h2>
          <p className="text-xl text-gray-600">Select how you want to participate in the Fstivo community</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role) => (
            <RoleCard key={role.id} role={role} />
          ))}
        </div>

        <div className="mt-12 p-6 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl border border-purple-200">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Trusted & Verified Platform</h4>
              <p className="text-sm text-gray-600">
                Premium roles require approval from our admin team to ensure quality and security.
                This typically takes 1-2 business days. You'll receive an email once your application is reviewed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const EnhancedHomePage = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // Past Events Data
  const pastEvents = [
    {
      id: 1,
      name: 'Tech Summit 2024',
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
      date: 'March 15, 2024',
      location: 'Karachi Convention Center',
      attendees: 1200,
      category: 'Technology',
      rating: 4.8,
    },
    {
      id: 2,
      name: 'Business Innovation Forum',
      image: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800',
      date: 'January 20, 2024',
      location: 'Lahore Business Hub',
      attendees: 850,
      category: 'Business',
      rating: 4.7,
    },
    {
      id: 3,
      name: 'Digital Marketing Conference',
      image: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800',
      date: 'December 10, 2023',
      location: 'Islamabad Expo Center',
      attendees: 950,
      category: 'Marketing',
      rating: 4.9,
    },
    {
      id: 4,
      name: 'Startup Weekend Karachi',
      image: 'https://images.unsplash.com/photo-1559223607-a43c990c6b6b?w=800',
      date: 'November 5, 2023',
      location: 'FAST-NUCES Karachi',
      attendees: 600,
      category: 'Startup',
      rating: 4.8,
    },
  ];

  // Sponsors Data
  const sponsors = [
    { id: 1, name: 'TechCorp', logo: 'TC', tier: 'Platinum', color: 'from-purple-500 to-purple-600' },
    { id: 2, name: 'InnovateHub', logo: 'IH', tier: 'Gold', color: 'from-yellow-500 to-yellow-600' },
    { id: 3, name: 'Digital Solutions', logo: 'DS', tier: 'Gold', color: 'from-yellow-500 to-yellow-600' },
    { id: 4, name: 'StartupFund', logo: 'SF', tier: 'Silver', color: 'from-gray-400 to-gray-500' },
    { id: 5, name: 'CloudTech', logo: 'CT', tier: 'Silver', color: 'from-gray-400 to-gray-500' },
    { id: 6, name: 'DataWorks', logo: 'DW', tier: 'Bronze', color: 'from-orange-400 to-orange-500' },
  ];

  // Team Members
  const teamMembers = [
    { id: 1, name: 'Ahmed Ali', role: 'Founder & CEO', image: 'AA', events: 47 },
    { id: 2, name: 'Sara Khan', role: 'Operations Director', image: 'SK', events: 45 },
    { id: 3, name: 'Hassan Raza', role: 'Marketing Head', image: 'HR', events: 42 },
    { id: 4, name: 'Fatima Noor', role: 'Tech Lead', image: 'FN', events: 38 },
  ];

  // Volunteers Stats
  const volunteerStats = {
    total: 215,
    hours: 15000,
    events: 120,
    topVolunteers: [
      { name: 'Ali Ahmed', hours: 450, level: 'Diamond' },
      { name: 'Ayesha Khan', hours: 380, level: 'Platinum' },
      { name: 'Usman Malik', hours: 320, level: 'Platinum' },
    ],
  };

  // Community Partners
  const partners = [
    { id: 1, name: 'FAST-NUCES', type: 'University', logo: 'FN' },
    { id: 2, name: 'LUMS', type: 'University', logo: 'LU' },
    { id: 3, name: 'P@SHA', type: 'Industry', logo: 'PS' },
    { id: 4, name: 'The Citizens Foundation', type: 'NGO', logo: 'TCF' },
    { id: 5, name: 'HEC', type: 'Government', logo: 'HEC' },
    { id: 6, name: 'Dawn News', type: 'Media', logo: 'DN' },
  ];

  // Testimonials
  const testimonials = [
    {
      id: 1,
      text: 'Fstivo made organizing our tech conference seamless. The platform is intuitive and the support team is exceptional.',
      author: 'Ahmad Hassan',
      role: 'CEO, TechEvents Pakistan',
      rating: 5,
    },
    {
      id: 2,
      text: 'Best event management platform in Pakistan. We have organized 15+ events through Fstivo with great success.',
      author: 'Sarah Khan',
      role: 'Event Manager, Innovation Hub',
      rating: 5,
    },
    {
      id: 3,
      text: 'The analytics and insights provided by Fstivo helped us understand our audience better and improve our events.',
      author: 'Ali Raza',
      role: 'Marketing Director, StartupWeekend',
      rating: 5,
    },
  ];

  const stats = [
    { label: 'Events Hosted', value: '47+', icon: Calendar, color: 'from-blue-500 to-blue-600' },
    { label: 'Total Attendees', value: '28,500+', icon: Users, color: 'from-purple-500 to-purple-600' },
    { label: 'Active Volunteers', value: '215+', icon: Heart, color: 'from-pink-500 to-pink-600' },
    { label: 'Partner Organizations', value: '45+', icon: Briefcase, color: 'from-green-500 to-green-600' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Pakistan's Leading Event Management Platform
            </h1>
            <p className="text-xl md:text-2xl text-pink-100 mb-8">
              Trusted by 47+ organizers, 28,500+ attendees, and 45+ partner organizations
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/role-selection"
                className="px-8 py-4 bg-white text-purple-600 rounded-lg font-semibold text-lg hover:bg-pink-50 transition-all shadow-xl flex items-center justify-center gap-2"
              >
                Choose Your Role
                <ArrowRight className="w-5 h-5" />
              </Link>
              <button className="px-8 py-4 bg-white/20 backdrop-blur-sm border-2 border-white text-white rounded-lg font-semibold text-lg hover:bg-white/30 transition-all flex items-center justify-center gap-2">
                <Play className="w-5 h-5" />
                Watch Demo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ROLE SELECTION SECTION */}
      <RoleSelectionSection />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Past Events Section */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Previous Events</h2>
            <p className="text-xl text-gray-600">Successfully organized events across Pakistan</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pastEvents.map((event) => (
              <div key={event.id} className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden hover:border-purple-500 hover:shadow-xl transition-all group">
                <div className="relative h-48 overflow-hidden">
                  <img src={event.image} alt={event.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-gray-900">
                    {event.category}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{event.name}</h3>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{event.attendees.toLocaleString()} attendees</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 text-yellow-500 fill-current" />
                      <span className="font-semibold text-gray-900">{event.rating}</span>
                    </div>
                    <button className="text-purple-600 font-semibold text-sm hover:text-purple-700 flex items-center gap-1">
                      View Details
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              href="/showcase/past-events"
              className="px-8 py-3 border-2 border-purple-600 text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors inline-block"
            >
              View All 47+ Events
            </Link>
          </div>
        </section>

        {/* Sponsors Section */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Trusted by Leading Brands</h2>
            <p className="text-xl text-gray-600">45+ companies partner with us</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {sponsors.map((sponsor) => (
              <div key={sponsor.id} className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-purple-500 hover:shadow-lg transition-all group">
                <div className={`w-16 h-16 bg-gradient-to-br ${sponsor.color} rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                  <span className="text-2xl font-bold text-white">{sponsor.logo}</span>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900 mb-1">{sponsor.name}</div>
                  <div className="text-xs text-gray-600">{sponsor.tier}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              href="/showcase/sponsors"
              className="px-8 py-3 border-2 border-purple-600 text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors inline-block"
            >
              Become a Sponsor
            </Link>
          </div>
        </section>

        {/* Team Section */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Core Team</h2>
            <p className="text-xl text-gray-600">Experienced professionals managing your events</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member) => (
              <div key={member.id} className="text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-3xl font-bold">
                  {member.image}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{member.name}</h3>
                <p className="text-gray-600 mb-3">{member.role}</p>
                <div className="text-sm text-purple-600 font-semibold">
                  {member.events} Events Managed
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Volunteers Section */}
        <section className="mb-20 bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Powered by Amazing Volunteers</h2>
            <p className="text-xl text-gray-600">215+ volunteers contributing 15,000+ hours</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-xl p-6 text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">{volunteerStats.total}+</div>
              <div className="text-gray-600">Active Volunteers</div>
            </div>
            <div className="bg-white rounded-xl p-6 text-center">
              <div className="text-4xl font-bold text-pink-600 mb-2">{volunteerStats.hours.toLocaleString()}+</div>
              <div className="text-gray-600">Hours Contributed</div>
            </div>
            <div className="bg-white rounded-xl p-6 text-center">
              <div className="text-4xl font-bold text-indigo-600 mb-2">{volunteerStats.events}+</div>
              <div className="text-gray-600">Events Supported</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Top Volunteers</h3>
            <div className="space-y-4">
              {volunteerStats.topVolunteers.map((volunteer, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{volunteer.name}</div>
                      <div className="text-sm text-gray-600">{volunteer.hours} hours</div>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                    {volunteer.level}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-8">
            <Link
              href="/auth/role-selection?role=volunteer"
              className="px-8 py-3 bg-brand-gradient text-white rounded-lg font-semibold hover:shadow-xl transition-all inline-block"
            >
              Join as Volunteer
            </Link>
          </div>
        </section>

        {/* Community Partners */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Community Partners</h2>
            <p className="text-xl text-gray-600">Collaborating with leading organizations</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {partners.map((partner) => (
              <div key={partner.id} className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-purple-500 hover:shadow-lg transition-all group text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <span className="text-xl font-bold text-white">{partner.logo}</span>
                </div>
                <div className="font-semibold text-gray-900 text-sm mb-1">{partner.name}</div>
                <div className="text-xs text-gray-600">{partner.type}</div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              href="/showcase/community-partners"
              className="px-8 py-3 border-2 border-purple-600 text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors inline-block"
            >
              View All Partners
            </Link>
          </div>
        </section>

        {/* Testimonials */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What Our Clients Say</h2>
            <p className="text-xl text-gray-600">Trusted by event organizers across Pakistan</p>
          </div>

          <div className="relative">
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-12 max-w-4xl mx-auto">
              <div className="flex justify-center mb-6">
                {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 text-yellow-500 fill-current" />
                ))}
              </div>
              <p className="text-2xl text-gray-700 text-center mb-8 leading-relaxed">
                "{testimonials[currentTestimonial].text}"
              </p>
              <div className="text-center">
                <div className="font-bold text-gray-900 text-lg">{testimonials[currentTestimonial].author}</div>
                <div className="text-gray-600">{testimonials[currentTestimonial].role}</div>
              </div>
            </div>

            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentTestimonial ? 'bg-purple-600 w-8' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 rounded-3xl p-12 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Ready to Create Your Event?</h2>
          <p className="text-xl text-pink-100 mb-8 max-w-2xl mx-auto">
            Join 47+ successful organizers and create memorable experiences for thousands of attendees
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/role-selection"
              className="px-8 py-4 bg-white text-purple-600 rounded-lg font-semibold text-lg hover:bg-pink-50 transition-all shadow-xl"
            >
              Get Started Free
            </Link>
            <button className="px-8 py-4 bg-white/20 backdrop-blur-sm border-2 border-white text-white rounded-lg font-semibold text-lg hover:bg-white/30 transition-all">
              Contact Sales
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default EnhancedHomePage;
