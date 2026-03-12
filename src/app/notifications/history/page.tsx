'use client'

import React, { useState, useEffect } from 'react';
import {
  Bell, Mail, MessageSquare, MessageCircle, Calendar,
  ShoppingBag, Users, Shield, Filter, Search, Download,
  CheckCircle2, XCircle, Clock, Eye, MousePointer, Trash2,
  TrendingUp, TrendingDown, Minus, BarChart3, ArrowRight, PlayCircle, Edit, XCircle as XCircleIcon, Tag as TagIcon, Newspaper
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

const NotificationHistory = () => {
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [selectedChannel, selectedStatus]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: '50',
        ...(selectedChannel !== 'all' && { channel: selectedChannel }),
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
      });

      const response = await fetch(`/api/notifications/history?${params}`);
      const data = await response.json();

      setNotifications(data.notifications || []);
    } catch (error) {
      logger.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const channelIcons = {
    email: Mail,
    sms: MessageSquare,
    push: Bell,
    whatsapp: MessageCircle,
  };

  const statusIcons = {
    sent: Clock,
    delivered: CheckCircle2,
    opened: Eye,
    clicked: MousePointer,
    failed: XCircle,
  };

  const statusColors = {
    sent: 'bg-blue-100 text-blue-700',
    delivered: 'bg-green-100 text-green-700',
    opened: 'bg-purple-100 text-purple-700',
    clicked: 'bg-pink-100 text-pink-700',
    failed: 'bg-red-100 text-red-700',
  };

  const categoryColors = {
    event: 'from-pink-500 to-purple-600',
    ticket: 'from-purple-500 to-indigo-600',
    social: 'from-indigo-500 to-blue-600',
    system: 'from-blue-500 to-cyan-600',
    marketing: 'from-cyan-500 to-teal-600',
  };

  const categoryIcons = {
    event: Calendar,
    ticket: ShoppingBag,
    social: Users,
    system: Shield,
    marketing: Newspaper,
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const filteredNotifications = notifications.filter(notif => {
    const matchesSearch = searchQuery === '' ||
      notif.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.type?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <BarChart3 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Notification History</h1>
              <p className="text-pink-100 mt-2">Track all your notifications and analytics</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Filters & Search */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search notifications..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-600"
                />
              </div>

              {/* Channel Filter */}
              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-600 bg-white"
              >
                <option value="all">All Channels</option>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="push">Push</option>
                <option value="whatsapp">WhatsApp</option>
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-600 bg-white"
              >
                <option value="all">All Status</option>
                <option value="sent">Sent</option>
                <option value="delivered">Delivered</option>
                <option value="opened">Opened</option>
                <option value="clicked">Clicked</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          {/* Notification List */}
          <div className="space-y-4">
            {filteredNotifications.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
                <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No notifications found</h3>
                <p className="text-gray-600">Try adjusting your filters</p>
              </div>
            ) : (
              filteredNotifications.map(notif => {
                const ChannelIcon = channelIcons[notif.channel as keyof typeof channelIcons] || Bell;
                const StatusIcon = statusIcons[notif.status as keyof typeof statusIcons] || Clock;
                const CategoryIcon = categoryIcons[notif.category as keyof typeof categoryIcons] || Calendar;

                return (
                  <div key={notif.id} className="bg-white rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className={`w-12 h-12 bg-gradient-to-br ${categoryColors[notif.category as keyof typeof categoryColors]} rounded-xl flex items-center justify-center flex-shrink-0`}>
                            <ChannelIcon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-gray-900 mb-1">{notif.subject}</h3>
                            <div className="flex items-center gap-3 text-sm text-gray-600 flex-wrap">
                              <span className="capitalize">{notif.type}</span>
                              <span>•</span>
                              <span>{notif.recipient}</span>
                              <span>•</span>
                              <span>{formatDate(notif.sentAt)}</span>
                            </div>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[notif.status as keyof typeof statusColors]} flex items-center gap-1 flex-shrink-0`}>
                          <StatusIcon className="w-3 h-3" />
                          {notif.status}
                        </span>
                      </div>

                      {/* Timeline */}
                      {(notif.deliveredAt || notif.openedAt || notif.clickedAt) && (
                        <div className="flex items-center gap-2 text-xs text-gray-500 pt-4 border-t border-gray-100 flex-wrap">
                          <Clock className="w-3 h-3" />
                          <span>Sent {formatDate(notif.sentAt)}</span>
                          {notif.deliveredAt && (
                            <>
                              <ArrowRight className="w-3 h-3" />
                              <span>Delivered {formatDate(notif.deliveredAt)}</span>
                            </>
                          )}
                          {notif.openedAt && (
                            <>
                              <ArrowRight className="w-3 h-3" />
                              <span>Opened {formatDate(notif.openedAt)}</span>
                            </>
                          )}
                          {notif.clickedAt && (
                            <>
                              <ArrowRight className="w-3 h-3" />
                              <span>Clicked {formatDate(notif.clickedAt)}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination Info */}
          {filteredNotifications.length > 0 && (
            <div className="flex items-center justify-between bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <span className="text-sm text-gray-600">
                Showing {filteredNotifications.length} notifications
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationHistory;
