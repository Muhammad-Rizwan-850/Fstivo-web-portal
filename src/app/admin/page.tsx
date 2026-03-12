'use client';

import React, { useState, useEffect } from 'react';
import {
  Users, Calendar, DollarSign, University, Shield, Settings,
  BarChart3, Activity, TrendingUp, Ban
} from 'lucide-react';
import AdminApprovalDashboard from '@/components/admin/admin-approval-dashboard';
import { logger } from '@/lib/logger';

interface AdminStats {
  totalUsers: number;
  totalEvents: number;
  totalRevenue: number;
  totalUniversities: number;
  pendingApprovals: number;
  activeEvents: number;
  monthlyGrowth: number;
  systemHealth: 'good' | 'warning' | 'error';
}

interface RecentActivity {
  id: string;
  type: 'user_registered' | 'event_created' | 'payment_processed' | 'user_suspended';
  description: string;
  timestamp: string;
  user?: string;
}

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminStats();
    fetchRecentActivity();
  }, []);

  const fetchAdminStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      logger.error('Failed to fetch admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const response = await fetch('/api/admin/activity');
      if (response.ok) {
        const data = await response.json();
        setRecentActivity(data);
      }
    } catch (error) {
      logger.error('Failed to fetch recent activity:', error);
    }
  };

  const StatCard = ({ title, value, icon: Icon, trend, color }: {
    title: string;
    value: string | number;
    icon: any;
    trend?: string;
    color: string;
  }) => (
    <div className="bg-white rounded-lg shadow-sm border p-6" role="region" aria-labelledby={`stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600" id={`stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>{title}</p>
          <p className="text-2xl font-bold text-gray-900" aria-label={`${title}: ${value}`}>{value}</p>
          {trend && (
            <p className="text-sm text-green-600 flex items-center mt-1" aria-label={`Trend: ${trend}`}>
              <TrendingUp className="w-4 h-4 mr-1" aria-hidden="true" />
              {trend}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`} aria-hidden="true">
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-gray-600">Manage your platform</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                aria-label="Open admin settings"
              >
                <Settings className="w-4 h-4 inline mr-2" aria-hidden="true" />
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" role="navigation" aria-label="Admin panel navigation">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'events', label: 'Events', icon: Calendar },
              { id: 'transactions', label: 'Transactions', icon: DollarSign },
              { id: 'universities', label: 'Universities', icon: University },
              { id: 'approvals', label: 'Approvals', icon: Shield },
              { id: 'analytics', label: 'Analytics', icon: Activity },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-1 py-4 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                aria-current={activeTab === tab.id ? 'page' : undefined}
                aria-label={`Navigate to ${tab.label} section`}
              >
                <tab.icon className="w-4 h-4 mr-2" aria-hidden="true" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" role="region" aria-label="Platform statistics">
              <StatCard
                title="Total Users"
                value={stats?.totalUsers || 0}
                icon={Users}
                trend="+12% this month"
                color="bg-blue-500"
              />
              <StatCard
                title="Active Events"
                value={stats?.activeEvents || 0}
                icon={Calendar}
                trend="+8% this month"
                color="bg-green-500"
              />
              <StatCard
                title="Total Revenue"
                value={`$${(stats?.totalRevenue || 0).toLocaleString()}`}
                icon={DollarSign}
                trend="+15% this month"
                color="bg-yellow-500"
              />
              <StatCard
                title="Partner Universities"
                value={stats?.totalUniversities || 0}
                icon={University}
                trend="+2 this month"
                color="bg-purple-500"
              />
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm border" role="region" aria-label="Recent admin activity">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
              </div>
              <div className="divide-y divide-gray-200" role="list" aria-label="Activity list">
                {recentActivity.slice(0, 10).map((activity) => (
                  <div key={activity.id} className="px-6 py-4 flex items-center justify-between" role="listitem">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {activity.type === 'user_registered' && <Users className="w-5 h-5 text-blue-500" aria-hidden="true" />}
                        {activity.type === 'event_created' && <Calendar className="w-5 h-5 text-green-500" aria-hidden="true" />}
                        {activity.type === 'payment_processed' && <DollarSign className="w-5 h-5 text-yellow-500" aria-hidden="true" />}
                        {activity.type === 'user_suspended' && <Ban className="w-5 h-5 text-red-500" aria-hidden="true" />}
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                        <p className="text-sm text-gray-500">
                          {activity.user && `${activity.user} • `}
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'approvals' && <AdminApprovalDashboard />}
      </div>
    </div>
  );
};

export default AdminDashboard;