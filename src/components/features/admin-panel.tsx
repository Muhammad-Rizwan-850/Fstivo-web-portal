'use client'

import React, { useState, useEffect } from 'react'
import {
  LayoutDashboard, Users, Calendar, DollarSign, Settings,
  TrendingUp, CheckCircle, XCircle, Search, Filter, Download,
  Bell, Shield, Eye, Edit, Ban, BarChart3, Building2, MoreVertical,
  Flag, UserCheck, Activity
} from 'lucide-react'
import { createClient } from '@/lib/auth/client'
import {
  isAdmin,
  updateUserStatus,
  moderateEvent,
  getPlatformStats,
  getAdminActivityLog
} from '@/lib/admin/adminAuth'

interface User {
  id: string
  full_name: string
  email: string
  admin_role: string | null
  account_status: string
  events: number
  total_spent: number
  created_at: string
}

interface Event {
  id: string
  title: string
  organizer_name: string
  status: string
  attendee_count: number
  total_revenue: number
  start_date: string
}

interface Transaction {
  id: string
  user_full_name: string
  event_title: string
  amount: number
  status: string
  created_at: string
  payment_method: string
}

interface University {
  id: string
  name: string
  event_count: number
  user_count: number
  total_revenue: number
  created_at: string
}

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Data states
  const [stats, setStats] = useState<any>(null)
  const [users, setUsers] = useState<User[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [universities, setUniversities] = useState<University[]>([])
  const [activities, setActivities] = useState<any[]>([])

  useEffect(() => {
    checkAdminAccess()
  }, [])

  useEffect(() => {
    if (currentUser) {
      fetchData()
    }
  }, [activeTab, currentUser])

  const checkAdminAccess = async () => {
    const supabase = createClient()
    if (!supabase) return

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      window.location.href = '/login'
      return
    }

    const hasAccess = await isAdmin(user.id)

    if (!hasAccess) {
      alert('Access denied: Admin privileges required')
      window.location.href = '/dashboard'
      return
    }

    setCurrentUser(user)
    setLoading(false)
  }

  const fetchData = async () => {
    setLoading(true)

    if (activeTab === 'dashboard') {
      await fetchStats()
      await fetchActivities()
    } else if (activeTab === 'users') {
      await fetchUsers()
    } else if (activeTab === 'events') {
      await fetchEvents()
    } else if (activeTab === 'transactions') {
      await fetchTransactions()
    } else if (activeTab === 'universities') {
      await fetchUniversities()
    }

    setLoading(false)
  }

  const fetchStats = async () => {
    const data = await getPlatformStats()
    if (data) {
      setStats({
        totalUsers: data.totalUsers || 0,
        totalEvents: data.totalEvents || 0,
        totalRevenue: data.totalRevenue || 0,
        totalUniversities: data.totalUniversities || 0,
        activeUsers: data.activeUsers || 0,
        pendingEvents: data.pendingEvents || 0,
        growth: {
          users: 12,
          events: 8,
          revenue: 25,
          universities: 5
        }
      })
    }
  }

  const fetchActivities = async () => {
    const data = await getAdminActivityLog(undefined, 10)
    setActivities(data)
  }

  const fetchUsers = async () => {
    const supabase = createClient()
    if (!supabase) return

    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    setUsers((data || []) as User[])
  }

  const fetchEvents = async () => {
    const supabase = createClient()
    if (!supabase) return

    const { data } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    setEvents((data || []) as Event[])
  }

  const fetchTransactions = async () => {
    const supabase = createClient()
    if (!supabase) return

    const { data } = await supabase
      .from('transactions')
      .select(`
        *,
        user:user_profiles(full_name),
        event:title
      `)
      .order('created_at', { ascending: false })
      .limit(50)

    setTransactions((data || []) as Transaction[])
  }

  const fetchUniversities = async () => {
    const supabase = createClient()
    if (!supabase) return

    const { data } = await supabase
      .from('universities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    setUniversities((data || []) as University[])
  }

  const handleUserAction = async (userId: string, action: string) => {
    if (!currentUser?.id) return

    if (!confirm(`Are you sure you want to ${action} this user?`)) return

    const result = await updateUserStatus(
      userId,
      action as 'active' | 'suspended' | 'banned',
      currentUser.id as string
    )

    if (result.success) {
      fetchUsers()
    } else {
      alert(`Failed to ${action} user: ${result.error}`)
    }
  }

  const handleEventModeration = async (eventId: string, action: 'approve' | 'reject') => {
    if (!currentUser?.id) return

    const reason = action === 'reject' ? prompt('Reason for rejection:') || undefined : undefined

    const result = await moderateEvent(eventId, action, currentUser.id as string, reason)

    if (result.success) {
      fetchEvents()
    } else {
      alert(`Failed to ${action} event: ${result.error}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Admin Panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl">
                  <Shield className="text-white" size={24} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
                  <p className="text-sm text-gray-500">FSTIVO Platform Management</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="relative p-2 hover:bg-gray-100 rounded-lg">
                <Bell size={20} className="text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {currentUser?.user_metadata?.full_name || 'Admin'}
                  </div>
                  <div className="text-xs text-gray-500">Super Admin</div>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                  A
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
          <nav className="p-4 space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'events', label: 'Events', icon: Calendar },
              { id: 'transactions', label: 'Transactions', icon: DollarSign },
              { id: 'universities', label: 'Universities', icon: Building2 },
              { id: 'reports', label: 'Reports', icon: BarChart3 },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map(item => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === item.id
                      ? 'bg-purple-50 text-purple-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={20} />
                  {item.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Dashboard */}
          {activeTab === 'dashboard' && stats && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Platform Overview</h2>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Users className="text-blue-600" size={24} />
                    </div>
                    <div className="text-green-600 text-sm font-medium flex items-center gap-1">
                      <TrendingUp size={16} />
                      +{stats.growth.users}%
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {stats.totalUsers.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Users</div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Calendar className="text-purple-600" size={24} />
                    </div>
                    <div className="text-green-600 text-sm font-medium flex items-center gap-1">
                      <TrendingUp size={16} />
                      +{stats.growth.events}%
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {stats.totalEvents}
                  </div>
                  <div className="text-sm text-gray-600">Total Events</div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <DollarSign className="text-green-600" size={24} />
                    </div>
                    <div className="text-green-600 text-sm font-medium flex items-center gap-1">
                      <TrendingUp size={16} />
                      +{stats.growth.revenue}%
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    ₨{(stats.totalRevenue / 1000000).toFixed(1)}M
                  </div>
                  <div className="text-sm text-gray-600">Total Revenue</div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <Building2 className="text-orange-600" size={24} />
                    </div>
                    <div className="text-green-600 text-sm font-medium flex items-center gap-1">
                      <TrendingUp size={16} />
                      +{stats.growth.universities}%
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {stats.totalUniversities}
                  </div>
                  <div className="text-sm text-gray-600">Universities</div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {activities.map((activity, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg">
                      <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        <Activity size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{activity.action}</div>
                        <div className="text-sm text-gray-500">{activity.target_type}</div>
                      </div>
                      <div className="text-sm text-gray-400">
                        {new Date(activity.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                  {activities.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No recent activity</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Users Management */}
          {activeTab === 'users' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
              </div>

              <div className="bg-white rounded-xl p-4 border border-gray-200 mb-6">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                    <Filter size={18} />
                    Filters
                  </button>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                    <Download size={18} />
                    Export
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                              {user.full_name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{user.full_name || 'Unknown'}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {user.admin_role ? (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                              {user.admin_role}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500">User</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            user.account_status === 'active' ? 'bg-green-100 text-green-700' :
                            user.account_status === 'suspended' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {user.account_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button className="p-1 hover:bg-gray-100 rounded" title="View">
                              <Eye size={16} className="text-gray-600" />
                            </button>
                            <button className="p-1 hover:bg-gray-100 rounded" title="Suspend" onClick={() => handleUserAction(user.id, 'suspended')}>
                              <Ban size={16} className="text-yellow-600" />
                            </button>
                            <button className="p-1 hover:bg-gray-100 rounded" title="Ban" onClick={() => handleUserAction(user.id, 'banned')}>
                              <Ban size={16} className="text-red-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Events Management */}
          {activeTab === 'events' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Event Management</h2>
                <div className="flex gap-2">
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    Pending ({events.filter(e => e.status === 'pending').length})
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {events.map(event => (
                  <div key={event.id} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                            event.status === 'published' ? 'bg-green-100 text-green-700' :
                            event.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {event.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-4">{event.organizer_name || 'Unknown'}</div>

                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2">
                            <Users size={16} className="text-gray-400" />
                            <span className="text-sm text-gray-600">{event.attendee_count} attendees</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign size={16} className="text-gray-400" />
                            <span className="text-sm text-gray-600">₨{event.total_revenue?.toLocaleString() || 0}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-gray-400" />
                            <span className="text-sm text-gray-600">{new Date(event.start_date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {event.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleEventModeration(event.id, 'approve')}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                            >
                              <CheckCircle size={16} />
                              Approve
                            </button>
                            <button
                              onClick={() => handleEventModeration(event.id, 'reject')}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                            >
                              <XCircle size={16} />
                              Reject
                            </button>
                          </>
                        )}
                        <button className="p-2 hover:bg-gray-100 rounded-lg">
                          <MoreVertical size={20} className="text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transactions */}
          {activeTab === 'transactions' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Transactions</h2>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                  <Download size={18} />
                  Export Report
                </button>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {transactions.map(txn => (
                      <tr key={txn.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-mono text-gray-600">
                          #{txn.id.slice(0, 8)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {(txn as any).user_full_name || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {(txn as any).event_title || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          ₨{txn.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{txn.payment_method}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            txn.status === 'completed' ? 'bg-green-100 text-green-700' :
                            txn.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {txn.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(txn.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Universities */}
          {activeTab === 'universities' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Universities</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {universities.map(uni => (
                  <div key={uni.id} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{uni.name}</h3>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                          Active
                        </span>
                      </div>
                      <button className="p-2 hover:bg-gray-100 rounded-lg">
                        <MoreVertical size={20} className="text-gray-600" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <div className="text-2xl font-bold text-gray-900">{uni.event_count || 0}</div>
                        <div className="text-xs text-gray-600">Events</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900">{uni.user_count || 0}</div>
                        <div className="text-xs text-gray-600">Users</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900">
                          ₨{((uni.total_revenue || 0) / 1000000).toFixed(1)}M
                        </div>
                        <div className="text-xs text-gray-600">Revenue</div>
                      </div>
                    </div>

                    <div className="text-sm text-gray-500">
                      Joined {new Date(uni.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settings */}
          {activeTab === 'settings' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Platform Settings</h2>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <p className="text-gray-500">Settings panel coming soon...</p>
              </div>
            </div>
          )}

          {/* Reports */}
          {activeTab === 'reports' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Reports</h2>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <p className="text-gray-500">Reports panel coming soon...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminPanel
