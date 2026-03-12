'use client';

import React, { useState } from 'react';
import { logger } from '@/lib/logger';
import {
  Users, Shield, Crown, Check, X, Clock, Eye, FileText,
  Search, Filter, Download, ChevronDown, ChevronUp, AlertCircle,
  CheckCircle2, XCircle, Calendar, Briefcase, Heart, Handshake,
  Package, Mail, Phone, Globe, MapPin, TrendingUp, Activity
} from 'lucide-react';

// =====================================================
// ADMIN APPROVAL DASHBOARD COMPONENT
// =====================================================

interface Application {
  id: number;
  applicantName: string;
  email: string;
  role: string;
  roleDisplay: string;
  roleIcon: any;
  roleColor: string;
  status: string;
  submittedAt: string;
  organizationName?: string;
  organizationType?: string;
  experience?: string;
  phone?: string;
  website?: string;
  companyName?: string;
  industry?: string;
  budget?: string;
  documents: Array<{
    type: string;
    status: string;
    url: string;
  }>;
  completeness: number;
}

const AdminApprovalDashboard = () => {
  const [selectedTab, setSelectedTab] = useState('pending');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  // Mock data - replace with actual API call
  const stats = {
    pending: 12,
    approved: 145,
    rejected: 8,
    underReview: 3,
  };

  const applications: Application[] = [
    {
      id: 1,
      applicantName: 'Ahmad Hassan',
      email: 'ahmad@example.com',
      role: 'organizer',
      roleDisplay: 'Event Organizer',
      roleIcon: Calendar,
      roleColor: 'from-purple-500 to-purple-600',
      status: 'pending',
      submittedAt: '2026-01-01T10:30:00',
      organizationName: 'Tech Events Pakistan',
      organizationType: 'Company',
      experience: '5+ years organizing tech conferences',
      phone: '+92 300 1234567',
      website: 'https://techevents.pk',
      documents: [
        { type: 'Business Registration', status: 'verified', url: '#' },
        { type: 'Identity Proof', status: 'verified', url: '#' },
        { type: 'Portfolio', status: 'pending', url: '#' },
      ],
      completeness: 95,
    },
    {
      id: 2,
      applicantName: 'Sarah Khan',
      email: 'sarah@example.com',
      role: 'sponsor',
      roleDisplay: 'Event Sponsor',
      roleIcon: Briefcase,
      roleColor: 'from-pink-500 to-pink-600',
      status: 'pending',
      submittedAt: '2026-01-01T14:20:00',
      companyName: 'TechCorp Solutions',
      industry: 'Technology',
      budget: 'Rs 500K-1M',
      phone: '+92 321 7654321',
      website: 'https://techcorp.com',
      documents: [
        { type: 'Company Registration', status: 'verified', url: '#' },
        { type: 'Tax Certificate', status: 'verified', url: '#' },
      ],
      completeness: 100,
    },
    {
      id: 3,
      applicantName: 'Ali Ahmed',
      email: 'ali@example.com',
      role: 'volunteer',
      roleDisplay: 'Event Volunteer',
      roleIcon: Heart,
      roleColor: 'from-green-500 to-green-600',
      status: 'under_review',
      submittedAt: '2025-12-30T09:15:00',
      phone: '+92 333 9876543',
      documents: [
        { type: 'Identity Proof', status: 'verified', url: '#' },
        { type: 'Background Check', status: 'pending', url: '#' },
      ],
      completeness: 85,
    },
  ];

  const handleApprove = async (applicationId: number) => {
    try {
      const response = await fetch(`/api/admin/applications/${applicationId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'Approved by admin' })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve application');
      }

      alert(data.message);
      // Refresh the applications list
      window.location.reload();
    } catch (error: any) {
      logger.error('Error approving application:', error);
      alert(error.message || 'Failed to approve application');
    }
  };

  const handleReject = async (applicationId: number, reason: string) => {
    try {
      const response = await fetch(`/api/admin/applications/${applicationId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject application');
      }

      alert(data.message);
      // Refresh the applications list
      window.location.reload();
    } catch (error: any) {
      logger.error('Error rejecting application:', error);
      alert(error.message || 'Failed to reject application');
    }
  };

  const handleRequestChanges = async (applicationId: number, changes: string[]) => {
    try {
      const response = await fetch(`/api/admin/applications/${applicationId}/request-changes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changes })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to request changes');
      }

      alert(data.message);
      // Refresh the applications list
      window.location.reload();
    } catch (error: any) {
      logger.error('Error requesting changes:', error);
      alert(error.message || 'Failed to request changes');
    }
  };

  const ApplicationCard = ({ app }: { app: Application }) => {
    const Icon = app.roleIcon;
    const daysAgo = Math.floor((new Date().getTime() - new Date(app.submittedAt).getTime()) / (1000 * 60 * 60 * 24));

    return (
      <div className="bg-white rounded-xl border-2 border-gray-200 hover:border-purple-500 transition-all p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 bg-gradient-to-br ${app.roleColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{app.applicantName}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                <span>{app.email}</span>
              </div>
              {app.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                  <Phone className="w-4 h-4" />
                  <span>{app.phone}</span>
                </div>
              )}
            </div>
          </div>

          <div className="text-right">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
              app.status === 'pending' ? 'bg-orange-100 text-orange-700' :
              app.status === 'under_review' ? 'bg-blue-100 text-blue-700' :
              app.status === 'approved' ? 'bg-green-100 text-green-700' :
              'bg-red-100 text-red-700'
            }`}>
              {app.status.replace('_', ' ').toUpperCase()}
            </span>
            <div className="text-xs text-gray-500 mt-2">{daysAgo}d ago</div>
          </div>
        </div>

        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm font-semibold text-gray-900 mb-2">Applying for: {app.roleDisplay}</div>
          {app.organizationName && (
            <div className="text-sm text-gray-600 mb-1">
              <span className="font-medium">Organization:</span> {app.organizationName}
            </div>
          )}
          {app.companyName && (
            <div className="text-sm text-gray-600 mb-1">
              <span className="font-medium">Company:</span> {app.companyName}
            </div>
          )}
          {app.website && (
            <div className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700">
              <Globe className="w-4 h-4" />
              <a href={app.website} target="_blank" rel="noopener noreferrer">{app.website}</a>
            </div>
          )}
        </div>

        {/* Documents Status */}
        <div className="mb-4">
          <div className="text-sm font-semibold text-gray-700 mb-2">Documents ({app.documents.length})</div>
          <div className="flex flex-wrap gap-2">
            {app.documents.map((doc, idx) => (
              <div key={idx} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                doc.status === 'verified' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
              }`}>
                {doc.status === 'verified' ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <Clock className="w-3 h-3" />
                )}
                <span>{doc.type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Completeness */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="font-medium text-gray-700">Profile Completeness</span>
            <span className="font-bold text-purple-600">{app.completeness}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-500 to-purple-600 transition-all"
              style={{ width: `${app.completeness}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedApplication(app);
              setShowDetailsModal(true);
            }}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" />
            View Details
          </button>

          {app.status === 'pending' && (
            <>
              <button
                onClick={() => handleApprove(app.id)}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Approve
              </button>
              <button
                onClick={() => {
                  const reason = prompt('Enter rejection reason:');
                  if (reason) handleReject(app.id, reason);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  const filteredApplications = applications.filter(app => {
    const matchesTab = selectedTab === 'all' || app.status === selectedTab;
    const matchesRole = filterRole === 'all' || app.role === filterRole;
    const matchesSearch = searchQuery === '' ||
      app.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.email.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesRole && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Crown className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold">
                  Role Management
                </span>
              </div>
              <p className="text-pink-100">Review and approve user role applications</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5" />
                <span className="text-sm">Pending</span>
              </div>
              <div className="text-3xl font-bold">{stats.pending}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5" />
                <span className="text-sm">Under Review</span>
              </div>
              <div className="text-3xl font-bold">{stats.underReview}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm">Approved</span>
              </div>
              <div className="text-3xl font-bold">{stats.approved}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-5 h-5" />
                <span className="text-sm">Rejected</span>
              </div>
              <div className="text-3xl font-bold">{stats.rejected}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
            </div>

            {/* Role Filter */}
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="organizer">Organizer</option>
              <option value="sponsor">Sponsor</option>
              <option value="volunteer">Volunteer</option>
              <option value="partner">Partner</option>
              <option value="vendor">Vendor</option>
            </select>

            {/* Export */}
            <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-6 flex-wrap">
            {[
              { id: 'pending', label: 'Pending', count: stats.pending },
              { id: 'under_review', label: 'Under Review', count: stats.underReview },
              { id: 'approved', label: 'Approved', count: stats.approved },
              { id: 'rejected', label: 'Rejected', count: stats.rejected },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  selectedTab === tab.id
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Applications List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredApplications.length === 0 ? (
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No applications found</h3>
              <p className="text-gray-600">Try adjusting your filters</p>
            </div>
          ) : (
            filteredApplications.map(app => (
              <ApplicationCard key={app.id} app={app} />
            ))
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedApplication && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-pink-500 to-purple-600 text-white p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">Application Details</h2>
                <p className="text-pink-100">{selectedApplication.applicantName}</p>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {/* Full application details would go here */}
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Applicant Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Name</div>
                      <div className="font-semibold">{selectedApplication.applicantName}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Email</div>
                      <div className="font-semibold">{selectedApplication.email}</div>
                    </div>
                    {selectedApplication.phone && (
                      <div>
                        <div className="text-sm text-gray-600">Phone</div>
                        <div className="font-semibold">{selectedApplication.phone}</div>
                      </div>
                    )}
                    <div>
                      <div className="text-sm text-gray-600">Role</div>
                      <div className="font-semibold">{selectedApplication.roleDisplay}</div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      handleApprove(selectedApplication.id);
                      setShowDetailsModal(false);
                    }}
                    className="flex-1 px-6 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    Approve Application
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Enter rejection reason:');
                      if (reason) {
                        handleReject(selectedApplication.id, reason);
                        setShowDetailsModal(false);
                      }
                    }}
                    className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <X className="w-5 h-5" />
                    Reject Application
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminApprovalDashboard;
