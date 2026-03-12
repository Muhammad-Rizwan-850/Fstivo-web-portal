'use client'

import { useState, useEffect } from 'react'
import {
  TrendingUp, Users, Target, Gift, Share2, Mail,
  Award, Star, Zap, Copy, Check, DollarSign,
  Calendar, Hash, ExternalLink, Download, Bell,
  BarChart3, MessageSquare, Heart, UserPlus, Send, Loader2
} from 'lucide-react'
import { createClient } from '@/lib/auth/config'
import { getUserReferralStats } from '@/lib/actions/marketing-server'
import { logger } from '@/lib/logger';

interface Referral {
  id: string
  name: string
  status: 'completed' | 'pending'
  points: number
  date: string
}

interface Campaign {
  id: string
  title: string
  description: string
  type: string
  status: 'active' | 'completed'
  progress: number
  target: number
  current: number
  reward: string
  endDate: string
  icon?: any
}

interface Reward {
  id: string
  title: string
  points: number
  description: string
  category: string
  available: number
  icon: string
  popular: boolean
}

interface ShareOption {
  id: string
  name: string
  icon: any
  color: string
  url: (text: string, url: string) => string
}

export function MarketingGrowthSystem({ userId }: { userId?: string }) {
  const [activeTab, setActiveTab] = useState('referral')
  const [userData, setUserData] = useState<any>(null)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [copied, setCopied] = useState(false)
  const [shareMethod, setShareMethod] = useState<string | null>(null)
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null)
  const [loading, setLoading] = useState(true)

  // Social share options
  const shareOptions: ShareOption[] = [
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: MessageSquare,
      color: 'bg-green-500',
      url: (text, url) => `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: Share2,
      color: 'bg-blue-600',
      url: (text, url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: MessageSquare,
      color: 'bg-sky-500',
      url: (text, url) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: Share2,
      color: 'bg-blue-700',
      url: (text, url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
    },
    {
      id: 'email',
      name: 'Email',
      icon: Mail,
      color: 'bg-gray-600',
      url: (text, url) => `mailto:?subject=${encodeURIComponent('Join me on FSTIVO!')}&body=${encodeURIComponent(text + '\n\n' + url)}`
    }
  ]

  useEffect(() => {
    if (userId) {
      fetchUserData()
    } else {
      // Mock data for demo
      setMockData()
      setLoading(false)
    }
  }, [userId])

  const setMockData = () => {
    setUserData({
      id: 'demo-user',
      referral_code: 'FSTIVO' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      referral_points: 450,
      total_referrals: 9
    })
    setReferrals([
      { id: '1', name: 'Ali Hassan', status: 'completed' as const, points: 100, date: '2024-12-20' },
      { id: '2', name: 'Fatima Khan', status: 'completed' as const, points: 100, date: '2024-12-18' },
      { id: '3', name: 'Ahmed Raza', status: 'pending' as const, points: 0, date: '2024-12-27' }
    ])
  }

  const fetchUserData = async () => {
    setLoading(true)
    try {
      // Use server action instead of direct Supabase call
      const result = await getUserReferralStats(userId as string)

      if (result.profile) {
        setUserData(result.profile)
        setReferrals(result.referrals || [])
      }

      // Mock campaigns data
      setCampaigns([
        {
          id: '1',
          title: 'Friend Fest 2024',
          description: 'Invite 5 friends and get a free Premium ticket',
          type: 'referral',
          status: 'active',
          progress: Math.min((result.profile?.total_referrals || 0) / 5 * 100, 100),
          target: 5,
          current: result.profile?.total_referrals || 0,
          reward: 'Premium Ticket',
          endDate: '2024-12-31',
          icon: Users
        },
        {
          id: '2',
          title: 'Social Sharer',
          description: 'Share 3 events on social media',
          type: 'social',
          status: 'active',
          progress: 33,
          target: 3,
          current: 1,
          reward: '200 Points',
          endDate: '2024-12-30',
          icon: Share2
        },
        {
          id: '3',
          title: 'Review Master',
          description: 'Leave reviews for 5 attended events',
          type: 'engagement',
          status: 'active',
          progress: 80,
          target: 5,
          current: 4,
          reward: 'VIP Badge',
          endDate: '2025-01-15',
          icon: Star
        }
      ])

      // Mock rewards catalog
      setRewards([
        {
          id: '1',
          title: 'Free Event Ticket',
          points: 500,
          description: 'Redeem for any event ticket',
          category: 'tickets',
          available: 50,
          icon: '🎟️',
          popular: true
        },
        {
          id: '2',
          title: '₨500 Event Credit',
          points: 400,
          description: 'Use on any event registration',
          category: 'credits',
          available: 100,
          icon: '💰',
          popular: true
        },
        {
          id: '3',
          title: 'Premium Badge',
          points: 300,
          description: 'Get VIP profile badge for 3 months',
          category: 'badges',
          available: 25,
          icon: '⭐',
          popular: false
        },
        {
          id: '4',
          title: 'Featured Profile',
          points: 600,
          description: 'Your profile featured for 1 week',
          category: 'promotion',
          available: 10,
          icon: '🌟',
          popular: false
        },
        {
          id: '5',
          title: 'Event Organizer Pack',
          points: 800,
          description: 'Free tools for event creation',
          category: 'tools',
          available: 15,
          icon: '🎯',
          popular: false
        },
        {
          id: '6',
          title: 'Coffee Gift Card',
          points: 250,
          description: '₨300 coffee shop voucher',
          category: 'vouchers',
          available: 30,
          icon: '☕',
          popular: true
        }
      ])
    } catch (error) {
      logger.error('Error fetching user data:', error)
      setMockData()
    } finally {
      setLoading(false)
    }
  }

  const handleCopyReferralCode = () => {
    const referralUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://fstivo.com'}/signup?ref=${userData?.referral_code}`
    navigator.clipboard.writeText(referralUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = (platform: ShareOption) => {
    const text = `Join me on FSTIVO! Use my code ${userData?.referral_code} and get ₨200 credit on your first event. 🎉`
    const url = `${process.env.NEXT_PUBLIC_APP_URL || 'https://fstivo.com'}/signup?ref=${userData?.referral_code}`

    const shareUrl = platform.url(text, url)
    window.open(shareUrl, '_blank', 'width=600,height=400')

    setShareMethod(platform.id)
    setTimeout(() => setShareMethod(null), 2000)

    // Track share in analytics (in production)
    logger.info('Shared via:', platform.id)
  }

  const handleRedeemReward = (reward: Reward) => {
    if (userData?.referral_points >= reward.points) {
      setSelectedReward(reward)
    }
  }

  const confirmRedemption = async () => {
    if (!selectedReward || !userData) return

    try {
      // Import and use server action
      const { redeemReward } = await import('@/lib/actions/marketing-server')

      const result = await redeemReward({
        user_id: userData.id,
        reward_id: selectedReward.id,
        reward_title: selectedReward.title,
        points_spent: selectedReward.points
      })

      if (result.success) {
        setUserData({
          ...userData,
          referral_points: result.remainingPoints
        })
        setSelectedReward(null)
        alert('Reward redeemed successfully!')
      } else {
        alert(result.error || 'Failed to redeem reward')
      }
    } catch (error) {
      logger.error('Error redeeming reward:', error)
      alert('Failed to redeem reward. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your growth dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                  <TrendingUp className="text-white" size={28} />
                </div>
                Growth Hub
              </h1>
              <p className="text-gray-600 mt-1">Earn rewards, invite friends, and unlock exclusive perks</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Your Points</div>
              <div className="text-3xl font-bold text-purple-600">{userData?.referral_points || 0}</div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="text-purple-600" size={20} />
              </div>
              <div className="text-sm text-gray-600">Referrals</div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{userData?.total_referrals || 0}</div>
            <div className="text-xs text-green-600 mt-1">Invite friends to earn</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Gift className="text-green-600" size={20} />
              </div>
              <div className="text-sm text-gray-600">Points</div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{userData?.referral_points || 0}</div>
            <div className="text-xs text-gray-500 mt-1">Redeem for rewards</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Share2 className="text-blue-600" size={20} />
              </div>
              <div className="text-sm text-gray-600">Potential Earnings</div>
            </div>
            <div className="text-2xl font-bold text-gray-900">₨{((userData?.total_referrals || 0) * 200).toLocaleString()}</div>
            <div className="text-xs text-blue-600 mt-1">From referrals</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Award className="text-orange-600" size={20} />
              </div>
              <div className="text-sm text-gray-600">Badges</div>
            </div>
            <div className="text-2xl font-bold text-gray-900">3</div>
            <div className="text-xs text-gray-500 mt-1">Ambassador level</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {[
              { id: 'referral', label: 'Referral Program', icon: UserPlus },
              { id: 'campaigns', label: 'Campaigns', icon: Target },
              { id: 'rewards', label: 'Rewards', icon: Gift },
              { id: 'share', label: 'Share & Earn', icon: Share2 }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">

            {/* Referral Program Tab */}
            {activeTab === 'referral' && (
              <div>
                {/* Referral Hero */}
                <div className="bg-brand-gradient rounded-2xl p-8 text-white mb-6">
                  <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Invite Friends, Get Rewarded!</h2>
                      <p className="text-purple-100 mb-6">
                        Give ₨200, Get ₨200. Both you and your friend win! 🎉
                      </p>
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="bg-white/20 rounded-lg px-4 py-2">
                          <div className="text-sm opacity-90">Your unique code</div>
                          <div className="text-xl font-bold">{userData?.referral_code}</div>
                        </div>
                        <button
                          onClick={handleCopyReferralCode}
                          className="flex items-center gap-2 bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
                        >
                          {copied ? (
                            <>
                              <Check size={18} />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy size={18} />
                              Copy Link
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm opacity-90 mb-1">Total Earned</div>
                      <div className="text-4xl font-bold">₨{((userData?.total_referrals || 0) * 200).toLocaleString()}</div>
                    </div>
                  </div>

                  {/* Quick Share Buttons */}
                  <div className="grid grid-cols-5 gap-3">
                    {shareOptions.map(option => {
                      const Icon = option.icon
                      return (
                        <button
                          key={option.id}
                          onClick={() => handleShare(option)}
                          className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl p-4 transition-all hover:scale-105"
                        >
                          <Icon className="mx-auto mb-2" size={24} />
                          <div className="text-xs font-medium">{option.name}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* How It Works */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-purple-50 rounded-xl p-6 border-2 border-purple-200">
                    <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold mb-4">1</div>
                    <h3 className="font-semibold text-gray-900 mb-2">Share Your Link</h3>
                    <p className="text-sm text-gray-600">Send your unique referral link to friends via WhatsApp, email, or social media.</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold mb-4">2</div>
                    <h3 className="font-semibold text-gray-900 mb-2">They Sign Up</h3>
                    <p className="text-sm text-gray-600">Your friend creates an account and gets ₨200 credit instantly on their account.</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200">
                    <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white text-xl font-bold mb-4">3</div>
                    <h3 className="font-semibold text-gray-900 mb-2">You Both Win!</h3>
                    <p className="text-sm text-gray-600">When they attend their first event, you get ₨200 credit plus 100 reward points!</p>
                  </div>
                </div>

                {/* Recent Referrals */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Referrals</h3>
                  <div className="space-y-3">
                    {referrals.length > 0 ? referrals.map(referral => (
                      <div key={referral.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                            {referral.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{referral.name}</div>
                            <div className="text-sm text-gray-500">{referral.date}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                            referral.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {referral.status === 'completed' ? '✓' : '⏳'}
                            {referral.status}
                          </div>
                          {referral.status === 'completed' && (
                            <div className="text-sm text-gray-600 mt-1">+{referral.points} points</div>
                          )}
                        </div>
                      </div>
                    )) : (
                      <div className="bg-gray-50 rounded-xl p-8 text-center">
                        <UserPlus className="mx-auto text-gray-400 mb-3" size={48} />
                        <p className="text-gray-600">No referrals yet</p>
                        <p className="text-sm text-gray-500 mt-1">Start sharing your referral link to earn rewards!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Campaigns Tab */}
            {activeTab === 'campaigns' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Active Campaigns</h2>
                  <p className="text-gray-600">Complete challenges to earn extra rewards</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {campaigns.map(campaign => {
                    const Icon = campaign.icon || Target
                    return (
                      <div key={campaign.id} className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-purple-300 transition-all">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-purple-100 rounded-xl">
                              <Icon className="text-purple-600" size={24} />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{campaign.title}</h3>
                              <p className="text-sm text-gray-600">{campaign.description}</p>
                            </div>
                          </div>
                          <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            Active
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-gray-600">Progress</span>
                            <span className="font-semibold text-gray-900">{campaign.current}/{campaign.target}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div
                              className="bg-brand-gradient h-full rounded-full transition-all duration-500"
                              style={{ width: `${campaign.progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm">
                            <Gift className="text-purple-600" size={16} />
                            <span className="font-medium text-gray-900">{campaign.reward}</span>
                          </div>
                          <div className="text-sm text-gray-500">
                            Ends {campaign.endDate}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Rewards Tab */}
            {activeTab === 'rewards' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Rewards Catalog</h2>
                  <p className="text-gray-600">Redeem your points for exclusive rewards</p>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto">
                  {['All', 'Tickets', 'Credits', 'Badges', 'Vouchers'].map(filter => (
                    <button
                      key={filter}
                      className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-purple-100 hover:text-purple-600 text-sm font-medium whitespace-nowrap transition-colors"
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {rewards.map(reward => (
                    <div
                      key={reward.id}
                      className={`bg-white border-2 rounded-xl p-6 hover:shadow-lg transition-all ${
                        reward.popular ? 'border-purple-300 bg-purple-50' : 'border-gray-200'
                      }`}
                    >
                      {reward.popular && (
                        <div className="inline-flex items-center gap-1 px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full mb-3">
                          <Star size={12} />
                          POPULAR
                        </div>
                      )}

                      <div className="text-4xl mb-3">{reward.icon}</div>
                      <h3 className="font-bold text-gray-900 mb-2">{reward.title}</h3>
                      <p className="text-sm text-gray-600 mb-4">{reward.description}</p>

                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Zap className="text-yellow-500" size={18} />
                          <span className="font-bold text-purple-600 text-lg">{reward.points} pts</span>
                        </div>
                        <div className="text-xs text-gray-500">{reward.available} left</div>
                      </div>

                      <button
                        onClick={() => handleRedeemReward(reward)}
                        disabled={(userData?.referral_points || 0) < reward.points}
                        className={`w-full py-3 rounded-lg font-semibold transition-all ${
                          (userData?.referral_points || 0) >= reward.points
                            ? 'bg-brand-gradient text-white hover:shadow-lg'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {(userData?.referral_points || 0) >= reward.points ? 'Redeem Now' : 'Not Enough Points'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Share & Earn Tab */}
            {activeTab === 'share' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Share & Earn</h2>
                  <p className="text-gray-600">Share events and FSTIVO to earn bonus points</p>
                </div>

                {/* Earn Points Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
                    <Share2 className="mb-4" size={32} />
                    <h3 className="text-xl font-bold mb-2">Share Events</h3>
                    <p className="text-blue-100 mb-4">Share any event and earn 10 points per share</p>
                    <div className="flex items-center gap-2 bg-white/20 rounded-lg px-4 py-3">
                      <Zap className="text-yellow-300" size={20} />
                      <span className="font-bold">+10 points per share</span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-white">
                    <Heart className="mb-4" size={32} />
                    <h3 className="text-xl font-bold mb-2">Refer FSTIVO</h3>
                    <p className="text-purple-100 mb-4">Share FSTIVO with friends and earn 50 points</p>
                    <div className="flex items-center gap-2 bg-white/20 rounded-lg px-4 py-3">
                      <Zap className="text-yellow-300" size={20} />
                      <span className="font-bold">+50 points per referral</span>
                    </div>
                  </div>
                </div>

                {/* Social Platforms */}
                <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Choose Platform</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {shareOptions.map(option => {
                      const Icon = option.icon
                      return (
                        <button
                          key={option.id}
                          onClick={() => handleShare(option)}
                          className={`${option.color} hover:opacity-90 text-white rounded-xl p-6 transition-all hover:scale-105 flex flex-col items-center gap-3`}
                        >
                          <Icon size={32} />
                          <span className="font-semibold">{option.name}</span>
                          {shareMethod === option.id && (
                            <span className="text-xs bg-white/20 px-2 py-1 rounded">Shared!</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Reward Redemption Modal */}
        {selectedReward && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-slideUp">
              <div className="text-center mb-6">
                <div className="text-6xl mb-3">{selectedReward.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Redemption</h3>
                <p className="text-gray-600">{selectedReward.title}</p>
              </div>

              <div className="bg-purple-50 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">Current Points</span>
                  <span className="font-bold text-gray-900">{userData?.referral_points || 0}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">Reward Cost</span>
                  <span className="font-bold text-purple-600">-{selectedReward.points}</span>
                </div>
                <div className="border-t border-purple-200 pt-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">Remaining</span>
                    <span className="font-bold text-gray-900">
                      {(userData?.referral_points || 0) - selectedReward.points}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedReward(null)}
                  className="flex-1 px-6 py-3 border-2 border-gray-200 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRedemption}
                  className="flex-1 px-6 py-3 bg-brand-gradient text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
