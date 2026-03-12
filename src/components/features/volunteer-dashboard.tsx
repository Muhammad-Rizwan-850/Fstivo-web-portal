'use client'

import React, { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { User, Trophy, Target, TrendingUp, Award, Clock, DollarSign, Calendar, CheckCircle, XCircle, Eye, Download, Share2, Medal, Star, Zap, Gift, Wallet, History, Plus, Settings, Camera, Circle, Loader2 } from 'lucide-react'
import { logger } from '@/lib/logger';
import {
  getVolunteerDashboardDataAction,
  type VolunteerProfile,
  type VolunteerActivity,
  type VolunteerPayout,
} from '@/lib/actions/volunteer-server'

const VolunteerDashboard: React.FC = () => {
  const [profile, setProfile] = useState<VolunteerProfile | null>(null)
  const [activities, setActivities] = useState<VolunteerActivity[]>([])
  const [payouts, setPayouts] = useState<VolunteerPayout[]>([])
  const [earningsData, setEarningsData] = useState<Array<{ month: string; points: number; earnings: number }>>([])
  const [activityDistribution, setActivityDistribution] = useState<Array<{ name: string; value: number; count: number }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const result = await getVolunteerDashboardDataAction()

        if (result.error) {
          setError(result.error)
          return
        }

        setProfile(result.profile)
        setActivities(result.activities || [])
        setPayouts(result.payouts || [])
        setEarningsData(result.earnings || [])
        setActivityDistribution(result.distribution || [])
      } catch (err) {
        logger.error('Error fetching dashboard data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#c084fc', '#e0a2ff']

  const getTierInfo = (tier: string) => {
    const tiers = {
      bronze: { color: 'from-amber-600 to-amber-800', bgColor: 'bg-amber-100', textColor: 'text-amber-700', icon: '🥉', nextTier: 'silver', nextPoints: 500 },
      silver: { color: 'from-gray-300 to-gray-500', bgColor: 'bg-gray-100', textColor: 'text-gray-700', icon: '🥈', nextTier: 'gold', nextPoints: 1500 },
      gold: { color: 'from-yellow-400 to-yellow-600', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700', icon: '🥇', nextTier: 'platinum', nextPoints: 5000 },
      platinum: { color: 'from-cyan-400 to-cyan-600', bgColor: 'bg-cyan-100', textColor: 'text-cyan-700', icon: '💎', nextTier: null, nextPoints: null }
    }
    return tiers[tier as keyof typeof tiers] || tiers.bronze
  }

  const getActivityIcon = (type: string) => {
    const icons: { [key: string]: React.JSX.Element } = {
      coordination: <Award className="w-5 h-5" />,
      tech_support: <Settings className="w-5 h-5" />,
      registration_desk: <Calendar className="w-5 h-5" />,
      social_media: <Share2 className="w-5 h-5" />,
      photography: <Camera className="w-5 h-5" />,
      setup: <Zap className="w-5 h-5" />,
      usher: <User className="w-5 h-5" />
    }
    return icons[type] || <Star className="w-5 h-5" />
  }

  const tierInfo = profile ? getTierInfo(profile.tier) : getTierInfo('bronze')
  const progressToNext = tierInfo.nextPoints && profile ? ((profile.total_points / tierInfo.nextPoints) * 100).toFixed(1) : null

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="w-4 h-4" />, label: 'Pending' },
      approved: { color: 'bg-blue-100 text-blue-700', icon: <CheckCircle className="w-4 h-4" />, label: 'Approved' },
      paid: { color: 'bg-green-100 text-green-700', icon: <DollarSign className="w-4 h-4" />, label: 'Paid' },
      rejected: { color: 'bg-red-100 text-red-700', icon: <XCircle className="w-4 h-4" />, label: 'Rejected' },
      processing: { color: 'bg-purple-100 text-purple-700', icon: <Zap className="w-4 h-4" />, label: 'Processing' },
      completed: { color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-4 h-4" />, label: 'Completed' },
      failed: { color: 'bg-red-100 text-red-700', icon: <XCircle className="w-4 h-4" />, label: 'Failed' }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.icon}
        {config.label}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto mt-8">
          <p className="text-red-700 text-center">{error}</p>
        </div>
      )}

      {/* Main Content */}
      {!loading && !error && profile && (
        <>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Volunteer Dashboard</h1>
            <p className="text-gray-600">Track your volunteer journey, earnings & achievements</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <History className="w-4 h-4" />
              Activity History
            </button>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Log Activity
            </button>
          </div>
        </div>
      </div>

      {/* Tier Badge */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className={`w-24 h-24 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-5xl`}>
              {tierInfo.icon}
            </div>
            <div>
              <div className="text-sm font-medium text-indigo-200 mb-1">Current Tier</div>
              <div className="text-4xl font-bold mb-2 capitalize">{profile.tier} Volunteer</div>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4" />
                  {profile.total_points} Total Points
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {profile.total_hours} Hours
                </span>
                <span className="flex items-center gap-1">
                  <Trophy className="w-4 h-4" />
                  {profile.total_events} Events
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-indigo-200 mb-1">Total Earnings</div>
            <div className="text-4xl font-bold mb-2">Rs{profile.total_earnings.toLocaleString()}</div>
            <div className="text-sm text-indigo-200">₨{profile.tier === 'bronze' ? '5' : profile.tier === 'silver' ? '6' : profile.tier === 'gold' ? '7' : '8'}/point</div>
          </div>
        </div>

        {/* Progress to Next Tier */}
        {tierInfo.nextPoints && (
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-indigo-200">Progress to {tierInfo.nextTier}</span>
              <span className="font-semibold">{progressToNext}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
              <div
                className="bg-white rounded-full h-3 transition-all duration-500"
                style={{ width: `${progressToNext}%` }}
              />
            </div>
            <div className="text-sm text-indigo-200 mt-2">
              {profile.total_points} / {tierInfo.nextPoints} points
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-indigo-50 p-3 rounded-lg">
              <Trophy className="w-6 h-6 text-indigo-600" />
            </div>
            <span className="text-green-600 text-sm font-medium">+25%</span>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Total Points</h3>
          <p className="text-3xl font-bold text-gray-900">{profile.total_points}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-50 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-green-600 text-sm font-medium">+30%</span>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Total Earnings</h3>
          <p className="text-3xl font-bold text-gray-900">Rs{profile.total_earnings.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-50 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Volunteer Hours</h3>
          <p className="text-3xl font-bold text-gray-900">{profile.total_hours}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-orange-50 p-3 rounded-lg">
              <Target className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Events Completed</h3>
          <p className="text-3xl font-bold text-gray-900">{profile.total_events}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Earnings Trend */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Earnings & Points Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={earningsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Area yAxisId="left" type="monotone" dataKey="points" stroke="#6366f1" fill="#6366f1" fillOpacity={0.6} name="Points" />
              <Area yAxisId="right" type="monotone" dataKey="earnings" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Earnings (Rs)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Activity Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Activity Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={activityDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {activityDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activities & Payouts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Activities</h2>
            <button className="text-indigo-600 text-sm font-medium hover:text-indigo-700">View All</button>
          </div>
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-50 p-2 rounded-lg">
                      {getActivityIcon(activity.activity_type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{activity.event_name}</h3>
                      <p className="text-sm text-gray-600 capitalize">{activity.activity_type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  {getStatusBadge(activity.status)}
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Hours:</span>
                    <span className="ml-2 font-semibold text-gray-900">{activity.hours}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Points:</span>
                    <span className="ml-2 font-semibold text-indigo-600">+{activity.points_earned}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Earned:</span>
                    <span className="ml-2 font-semibold text-green-600">Rs{activity.amount_earned.toLocaleString()}</span>
                  </div>
                </div>
                {activity.feedback && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
                    <span className="font-medium text-gray-700">Feedback: </span>
                    <span className="text-gray-600">{activity.feedback}</span>
                    {activity.rating && (
                      <span className="ml-2 text-yellow-500">
                        {'★'.repeat(activity.rating)}
                        {'☆'.repeat(5 - activity.rating)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Payout History */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Payout History</h2>
            <button className="text-indigo-600 text-sm font-medium hover:text-indigo-700">View All</button>
          </div>
          <div className="space-y-4">
            {payouts.map((payout) => (
              <div key={payout.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-50 p-2 rounded-lg">
                      <Wallet className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{payout.period_start} to {payout.period_end}</h3>
                      <p className="text-sm text-gray-600 capitalize">{payout.payment_method.replace('_', ' ')}</p>
                    </div>
                  </div>
                  {getStatusBadge(payout.status)}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Points:</span>
                    <span className="ml-2 font-semibold text-indigo-600">{payout.total_points}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Amount:</span>
                    <span className="ml-2 font-semibold text-green-600">Rs{payout.total_amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tier Benefits */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Your Tier Benefits</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className={`p-4 rounded-lg ${tierInfo.bgColor} border-2 ${tierInfo.textColor.replace('text', 'border')}`}>
            <div className="text-2xl mb-2">{tierInfo.icon}</div>
            <h3 className="font-bold mb-2 capitalize">{profile.tier} Tier</h3>
            <ul className="text-sm space-y-1">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Rs{profile.tier === 'bronze' ? '5' : profile.tier === 'silver' ? '6' : profile.tier === 'gold' ? '7' : '8'}/point rate
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Basic certificate
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Community access
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-gray-50 border-2 border-gray-300">
            <div className="text-2xl mb-2">🥈</div>
            <h3 className="font-bold mb-2">Silver Tier</h3>
            <ul className="text-sm space-y-1">
              <li className="flex items-center gap-2">
                <Circle className="w-4 h-4 text-gray-400" />
                Everything in Bronze
              </li>
              <li className="flex items-center gap-2">
                <Star className="w-4 h-4 text-gray-400" />
                Priority selection
              </li>
              <li className="flex items-center gap-2">
                <Star className="w-4 h-4 text-gray-400" />
                LinkedIn endorsement
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-yellow-50 border-2 border-yellow-300">
            <div className="text-2xl mb-2">🥇</div>
            <h3 className="font-bold mb-2">Gold Tier</h3>
            <ul className="text-sm space-y-1">
              <li className="flex items-center gap-2">
                <Circle className="w-4 h-4 text-gray-400" />
                Everything in Silver
              </li>
              <li className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                Leadership roles
              </li>
              <li className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                Career coaching
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-cyan-50 border-2 border-cyan-300">
            <div className="text-2xl mb-2">💎</div>
            <h3 className="font-bold mb-2">Platinum Tier</h3>
            <ul className="text-sm space-y-1">
              <li className="flex items-center gap-2">
                <Circle className="w-4 h-4 text-gray-400" />
                Everything in Gold
              </li>
              <li className="flex items-center gap-2">
                <Star className="w-4 h-4 text-cyan-500" />
                Paid staff opportunity
              </li>
              <li className="flex items-center gap-2">
                <Star className="w-4 h-4 text-cyan-500" />
                Global certification
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Your Skills</h2>
        <div className="flex flex-wrap gap-3">
          {profile.skills && profile.skills.map((skill, index) => (
            <span
              key={index}
              className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-medium"
            >
              {skill}
            </span>
          ))}
          <button className="px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg font-medium hover:border-indigo-400 hover:text-indigo-600 transition-colors">
            + Add Skill
          </button>
        </div>
      </div>
        </>
      )}
    </div>
  )
}

export default VolunteerDashboard
