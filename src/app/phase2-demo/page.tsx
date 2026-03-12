'use client';

// =====================================================
// PHASE 2 DEMO: USER EXPERIENCE ENHANCEMENTS
// =====================================================
// Interactive demo showcasing all Phase 2 features
// =====================================================

import React, { useState, useEffect } from 'react';
import {
  Users, Heart, MessageCircle, Share2, Camera, Gift,
  QrCode, Smartphone, Moon, Sun, Monitor, Clock,
  TrendingUp, Target, DollarSign, Calendar, MapPin,
  Badge, Ticket, UserPlus, Settings, Bell, Zap,
  CheckCircle2, Star, ThumbsUp, Eye
} from 'lucide-react';

const Phase2Demo = () => {
  const [activeTab, setActiveTab] = useState('social');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  // Sample data
  const samplePosts = [
    {
      id: 1,
      user: 'Sarah Khan',
      avatar: 'SK',
      content: 'Excited for tomorrow\'s tech conference! 🚀 Can\'t wait to network with everyone.',
      reactions: { like: 24, love: 8, celebrate: 5 },
      comments: 12,
      time: '2 hours ago',
      image: null
    },
    {
      id: 2,
      user: 'Ahmed Ali',
      avatar: 'AA',
      content: 'Networking session was amazing! Met so many talented people. The startup pitches were incredible. 🎯',
      reactions: { like: 45, love: 12, celebrate: 8 },
      comments: 18,
      time: '4 hours ago',
      image: null
    }
  ];

  const sampleFriends = [
    { id: 1, name: 'Maria Ahmed', avatar: 'MA', status: 'At Conference', mutual: 12, online: true },
    { id: 2, name: 'Hassan Khan', avatar: 'HK', status: 'Online', mutual: 8, online: true },
    { id: 3, name: 'Fatima Sheikh', avatar: 'FS', status: 'Joined 2h ago', mutual: 5, online: false }
  ];

  const sampleBundles = [
    {
      id: 1,
      name: 'Weekend Pass',
      originalPrice: 5000,
      bundlePrice: 4000,
      savings: 1000,
      items: ['Day 1 Access', 'Day 2 Access', 'Networking Dinner', 'Workshop Pass']
    },
    {
      id: 2,
      name: 'VIP Experience',
      originalPrice: 12000,
      bundlePrice: 10000,
      savings: 2000,
      items: ['All Sessions', 'VIP Lounge', 'Meet & Greet', 'Premium Swag', 'Priority Seating']
    }
  ];

  const sampleWaitlist = [
    { id: 1, event: 'Tech Summit 2026', position: 3, ticketType: 'VIP', estimatedNotification: '2 hours' },
    { id: 2, event: 'StartupCon', position: 12, ticketType: 'Standard', estimatedNotification: '1 day' }
  ];

  const sampleStations = [
    { id: 1, name: 'Main Entrance', type: 'QR Scanner', checkins: 245, avgTime: '15s', status: 'active' },
    { id: 2, name: 'VIP Gate', type: 'Manual', checkins: 45, avgTime: '30s', status: 'active' },
    { id: 3, name: 'Self-Service Kiosk', type: 'Kiosk', checkins: 189, avgTime: '8s', status: 'active' }
  ];

  const themeStyles = {
    light: {
      bg: 'bg-gray-50',
      card: 'bg-white',
      text: 'text-gray-900',
      textMuted: 'text-gray-600',
      border: 'border-gray-200',
      hover: 'hover:bg-gray-100'
    },
    dark: {
      bg: 'bg-gray-900',
      card: 'bg-gray-800',
      text: 'text-white',
      textMuted: 'text-gray-400',
      border: 'border-gray-700',
      hover: 'hover:bg-gray-700'
    }
  };

  const styles = themeStyles[theme];

  const tabs = [
    { id: 'social', label: 'Social Features', icon: Users, color: 'blue' },
    { id: 'ticketing', label: 'Advanced Ticketing', icon: Ticket, color: 'green' },
    { id: 'checkin', label: 'Check-in System', icon: QrCode, color: 'purple' },
    { id: 'pwa', label: 'PWA Features', icon: Smartphone, color: 'pink' },
    { id: 'preferences', label: 'Preferences', icon: Settings, color: 'indigo' }
  ];

  return (
    <div className={`min-h-screen ${styles.bg} ${styles.text} p-4 md:p-6 transition-colors duration-300`}>
      {/* Header */}
      <div className={`${styles.card} rounded-xl p-6 mb-6 shadow-lg border ${styles.border}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              FSTIVO Phase 2: UX Enhancements
            </h1>
            <p className={`${styles.textMuted}`}>
              Social Features • Advanced Ticketing • Check-in • PWA • Dark Mode
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className={`p-3 rounded-lg ${styles.hover} ${styles.border} border transition-all`}
              title="Toggle theme"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            <button className={`p-3 rounded-lg ${styles.hover} ${styles.border} border transition-all`}>
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : `${styles.hover} ${styles.border} border`
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">

          {/* Social Features */}
          {activeTab === 'social' && (
            <>
              {/* Event Feed */}
              <div className={`${styles.card} rounded-xl p-6 shadow-lg border ${styles.border}`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Event Feed
                  </h2>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-semibold">
                    Create Post
                  </button>
                </div>

                <div className="space-y-4">
                  {samplePosts.map(post => (
                    <div key={post.id} className={`p-4 rounded-lg ${styles.border} border`}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {post.avatar}
                        </div>
                        <div>
                          <p className="font-semibold">{post.user}</p>
                          <p className={`text-sm ${styles.textMuted}`}>{post.time}</p>
                        </div>
                      </div>
                      <p className="mb-3">{post.content}</p>
                      <div className="flex gap-4">
                        <button className={`flex items-center gap-2 ${styles.textMuted} ${styles.hover} px-3 py-1 rounded-lg transition-all text-sm`}>
                          <Heart className="w-4 h-4" />
                          <span>{Object.values(post.reactions).reduce((a, b) => a + b, 0)}</span>
                        </button>
                        <button className={`flex items-center gap-2 ${styles.textMuted} ${styles.hover} px-3 py-1 rounded-lg transition-all text-sm`}>
                          <MessageCircle className="w-4 h-4" />
                          <span>{post.comments}</span>
                        </button>
                        <button className={`flex items-center gap-2 ${styles.textMuted} ${styles.hover} px-3 py-1 rounded-lg transition-all text-sm`}>
                          <Share2 className="w-4 h-4" />
                          Share
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Photo Gallery */}
              <div className={`${styles.card} rounded-xl p-6 shadow-lg border ${styles.border}`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Camera className="w-5 h-5 text-green-600" />
                    Event Photos
                  </h2>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-sm font-semibold">
                    Upload Photos
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="aspect-square bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-2xl">
                      {i}
                    </div>
                  ))}
                </div>
              </div>

              {/* Referral Program */}
              <div className={`${styles.card} rounded-xl p-6 shadow-lg border ${styles.border}`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Gift className="w-5 h-5 text-purple-600" />
                    Refer Friends
                  </h2>
                </div>

                <div className={`p-4 rounded-lg ${styles.border} border mb-4`}>
                  <p className={`text-sm ${styles.textMuted} mb-2`}>Your Referral Code</p>
                  <div className="flex gap-2">
                    <input
                      value="REF-XYZ123"
                      readOnly
                      className={`flex-1 px-4 py-2 ${styles.border} border rounded-lg ${styles.bg}`}
                    />
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-semibold">
                      Copy
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">12</p>
                    <p className={`text-sm ${styles.textMuted}`}>Referrals</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">8</p>
                    <p className={`text-sm ${styles.textMuted}`}>Converted</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">₨800</p>
                    <p className={`text-sm ${styles.textMuted}`}>Earned</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Advanced Ticketing */}
          {activeTab === 'ticketing' && (
            <>
              {/* Ticket Bundles */}
              <div className={`${styles.card} rounded-xl p-6 shadow-lg border ${styles.border}`}>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-green-600" />
                  Ticket Bundles
                </h2>
                <div className="space-y-4">
                  {sampleBundles.map(bundle => (
                    <div key={bundle.id} className={`p-4 rounded-lg ${styles.border} border ${styles.hover} cursor-pointer transition-all`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-lg">{bundle.name}</h3>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {bundle.items.map((item, i) => (
                              <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm line-through ${styles.textMuted}`}>₨{bundle.originalPrice.toLocaleString()}</p>
                          <p className="text-2xl font-bold text-blue-600">₨{bundle.bundlePrice.toLocaleString()}</p>
                          <p className="text-sm text-green-600 font-semibold">Save ₨{bundle.savings.toLocaleString()}</p>
                        </div>
                      </div>
                      <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-semibold">
                        Purchase Bundle
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Waitlist */}
              <div className={`${styles.card} rounded-xl p-6 shadow-lg border ${styles.border}`}>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  Your Waitlist
                </h2>
                <div className="space-y-3">
                  {sampleWaitlist.map(item => (
                    <div key={item.id} className={`p-4 rounded-lg ${styles.border} border`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">{item.event}</h3>
                          <p className={`text-sm ${styles.textMuted}`}>{item.ticketType} Ticket</p>
                        </div>
                        <div className="text-right">
                          <div className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">
                            Position #{item.position}
                          </div>
                        </div>
                      </div>
                      <p className={`text-sm ${styles.textMuted}`}>
                        Estimated notification: {item.estimatedNotification}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic Pricing */}
              <div className={`${styles.card} rounded-xl p-6 shadow-lg border ${styles.border}`}>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  Dynamic Pricing
                </h2>
                <div className={`p-4 rounded-lg ${styles.border} border mb-4`}>
                  <div className="flex justify-between items-center mb-4">
                    <span className={styles.textMuted}>Base Price</span>
                    <span className="font-semibold">₨2,500</span>
                  </div>
                  <div className="flex justify-between items-center mb-4 text-green-600">
                    <span>Early Bird Discount (-20%)</span>
                    <span className="font-semibold">-₨500</span>
                  </div>
                  <div className="flex justify-between items-center mb-4 text-blue-600">
                    <span>Group Discount (5+ tickets)</span>
                    <span className="font-semibold">-₨250</span>
                  </div>
                  <div className="border-t pt-4 flex justify-between items-center text-lg font-bold">
                    <span>Final Price</span>
                    <span className="text-blue-600">₨1,750</span>
                  </div>
                </div>
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold">
                  Purchase Now
                </button>
              </div>

              {/* Season Pass */}
              <div className={`${styles.card} rounded-xl p-6 shadow-lg border ${styles.border} bg-gradient-to-br from-purple-500 to-pink-500 text-white`}>
                <h2 className="text-xl font-bold mb-2">Season Pass 2026</h2>
                <p className="mb-4 opacity-90">Unlimited access to all events</p>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-3xl font-bold">₨15,000</p>
                    <p className="opacity-90 text-sm">One-time payment</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">50+</p>
                    <p className="opacity-90 text-sm">Events included</p>
                  </div>
                </div>
                <button className="w-full px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-gray-100 transition-all font-semibold">
                  Get Season Pass
                </button>
              </div>
            </>
          )}

          {/* Check-in System */}
          {activeTab === 'checkin' && (
            <>
              {/* Check-in Stations */}
              <div className={`${styles.card} rounded-xl p-6 shadow-lg border ${styles.border}`}>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-purple-600" />
                  Check-in Stations
                </h2>
                <div className="space-y-3">
                  {sampleStations.map(station => (
                    <div key={station.id} className={`p-4 rounded-lg ${styles.border} border`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold">{station.name}</h3>
                          <p className={`text-sm ${styles.textMuted}`}>{station.type}</p>
                        </div>
                        <div className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm font-semibold">
                          {station.status}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                          <p className="text-2xl font-bold text-blue-600">{station.checkins}</p>
                          <p className={`text-sm ${styles.textMuted}`}>Check-ins</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-green-600">{station.avgTime}</p>
                          <p className={`text-sm ${styles.textMuted}`}>Avg Time</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* QR Scanner */}
              <div className={`${styles.card} rounded-xl p-6 shadow-lg border ${styles.border}`}>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-blue-600" />
                  Quick Check-in
                </h2>
                <div className="aspect-square bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-lg flex items-center justify-center mb-4">
                  <div className="text-center">
                    <QrCode className={`w-24 h-24 mx-auto mb-4 ${styles.textMuted}`} />
                    <p className={styles.textMuted}>Scan QR code to check-in</p>
                  </div>
                </div>
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold">
                  Open Camera
                </button>
              </div>

              {/* Walk-in Registration */}
              <div className={`${styles.card} rounded-xl p-6 shadow-lg border ${styles.border}`}>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-green-600" />
                  Walk-in Registration
                </h2>
                <div className="space-y-3">
                  <input
                    placeholder="Full Name"
                    className={`w-full px-4 py-2 ${styles.border} border rounded-lg ${styles.bg}`}
                  />
                  <input
                    placeholder="Email Address"
                    type="email"
                    className={`w-full px-4 py-2 ${styles.border} border rounded-lg ${styles.bg}`}
                  />
                  <input
                    placeholder="Phone Number"
                    type="tel"
                    className={`w-full px-4 py-2 ${styles.border} border rounded-lg ${styles.bg}`}
                  />
                  <select className={`w-full px-4 py-2 ${styles.border} border rounded-lg ${styles.bg}`}>
                    <option>Standard - ₨500</option>
                    <option>VIP - ₨1,500</option>
                  </select>
                  <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-semibold">
                    Register & Check-in
                  </button>
                </div>
              </div>
            </>
          )}

          {/* PWA Features */}
          {activeTab === 'pwa' && (
            <>
              {/* Offline Tickets */}
              <div className={`${styles.card} rounded-xl p-6 shadow-lg border ${styles.border}`}>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-blue-600" />
                  My Tickets (Offline Access)
                </h2>
                <div className="space-y-3">
                  {[1, 2].map(i => (
                    <div key={i} className={`p-4 rounded-lg ${styles.border} border`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold">Tech Summit 2026</h3>
                          <p className={`text-sm ${styles.textMuted}`}>March 15, 2026 • 9:00 AM</p>
                        </div>
                        <div className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                          Available Offline
                        </div>
                      </div>
                      <div className="aspect-square w-32 bg-gray-200 dark:bg-gray-700 rounded-lg mx-auto" />
                      <p className={`text-center text-sm ${styles.textMuted} mt-2`}>QR Code</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Push Notifications */}
              <div className={`${styles.card} rounded-xl p-6 shadow-lg border ${styles.border}`}>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-purple-600" />
                  Push Notifications
                </h2>
                <div className="space-y-3">
                  {[
                    { label: 'Event Reminders', desc: 'Get notified before events' },
                    { label: 'Check-in Updates', desc: 'Queue status and updates' },
                    { label: 'Promotions', desc: 'Special offers and deals' }
                  ].map((pref, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{pref.label}</p>
                        <p className={`text-sm ${styles.textMuted}`}>{pref.desc}</p>
                      </div>
                      <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                        <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Install App */}
              <div className={`${styles.card} rounded-xl p-6 shadow-lg border ${styles.border} bg-gradient-to-br from-blue-500 to-purple-600 text-white`}>
                <h2 className="text-xl font-bold mb-2">Install FSTIVO App</h2>
                <p className="mb-4 opacity-90">Get instant access to your tickets, even offline!</p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Offline ticket access
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Fast check-in with QR codes
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Push notifications
                  </li>
                </ul>
                <button className="w-full px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-all font-semibold">
                  Install Now
                </button>
              </div>
            </>
          )}

          {/* Preferences */}
          {activeTab === 'preferences' && (
            <>
              {/* Theme Settings */}
              <div className={`${styles.card} rounded-xl p-6 shadow-lg border ${styles.border}`}>
                <h2 className="text-xl font-bold mb-4">Appearance</h2>
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold mb-2">Theme</p>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'light', label: 'Light', icon: Sun },
                        { id: 'dark', label: 'Dark', icon: Moon },
                        { id: 'system', label: 'System', icon: Monitor }
                      ].map(t => {
                        const Icon = t.icon;
                        return (
                          <button
                            key={t.id}
                            onClick={() => setTheme(t.id as 'light' | 'dark')}
                            className={`p-4 rounded-lg ${styles.border} border ${styles.hover} transition-all ${
                              theme === t.id ? 'ring-2 ring-blue-500' : ''
                            }`}
                          >
                            <Icon className="w-6 h-6 mx-auto mb-2" />
                            <p className="text-sm">{t.label}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold mb-2">Font Size</p>
                    <div className="flex gap-2">
                      {['Small', 'Medium', 'Large'].map(size => (
                        <button key={size} className={`flex-1 px-4 py-2 ${styles.border} border rounded-lg ${styles.hover} transition-all`}>
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Notification Preferences */}
              <div className={`${styles.card} rounded-xl p-6 shadow-lg border ${styles.border}`}>
                <h2 className="text-xl font-bold mb-4">Notifications</h2>
                <div className="space-y-3">
                  {[
                    { label: 'Email Notifications', desc: 'Event updates via email' },
                    { label: 'SMS Alerts', desc: 'Important alerts via SMS' },
                    { label: 'WhatsApp Updates', desc: 'Get updates on WhatsApp' },
                    { label: 'Push Notifications', desc: 'App notifications' }
                  ].map((pref, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{pref.label}</p>
                        <p className={`text-sm ${styles.textMuted}`}>{pref.desc}</p>
                      </div>
                      <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                        <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">

          {/* Friends List (Social Tab) */}
          {activeTab === 'social' && (
            <div className={`${styles.card} rounded-xl p-6 shadow-lg border ${styles.border}`}>
              <h2 className="text-lg font-bold mb-4">Friends at Event</h2>
              <div className="space-y-3">
                {sampleFriends.map(friend => (
                  <div key={friend.id} className={`flex items-center gap-3 p-3 rounded-lg ${styles.hover} cursor-pointer transition-all`}>
                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {friend.avatar}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{friend.name}</p>
                      <p className={`text-xs ${styles.textMuted} flex items-center gap-1`}>
                        {friend.online && <div className="w-2 h-2 bg-green-500 rounded-full" />}
                        {friend.status}
                      </p>
                    </div>
                    <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-all">
                      Message
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className={`${styles.card} rounded-xl p-6 shadow-lg border ${styles.border}`}>
            <h2 className="text-lg font-bold mb-4">Quick Stats</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className={styles.textMuted}>Total Events</span>
                <span className="font-bold text-blue-600">24</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={styles.textMuted}>Check-ins</span>
                <span className="font-bold text-green-600">18</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={styles.textMuted}>Connections</span>
                <span className="font-bold text-purple-600">156</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={styles.textMuted}>Photos Shared</span>
                <span className="font-bold text-pink-600">42</span>
              </div>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className={`${styles.card} rounded-xl p-6 shadow-lg border ${styles.border} bg-gradient-to-br from-indigo-500 to-purple-600 text-white`}>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Phase 2 Features
            </h2>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Social feed & networking
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Referral rewards system
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Event photo galleries
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Dynamic ticket pricing
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Waitlist management
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Bundle & season passes
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                QR code check-in
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Walk-in registration
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Offline PWA access
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Dark mode support
              </li>
            </ul>
          </div>

          {/* System Status */}
          <div className={`${styles.card} rounded-xl p-6 shadow-lg border ${styles.border}`}>
            <h2 className="text-lg font-bold mb-4">System Status</h2>
            <div className="space-y-3">
              {[
                { label: 'API Status', status: 'Operational' },
                { label: 'Database', status: 'Operational' },
                { label: 'Check-in System', status: 'Operational' }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className={`text-sm ${styles.textMuted}`}>{item.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm text-green-600">{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Stats */}
      <div className={`${styles.card} rounded-xl p-6 mt-6 shadow-lg border ${styles.border}`}>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-1">32</div>
            <div className={`text-sm ${styles.textMuted}`}>API Endpoints</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">26</div>
            <div className={`text-sm ${styles.textMuted}`}>Database Tables</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-1">30+</div>
            <div className={`text-sm ${styles.textMuted}`}>New Features</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-pink-600 mb-1">100%</div>
            <div className={`text-sm ${styles.textMuted}`}>Mobile Ready</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-indigo-600 mb-1">$30K</div>
            <div className={`text-sm ${styles.textMuted}`}>Market Value</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Phase2Demo;
