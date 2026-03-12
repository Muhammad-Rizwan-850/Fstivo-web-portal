'use client'

import React, { useState, useEffect } from 'react';
import {
  Bell, Mail, MessageSquare, MessageCircle, Calendar,
  ShoppingBag, Users, Shield, Newspaper, Tag, Clock,
  Check, X, Loader2, ChevronDown, ChevronUp, Moon,
  Smartphone, Save, AlertCircle, CheckCircle2, Info, PlayCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

const NotificationPreferences = () => {
  const [preferences, setPreferences] = useState<any>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    event: true,
    ticket: false,
    social: false,
    system: false,
    marketing: false,
  });
  const [globalSettings, setGlobalSettings] = useState({
    global_enabled: true,
    quiet_hours_enabled: false,
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00',
    timezone: 'Asia/Karachi',
  });
  const [verifiedContacts, setVerifiedContacts] = useState<any>({});
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyChannel, setVerifyChannel] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [verifyToken, setVerifyToken] = useState('');

  const categoryInfo = {
    event: { name: 'Event Notifications', icon: Calendar, color: 'from-pink-500 to-purple-600', description: 'Stay updated about your events' },
    ticket: { name: 'Ticket & Payments', icon: ShoppingBag, color: 'from-purple-500 to-indigo-600', description: 'Transaction and ticket updates' },
    social: { name: 'Social & Networking', icon: Users, color: 'from-indigo-500 to-blue-600', description: 'Connect with other attendees' },
    system: { name: 'Security & Account', icon: Shield, color: 'from-blue-500 to-cyan-600', description: 'Important security alerts' },
    marketing: { name: 'News & Promotions', icon: Newspaper, color: 'from-cyan-500 to-teal-600', description: 'Updates and special offers' },
  };

  const channelIcons: Record<string, React.ComponentType<any>> = {
    email: Mail,
    sms: MessageSquare,
    push: Bell,
    whatsapp: MessageCircle,
  };

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('user_notification_preferences')
        .select(`
          *,
          notification_types(name, display_name, category, icon),
          notification_channels(name)
        `);

      if (error) throw error;

      // Group by category and format
      const grouped: any = {};
      data?.forEach((pref: any) => {
        const category = pref.notification_types?.category;
        if (!grouped[category]) {
          grouped[category] = [];
        }

        const existing = grouped[category].find((p: any) => p.type === pref.notification_types?.name);
        if (existing) {
          existing[pref.notification_channels?.name] = pref.is_enabled;
        } else {
          grouped[category].push({
            id: pref.id,
            type: pref.notification_types?.name,
            name: pref.notification_types?.display_name,
            icon: pref.notification_types?.icon,
            email: pref.notification_channels?.name === 'email' ? pref.is_enabled : false,
            sms: pref.notification_channels?.name === 'sms' ? pref.is_enabled : false,
            push: pref.notification_channels?.name === 'push' ? pref.is_enabled : false,
            whatsapp: pref.notification_channels?.name === 'whatsapp' ? pref.is_enabled : false,
          });
        }
      });

      setPreferences(grouped);

      // Fetch settings
      const { data: settings } = await supabase
        .from('user_notification_settings')
        .select('*')
        .single();

      if (settings) {
        setGlobalSettings(settings);
      }

      // Fetch verified contacts
      const { data: contacts } = await supabase
        .from('user_contact_verification')
        .select(`
          *,
          notification_channels(name)
        `)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      const contactsMap: any = {};
      contacts?.forEach((contact: any) => {
        contactsMap[contact.notification_channels?.name] = {
          value: contact.contact_value,
          verified: contact.is_verified,
        };
      });

      setVerifiedContacts(contactsMap);

    } catch (error) {
      logger.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev: Record<string, boolean>) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const toggleNotification = (category: string, index: number, channel: string) => {
    setPreferences((prev: any) => ({
      ...prev,
      [category]: prev[category].map((item: any, i: number) =>
        i === index ? { ...item, [channel]: !item[channel] } : item
      ),
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {

      // Build preferences array
      const prefsArray: any[] = [];
      Object.entries(preferences).forEach(([category, items]: [string, any]) => {
        items.forEach((item: any) => {
          ['email', 'sms', 'push', 'whatsapp'].forEach(channel => {
            prefsArray.push({
              notificationType: item.type,
              channel,
              enabled: item[channel],
            });
          });
        });
      });

      await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences: prefsArray,
          settings: globalSettings,
        }),
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      logger.error('Error saving preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const startVerification = async (channel: string) => {
    try {
      const response = await fetch('/api/notifications/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel,
          contactValue: prompt(`Enter your ${channel} address/number:`),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setVerifyChannel(channel);
        setShowVerifyModal(true);
        setVerifyToken(data.token);
        if (data.code) {
          logger.info('Verification code:', data.code);
        }
      }
    } catch (error) {
      logger.error('Error starting verification:', error);
    }
  };

  const submitVerification = async () => {
    try {
      const response = await fetch('/api/notifications/verify', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verifyToken, code: verifyCode }),
      });

      const data = await response.json();
      if (data.success) {
        setVerifiedContacts((prev: any) => ({
          ...prev,
          [verifyChannel]: { ...prev[verifyChannel], verified: true },
        }));
        setShowVerifyModal(false);
      }
    } catch (error) {
      logger.error('Error verifying:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
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
              <Bell className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Notification Preferences</h1>
              <p className="text-pink-100 mt-2">Control how and when you hear from us</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Global Settings */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="w-6 h-6 text-white" />
                    <h3 className="text-xl font-bold text-white">Global Settings</h3>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={globalSettings.global_enabled}
                      onChange={(e) => setGlobalSettings(prev => ({ ...prev, global_enabled: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-7 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-white/40"></div>
                  </label>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Quiet Hours */}
                <div className="flex items-start gap-4">
                  <Moon className="w-5 h-5 text-purple-600 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">Quiet Hours</h4>
                        <p className="text-sm text-gray-600">Pause non-critical notifications</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={globalSettings.quiet_hours_enabled}
                          onChange={(e) => setGlobalSettings(prev => ({ ...prev, quiet_hours_enabled: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-pink-500 peer-checked:to-purple-600"></div>
                      </label>
                    </div>
                    {globalSettings.quiet_hours_enabled && (
                      <div className="flex gap-4 mt-3">
                        <div>
                          <label className="text-xs text-gray-600 block mb-1">Start</label>
                          <input
                            type="time"
                            value={globalSettings.quiet_hours_start}
                            onChange={(e) => setGlobalSettings(prev => ({ ...prev, quiet_hours_start: e.target.value }))}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 block mb-1">End</label>
                          <input
                            type="time"
                            value={globalSettings.quiet_hours_end}
                            onChange={(e) => setGlobalSettings(prev => ({ ...prev, quiet_hours_end: e.target.value }))}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Notification Categories */}
            {Object.entries(categoryInfo).map(([key, info]) => {
              const Icon = info.icon;
              const isExpanded = expandedCategories[key];
              const categoryPrefs = preferences[key] || [];

              return (
                <div key={key} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => toggleCategory(key)}
                    className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${info.color} rounded-xl flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-bold text-gray-900">{info.name}</h3>
                        <p className="text-sm text-gray-600">{info.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-600">
                        {categoryPrefs.length} types
                      </span>
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-200">
                      {/* Channel Headers */}
                      <div className="grid grid-cols-5 gap-4 px-6 py-3 bg-gray-50 text-xs font-medium text-gray-600">
                        <div className="col-span-1">Notification</div>
                        {Object.entries(channelIcons).map(([channel, ChannelIcon]) => (
                          <div key={channel} className="flex items-center justify-center gap-1">
                            <ChannelIcon className="w-4 h-4" />
                            <span className="capitalize">{channel}</span>
                          </div>
                        ))}
                      </div>

                      {/* Notification Rows */}
                      {categoryPrefs.map((pref: any, index: number) => (
                        <div key={pref.type} className="grid grid-cols-5 gap-4 px-6 py-4 border-t border-gray-100 hover:bg-gray-50">
                          <div className="col-span-1 flex items-center">
                            <span className="text-sm font-medium text-gray-900">{pref.name}</span>
                          </div>
                          {['email', 'sms', 'push', 'whatsapp'].map(channel => (
                            <div key={channel} className="flex items-center justify-center">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={pref[channel]}
                                  onChange={() => toggleNotification(key, index, channel)}
                                  className="sr-only peer"
                                  disabled={channel !== 'email' && channel !== 'push' && !verifiedContacts[channel]?.verified}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-pink-500 peer-checked:to-purple-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                              </label>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Save Button */}
            <div className="sticky bottom-4">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : saveSuccess ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Saved Successfully!
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Preferences
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Verification */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-purple-600" />
                Verified Contacts
              </h3>
              <div className="space-y-3">
                {Object.entries(channelIcons).map(([channel, ChannelIcon]) => (
                  <div key={channel} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <ChannelIcon className="w-5 h-5 text-gray-600" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 capitalize">{channel}</div>
                        <div className="text-xs text-gray-600">{verifiedContacts[channel]?.value || 'Not added'}</div>
                      </div>
                    </div>
                    {verifiedContacts[channel]?.verified ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <button
                        onClick={() => startVerification(channel)}
                        className="text-xs font-medium text-purple-600 hover:text-purple-700"
                      >
                        Verify
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-200 p-6">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">About Notifications</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600">•</span>
                      <span>Email is always available</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600">•</span>
                      <span>Verify your phone for SMS/WhatsApp</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600">•</span>
                      <span>Critical alerts ignore quiet hours</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600">•</span>
                      <span>Push notifications are free</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                {React.createElement(channelIcons[verifyChannel], { className: "w-8 h-8 text-white" })}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Verify {verifyChannel}</h3>
              <p className="text-gray-600">Enter the 6-digit code sent to your {verifyChannel}</p>
            </div>

            <input
              type="text"
              maxLength={6}
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full text-center text-3xl font-bold tracking-widest px-4 py-4 border-2 border-gray-300 rounded-xl focus:border-purple-600 focus:outline-none mb-6"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowVerifyModal(false)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={submitVerification}
                disabled={verifyCode.length !== 6}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
              >
                Verify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPreferences;
