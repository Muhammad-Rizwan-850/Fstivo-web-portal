'use client'

import React, { useState, useEffect } from 'react';

interface KPICard {
  title: string;
  value: string;
  change: string;
  positive: boolean;
}

interface TrafficSource {
  source: string;
  visitors: number;
  percentage: number;
}

interface FunnelStage {
  name: string;
  count: number;
  percentage: number;
}

interface DashboardStats {
  revenue: string;
  revenueChange: string;
  ticketsSold: string;
  ticketsChange: string;
  checkInRate: string;
  checkInChange: string;
  conversionRate: string;
  conversionChange: string;
}

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    revenue: '$24,580',
    revenueChange: '+12.5%',
    ticketsSold: '1,234',
    ticketsChange: '+8.2%',
    checkInRate: '78.5%',
    checkInChange: '+3.1%',
    conversionRate: '4.2%',
    conversionChange: '+0.8%',
  });

  const [revenueData, setRevenueData] = useState([
    { date: 'Jan 1', revenue: 3200 },
    { date: 'Jan 2', revenue: 4100 },
    { date: 'Jan 3', revenue: 3800 },
    { date: 'Jan 4', revenue: 5200 },
    { date: 'Jan 5', revenue: 4800 },
    { date: 'Jan 6', revenue: 3500 },
    { date: 'Jan 7', revenue: 4200 },
  ]);

  const [funnelStages] = useState<FunnelStage[]>([
    { name: 'Impressions', count: 15420, percentage: 100 },
    { name: 'Page Views', count: 8730, percentage: 57 },
    { name: 'Ticket Selection', count: 3210, percentage: 37 },
    { name: 'Checkout Started', count: 1890, percentage: 22 },
    { name: 'Purchase Completed', count: 1234, percentage: 65 },
  ]);

  const [trafficSources] = useState<TrafficSource[]>([
    { source: 'Google', visitors: 4520, percentage: 35.2 },
    { source: 'Facebook', visitors: 3210, percentage: 25.0 },
    { source: 'Instagram', visitors: 2890, percentage: 22.5 },
    { source: 'Direct', visitors: 1230, percentage: 9.6 },
    { source: 'Twitter', visitors: 980, percentage: 7.7 },
  ]);

  const [activities] = useState([
    { time: '2 min ago', action: 'New ticket purchase', user: 'John D.', details: '2 VIP tickets' },
    { time: '5 min ago', action: 'Check-in recorded', user: 'Sarah M.', details: 'General Admission' },
    { time: '8 min ago', action: 'Page view', user: 'Guest', details: 'Event page' },
    { time: '12 min ago', action: 'New ticket purchase', user: 'Mike R.', details: '1 Early Bird' },
    { time: '15 min ago', action: 'Check-in recorded', user: 'Emma L.', details: 'VIP' },
  ]);

  const [demographics] = useState({
    ageGroups: [
      { range: '18-24', percentage: 28 },
      { range: '25-34', percentage: 42 },
      { range: '35-44', percentage: 21 },
      { range: '45-54', percentage: 7 },
      { range: '55+', percentage: 2 },
    ],
    gender: [
      { label: 'Male', percentage: 45 },
      { label: 'Female', percentage: 48 },
      { label: 'Other', percentage: 7 },
    ],
    cities: [
      { name: 'New York', count: 423 },
      { name: 'Los Angeles', count: 312 },
      { name: 'Chicago', count: 245 },
      { name: 'Houston', count: 156 },
      { name: 'Phoenix', count: 98 },
    ],
  });

  const renderKPICard = (kpi: KPICard) => (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-sm font-medium text-gray-500 mb-1">{kpi.title}</h3>
      <p className="text-3xl font-bold text-gray-900 mb-2">{kpi.value}</p>
      <span className={`text-sm font-medium ${kpi.positive ? 'text-green-600' : 'text-red-600'}`}>
        {kpi.change}
      </span>
    </div>
  );

  const maxRevenue = Math.max(...revenueData.map(d => d.revenue));

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Event Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Real-time insights and performance metrics</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {renderKPICard({
            title: 'Total Revenue',
            value: stats.revenue,
            change: stats.revenueChange,
            positive: true,
          })}
          {renderKPICard({
            title: 'Tickets Sold',
            value: stats.ticketsSold,
            change: stats.ticketsChange,
            positive: true,
          })}
          {renderKPICard({
            title: 'Check-in Rate',
            value: stats.checkInRate,
            change: stats.checkInChange,
            positive: true,
          })}
          {renderKPICard({
            title: 'Conversion Rate',
            value: stats.conversionRate,
            change: stats.conversionChange,
            positive: true,
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Revenue Trend Chart */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Revenue Trend (Last 7 Days)</h2>
            <div className="space-y-4">
              {revenueData.map((data, index) => (
                <div key={index} className="flex items-center">
                  <span className="w-16 text-sm text-gray-600">{data.date}</span>
                  <div className="flex-1 mx-4 bg-gray-100 rounded-full h-8 relative">
                    <div
                      className="bg-indigo-600 h-8 rounded-full transition-all duration-300"
                      style={{ width: `${(data.revenue / maxRevenue) * 100}%` }}
                    />
                  </div>
                  <span className="w-20 text-right text-sm font-medium text-gray-900">
                    ${data.revenue.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Real-time Activity Feed */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Live Activity</h2>
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <div key={index} className="border-l-2 border-indigo-600 pl-4 py-2">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-600">{activity.user} - {activity.details}</p>
                  <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Marketing Funnel */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Marketing Funnel</h2>
            <div className="space-y-4">
              {funnelStages.map((stage, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">{stage.name}</span>
                    <span className="text-sm text-gray-500">{stage.count.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${stage.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Traffic Sources */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Traffic Sources</h2>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 text-sm font-medium text-gray-700">Source</th>
                  <th className="text-right py-3 text-sm font-medium text-gray-700">Visitors</th>
                  <th className="text-right py-3 text-sm font-medium text-gray-700">%</th>
                </tr>
              </thead>
              <tbody>
                {trafficSources.map((source, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3 text-sm text-gray-900">{source.source}</td>
                    <td className="py-3 text-sm text-gray-600 text-right">{source.visitors.toLocaleString()}</td>
                    <td className="py-3 text-sm text-gray-600 text-right">{source.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Age Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Age Distribution</h2>
            <div className="space-y-3">
              {demographics.ageGroups.map((group, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-700">{group.range}</span>
                    <span className="text-sm text-gray-500">{group.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${group.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gender Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Gender Distribution</h2>
            <div className="space-y-3">
              {demographics.gender.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-700">{item.label}</span>
                    <span className="text-sm text-gray-500">{item.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Cities */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Top Cities</h2>
            <div className="space-y-3">
              {demographics.cities.map((city, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">{city.name}</span>
                  <span className="text-sm font-medium text-gray-900">{city.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
