'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface PerformanceDashboardProps {
  campaignId: string;
  dateRange?: { start: string; end: string };
}

export function PerformanceDashboard({ campaignId, dateRange }: PerformanceDashboardProps) {
  const [metrics, setMetrics] = useState<any>(null);
  const [dailyStats, setDailyStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPerformanceData();
  }, [campaignId, dateRange]);

  async function loadPerformanceData() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        campaign_id: campaignId,
        start_date: dateRange?.start || '',
        end_date: dateRange?.end || ''
      });

      const response = await fetch(`/api/ads/analytics?${params}`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics);
        setDailyStats(data.daily_stats);
      }
    } catch (error) {
      logger.error('Error loading performance data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg" />
          ))}
        </div>
        <div className="h-80 bg-gray-200 rounded-lg" />
      </div>
    );
  }

  if (!metrics) {
    return <div>No performance data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          title="Impressions"
          value={metrics.impressions.toLocaleString()}
          change={metrics.impressions_change}
          icon="👁️"
        />
        <MetricCard
          title="Clicks"
          value={metrics.clicks.toLocaleString()}
          change={metrics.clicks_change}
          icon="🖱️"
        />
        <MetricCard
          title="CTR"
          value={`${metrics.ctr.toFixed(2)}%`}
          change={metrics.ctr_change}
          icon="📊"
        />
        <MetricCard
          title="Total Spend"
          value={`PKR ${metrics.spend.toLocaleString()}`}
          change={metrics.spend_change}
          icon="💰"
        />
      </div>

      {/* Budget Utilization */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="font-semibold mb-4">Budget Utilization</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Spent: PKR {metrics.spent_amount.toLocaleString()}</span>
            <span>Total: PKR {metrics.total_budget.toLocaleString()}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all"
              style={{
                width: `${Math.min((metrics.spent_amount / metrics.total_budget) * 100, 100)}%`
              }}
            />
          </div>
          <p className="text-sm text-gray-600">
            {((metrics.spent_amount / metrics.total_budget) * 100).toFixed(1)}% utilized
          </p>
        </div>
      </div>

      {/* Impressions & Clicks Over Time */}
      {dailyStats.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="font-semibold mb-4">Performance Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="impressions"
                stroke="#3b82f6"
                name="Impressions"
              />
              <Line
                type="monotone"
                dataKey="clicks"
                stroke="#10b981"
                name="Clicks"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Daily Spend */}
      {dailyStats.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="font-semibold mb-4">Daily Spend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="spend" fill="#8b5cf6" name="Spend (PKR)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Secondary Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <SecondaryMetricCard
          title="Avg. CPC"
          value={`PKR ${metrics.avg_cpc.toFixed(2)}`}
        />
        <SecondaryMetricCard
          title="Avg. CPM"
          value={`PKR ${metrics.avg_cpm.toFixed(2)}`}
        />
        <SecondaryMetricCard
          title="Conversions"
          value={metrics.conversions.toLocaleString()}
        />
        <SecondaryMetricCard
          title="ROAS"
          value={`${metrics.roas.toFixed(2)}x`}
        />
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  change?: number;
  icon: string;
}

function MetricCard({ title, value, change, icon }: MetricCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        {change !== undefined && (
          <span
            className={`text-sm font-medium ${
              change >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {change >= 0 ? '+' : ''}
            {change.toFixed(1)}%
          </span>
        )}
      </div>
      <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

interface SecondaryMetricCardProps {
  title: string;
  value: string;
}

function SecondaryMetricCard({ title, value }: SecondaryMetricCardProps) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="text-gray-600 text-xs font-medium mb-1">{title}</h3>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
