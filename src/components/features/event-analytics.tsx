'use client'

import React, { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Calendar, TrendingUp, Users, DollarSign, Download, RefreshCw, ArrowUp, ArrowDown, Activity, Clock, MapPin, Ticket, Zap, AlertCircle, Mail, Send, X, Check, ChevronLeft, ChevronRight, Bell, Plus, Edit2, Trash2, Power, PowerOff, Layout, GripVertical, ChevronUp, ChevronDown, Eye, Save } from 'lucide-react'
import { logger } from '@/lib/logger';

interface AdvancedAnalyticsDashboardProps {
  eventId?: string
}

type ScheduleFrequency = 'weekly' | 'monthly'

interface BaseSchedule {
  id: number
  name: string
  frequency: ScheduleFrequency
  time: string
  recipients: string
  format: 'pdf' | 'excel' | 'both'
  active: boolean
  nextRun: string
}

interface WeeklySchedule extends BaseSchedule {
  frequency: 'weekly'
  dayOfWeek: string
  dayOfMonth?: never
}

interface MonthlySchedule extends BaseSchedule {
  frequency: 'monthly'
  dayOfMonth: string
  dayOfWeek?: never
}

type SavedSchedule = WeeklySchedule | MonthlySchedule

interface Widget {
  id: string
  name: string
  icon: string
  category: 'metrics' | 'charts' | 'tables'
  description: string
}

interface SavedReport {
  id: number
  name: string
  widgets: string[]
  createdAt: string
  lastViewed: string
}

const AdvancedAnalyticsDashboard: React.FC<AdvancedAnalyticsDashboardProps> = ({ eventId }) => {
  const [dateRange, setDateRange] = useState('30days')
  const [selectedMetric, setSelectedMetric] = useState('all')
  const [compareMode, setCompareMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [error, setError] = useState<string | null>(null)

  // Real-time data states
  const [kpiData, setKpiData] = useState({
    totalRevenue: 4200000,
    revenueChange: 23.5,
    totalEvents: 248,
    eventsChange: 18.2,
    totalAttendees: 12450,
    attendeesChange: 31.7,
    avgCheckinRate: 87.3,
    checkinChange: 4.2
  })

  const [revenueData, setRevenueData] = useState([
    { month: 'Jan', current: 45000, previous: 32000, target: 50000 },
    { month: 'Feb', current: 52000, previous: 38000, target: 55000 },
    { month: 'Mar', current: 61000, previous: 45000, target: 60000 },
    { month: 'Apr', current: 58000, previous: 41000, target: 65000 },
    { month: 'May', current: 72000, previous: 52000, target: 70000 },
    { month: 'Jun', current: 85000, previous: 61000, target: 80000 },
  ])

  const [registrationTrends, setRegistrationTrends] = useState([
    { date: 'Week 1', registrations: 245, checkIns: 198, target: 250 },
    { date: 'Week 2', registrations: 312, checkIns: 276, target: 300 },
    { date: 'Week 3', registrations: 389, checkIns: 341, target: 350 },
    { date: 'Week 4', registrations: 428, checkIns: 389, target: 400 },
  ])

  const [eventTypeDistribution, setEventTypeDistribution] = useState([
    { name: 'Technical Workshops', value: 35, count: 24 },
    { name: 'Conferences', value: 25, count: 18 },
    { name: 'Networking', value: 20, count: 14 },
    { name: 'Competitions', value: 15, count: 11 },
    { name: 'Social Events', value: 5, count: 4 },
  ])

  const [universityPerformance, setUniversityPerformance] = useState([
    { name: 'LUMS', events: 45, attendees: 2850, revenue: 285000, growth: 23 },
    { name: 'NUST', events: 38, attendees: 2340, revenue: 234000, growth: 18 },
    { name: 'UET', events: 42, attendees: 2520, revenue: 252000, growth: 15 },
    { name: 'FAST', events: 35, attendees: 2100, revenue: 210000, growth: 28 },
    { name: 'COMSATS', events: 31, attendees: 1860, revenue: 186000, growth: 12 },
  ])

  const [hourlyActivity, setHourlyActivity] = useState([
    { hour: '9AM', activity: 45 },
    { hour: '10AM', activity: 78 },
    { hour: '11AM', activity: 125 },
    { hour: '12PM', activity: 189 },
    { hour: '1PM', activity: 156 },
    { hour: '2PM', activity: 203 },
    { hour: '3PM', activity: 178 },
    { hour: '4PM', activity: 145 },
    { hour: '5PM', activity: 98 },
  ])

  // Heatmap data - Engagement by day and hour
  const [heatmapData, setHeatmapData] = useState([
    { day: 'Mon', '9AM': 45, '10AM': 78, '11AM': 125, '12PM': 189, '1PM': 156, '2PM': 203, '3PM': 178, '4PM': 145, '5PM': 98 },
    { day: 'Tue', '9AM': 52, '10AM': 85, '11AM': 142, '12PM': 198, '1PM': 167, '2PM': 215, '3PM': 189, '4PM': 156, '5PM': 112 },
    { day: 'Wed', '9AM': 67, '10AM': 95, '11AM': 158, '12PM': 215, '1PM': 178, '2PM': 234, '3PM': 198, '4PM': 167, '5PM': 125 },
    { day: 'Thu', '9AM': 58, '10AM': 89, '11AM': 145, '12PM': 203, '1PM': 172, '2PM': 225, '3PM': 192, '4PM': 158, '5PM': 118 },
    { day: 'Fri', '9AM': 72, '10AM': 102, '11AM': 167, '12PM': 225, '1PM': 189, '2PM': 245, '3PM': 208, '4PM': 178, '5PM': 142 },
    { day: 'Sat', '9AM': 38, '10AM': 62, '11AM': 98, '12PM': 145, '1PM': 125, '2PM': 167, '3PM': 142, '4PM': 115, '5PM': 85 },
    { day: 'Sun', '9AM': 25, '10AM': 45, '11AM': 78, '12PM': 112, '1PM': 95, '2PM': 135, '3PM': 118, '4PM': 92, '5PM': 68 },
  ])

  // Funnel data - Registration to attendance conversion
  const [funnelData, setFunnelData] = useState([
    { stage: 'Event Views', value: 10000, percentage: 100, color: '#6366f1' },
    { stage: 'Started Registration', value: 4500, percentage: 45, color: '#8b5cf6' },
    { stage: 'Completed Registration', value: 3200, percentage: 32, color: '#a855f7' },
    { stage: 'Payment Completed', value: 2800, percentage: 28, color: '#c084fc' },
    { stage: 'Attended Event', value: 2450, percentage: 24.5, color: '#e0a2ff' },
  ])

  // Geographic heatmap data
  const [geoData, setGeoData] = useState([
    { city: 'Lahore', events: 145, attendees: 8920, revenue: 1245000, lat: 31.5204, lng: 74.3587 },
    { city: 'Karachi', events: 128, attendees: 7650, revenue: 1089000, lat: 24.8607, lng: 67.0011 },
    { city: 'Islamabad', events: 98, attendees: 5840, revenue: 876000, lat: 33.6844, lng: 73.0479 },
    { city: 'Rawalpindi', events: 76, attendees: 4320, revenue: 648000, lat: 33.5651, lng: 73.0169 },
    { city: 'Faisalabad', events: 62, attendees: 3560, revenue: 534000, lat: 31.4504, lng: 73.1350 },
    { city: 'Multan', events: 54, attendees: 3120, revenue: 468000, lat: 30.1575, lng: 71.5249 },
  ])

  const [predictiveInsights, setPredictiveInsights] = useState({
    predictedRevenue: 5800000,
    avgTicketValue: 337,
    growthRate: 28.4
  })

  // Custom Report Builder State
  const [showReportBuilder, setShowReportBuilder] = useState(false)
  const [reportName, setReportName] = useState('')
  const [selectedWidgets, setSelectedWidgets] = useState<string[]>([])
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null)
  const [savedReports, setSavedReports] = useState<SavedReport[]>([
    {
      id: 1,
      name: 'Executive Summary',
      widgets: ['kpi', 'revenue', 'funnel'],
      createdAt: '2024-12-15',
      lastViewed: '2024-12-18'
    },
    {
      id: 2,
      name: 'University Performance',
      widgets: ['universities', 'geo', 'events'],
      createdAt: '2024-12-10',
      lastViewed: '2024-12-17'
    }
  ])
  const [activeReportId, setActiveReportId] = useState<number | null>(null)

  const availableWidgets: Widget[] = [
    { id: 'kpi', name: 'KPI Cards', icon: '📊', category: 'metrics', description: 'Key performance indicators' },
    { id: 'revenue', name: 'Revenue Trends', icon: '💰', category: 'charts', description: 'Monthly revenue analysis' },
    { id: 'registrations', name: 'Registration Trends', icon: '📈', category: 'charts', description: 'Weekly registrations' },
    { id: 'events', name: 'Event Distribution', icon: '🎯', category: 'charts', description: 'Event type breakdown' },
    { id: 'universities', name: 'University Rankings', icon: '🏆', category: 'tables', description: 'Performance rankings' },
    { id: 'funnel', name: 'Conversion Funnel', icon: '⏬', category: 'charts', description: 'User journey analysis' },
    { id: 'heatmap', name: 'Engagement Heatmap', icon: '🔥', category: 'charts', description: 'Weekly activity patterns' },
    { id: 'geo', name: 'Geographic Map', icon: '🗺️', category: 'charts', description: 'City-wise performance' },
    { id: 'hourly', name: 'Hourly Activity', icon: '⏰', category: 'charts', description: 'Peak hours analysis' },
    { id: 'insights', name: 'Predictive Insights', icon: '🔮', category: 'metrics', description: 'AI predictions' },
  ]

  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailForm, setEmailForm] = useState({
    recipients: '',
    subject: '',
    message: '',
    includeCharts: true,
    includeTables: true,
    format: 'both'
  })
  const [emailSending, setEmailSending] = useState(false)
  const [emailSuccess, setEmailSuccess] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [customStartDate, setCustomStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
  const [customEndDate, setCustomEndDate] = useState(new Date())
  const [calendarView, setCalendarView] = useState<'start' | 'end'>('start')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [scheduleForm, setScheduleForm] = useState({
    name: '',
    frequency: 'weekly',
    dayOfWeek: '1',
    dayOfMonth: '1',
    time: '09:00',
    recipients: '',
    format: 'both',
    includeCharts: true,
    includeTables: true,
    active: true
  })
  const [savedSchedules, setSavedSchedules] = useState<SavedSchedule[]>([
    {
      id: 1,
      name: 'Weekly Executive Report',
      frequency: 'weekly',
      dayOfWeek: '1',
      time: '09:00',
      recipients: 'ceo@fstivo.com, cfo@fstivo.com',
      format: 'both',
      active: true,
      nextRun: 'Monday, Dec 23 at 9:00 AM'
    },
    {
      id: 2,
      name: 'Monthly Performance Summary',
      frequency: 'monthly',
      dayOfMonth: '1',
      time: '08:00',
      recipients: 'board@fstivo.com',
      format: 'pdf',
      active: true,
      nextRun: 'Jan 1, 2025 at 8:00 AM'
    }
  ])

  // Fetch all data
  const fetchAllData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Update with random variations to simulate live data
      setKpiData(prev => ({
        totalRevenue: prev.totalRevenue + Math.random() * 10000 - 5000,
        revenueChange: prev.revenueChange + Math.random() * 2 - 1,
        totalEvents: prev.totalEvents + Math.floor(Math.random() * 5),
        eventsChange: prev.eventsChange + Math.random() * 2 - 1,
        totalAttendees: prev.totalAttendees + Math.floor(Math.random() * 50),
        attendeesChange: prev.attendeesChange + Math.random() * 2 - 1,
        avgCheckinRate: Math.min(100, Math.max(0, prev.avgCheckinRate + Math.random() * 2 - 1)),
        checkinChange: Math.random() * 2 - 1
      }))

      setLastUpdate(new Date())
    } catch (err) {
      setError('Failed to fetch analytics data. Please try again.')
      logger.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchAllData()

    // Simulate real-time updates every 30 seconds
    const interval = setInterval(() => {
      fetchAllData()
    }, 30000)

    return () => clearInterval(interval)
  }, [dateRange, selectedMetric])

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981']

  const kpiCards = [
    {
      title: 'Total Revenue',
      value: `Rs${(kpiData.totalRevenue / 1000000).toFixed(1)}M`,
      change: `${kpiData.revenueChange > 0 ? '+' : ''}${kpiData.revenueChange.toFixed(1)}%`,
      trend: kpiData.revenueChange > 0 ? 'up' : 'down',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Total Events',
      value: kpiData.totalEvents.toString(),
      change: `${kpiData.eventsChange > 0 ? '+' : ''}${kpiData.eventsChange.toFixed(1)}%`,
      trend: kpiData.eventsChange > 0 ? 'up' : 'down',
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Total Attendees',
      value: kpiData.totalAttendees.toLocaleString(),
      change: `${kpiData.attendeesChange > 0 ? '+' : ''}${kpiData.attendeesChange.toFixed(1)}%`,
      trend: kpiData.attendeesChange > 0 ? 'up' : 'down',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Avg. Check-in Rate',
      value: `${kpiData.avgCheckinRate.toFixed(1)}%`,
      change: `${kpiData.checkinChange > 0 ? '+' : ''}${kpiData.checkinChange.toFixed(1)}%`,
      trend: kpiData.checkinChange > 0 ? 'up' : 'down',
      icon: Activity,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
  ]

  const formatDateRange = () => {
    return `${customStartDate.toLocaleDateString()} - ${customEndDate.toLocaleDateString()}`
  }

  const exportToPDF = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank')

    if (!printWindow) {
      alert('Please allow popups to export PDF')
      return
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Fstivo Analytics Report - ${new Date().toLocaleDateString()}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 40px; color: #1f2937; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #6366f1; padding-bottom: 20px; }
            .header h1 { color: #6366f1; font-size: 32px; margin-bottom: 10px; }
            .header p { color: #6b7280; font-size: 14px; }
            .meta-info { display: flex; justify-content: space-between; margin-bottom: 30px; padding: 15px; background: #f9fafb; border-radius: 8px; }
            .meta-item { text-align: center; }
            .meta-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
            .meta-value { font-size: 16px; font-weight: bold; color: #1f2937; margin-top: 5px; }
            .section { margin-bottom: 40px; page-break-inside: avoid; }
            .section-title { font-size: 20px; font-weight: bold; color: #1f2937; margin-bottom: 20px; border-left: 4px solid #6366f1; padding-left: 12px; }
            .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
            .kpi-card { background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; }
            .kpi-title { font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 8px; }
            .kpi-value { font-size: 28px; font-weight: bold; color: #1f2937; margin-bottom: 5px; }
            .kpi-change { font-size: 14px; font-weight: 600; }
            .kpi-change.positive { color: #10b981; }
            .kpi-change.negative { color: #ef4444; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            thead { background: #f9fafb; }
            th { padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; border-bottom: 2px solid #e5e7eb; }
            td { padding: 12px; font-size: 14px; border-bottom: 1px solid #f3f4f6; }
            tr:hover { background: #f9fafb; }
            .rank { font-weight: bold; color: #6366f1; }
            .growth-badge { display: inline-block; padding: 4px 12px; background: #d1fae5; color: #065f46; border-radius: 12px; font-size: 12px; font-weight: 600; }
            .footer { margin-top: 60px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px; }
            .insights { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 20px; }
            .insight-card { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 20px; border-radius: 8px; }
            .insight-title { font-size: 14px; opacity: 0.9; margin-bottom: 8px; }
            .insight-value { font-size: 32px; font-weight: bold; margin-bottom: 5px; }
            .insight-desc { font-size: 12px; opacity: 0.8; }
            @media print {
              body { padding: 20px; }
              .section { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 Fstivo Analytics Report</h1>
            <p>Platform Performance Overview</p>
          </div>

          <div class="meta-info">
            <div class="meta-item">
              <div class="meta-label">Report Date</div>
              <div class="meta-value">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Period</div>
              <div class="meta-value">${dateRange === '7days' ? 'Last 7 Days' : dateRange === '30days' ? 'Last 30 Days' : dateRange === '90days' ? 'Last 90 Days' : 'Last 12 Months'}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Generated At</div>
              <div class="meta-value">${new Date().toLocaleTimeString()}</div>
            </div>
          </div>

          <div class="section">
            <h2 class="section-title">Key Performance Indicators</h2>
            <div class="kpi-grid">
              ${kpiCards.map(kpi => `
                <div class="kpi-card">
                  <div class="kpi-title">${kpi.title}</div>
                  <div class="kpi-value">${kpi.value}</div>
                  <div class="kpi-change ${kpi.trend === 'up' ? 'positive' : 'negative'}">
                    ${kpi.change} vs previous period
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="section">
            <h2 class="section-title">University Performance Rankings</h2>
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>University</th>
                  <th style="text-align: center;">Events</th>
                  <th style="text-align: center;">Attendees</th>
                  <th style="text-align: right;">Revenue</th>
                  <th style="text-align: center;">Growth</th>
                  <th style="text-align: right;">Avg/Event</th>
                </tr>
              </thead>
              <tbody>
                ${universityPerformance.map((uni, index) => `
                  <tr>
                    <td class="rank">#${index + 1}</td>
                    <td><strong>${uni.name}</strong></td>
                    <td style="text-align: center;">${uni.events}</td>
                    <td style="text-align: center;">${uni.attendees.toLocaleString()}</td>
                    <td style="text-align: right;">Rs${(uni.revenue / 1000).toFixed(0)}K</td>
                    <td style="text-align: center;"><span class="growth-badge">+${uni.growth}%</span></td>
                    <td style="text-align: right;">Rs${(uni.revenue / uni.events / 1000).toFixed(1)}K</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2 class="section-title">Event Type Distribution</h2>
            <table>
              <thead>
                <tr>
                  <th>Event Type</th>
                  <th style="text-align: center;">Count</th>
                  <th style="text-align: right;">Percentage</th>
                </tr>
              </thead>
              <tbody>
                ${eventTypeDistribution.map(type => `
                  <tr>
                    <td><strong>${type.name}</strong></td>
                    <td style="text-align: center;">${type.count}</td>
                    <td style="text-align: right;">${type.value.toFixed(1)}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2 class="section-title">Predictive Insights</h2>
            <div class="insights">
              <div class="insight-card">
                <div class="insight-title">Predicted Next Month</div>
                <div class="insight-value">Rs${(predictiveInsights.predictedRevenue / 1000000).toFixed(1)}M</div>
                <div class="insight-desc">+38% from current month</div>
              </div>
              <div class="insight-card" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
                <div class="insight-title">Avg. Ticket Value</div>
                <div class="insight-value">Rs${predictiveInsights.avgTicketValue}</div>
                <div class="insight-desc">+12% from last period</div>
              </div>
              <div class="insight-card" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
                <div class="insight-title">Growth Rate</div>
                <div class="insight-value">+${predictiveInsights.growthRate.toFixed(1)}%</div>
                <div class="insight-desc">Month-over-month</div>
              </div>
            </div>
          </div>

          <div class="footer">
            <p><strong>Fstivo</strong> - Event Management Platform</p>
            <p>© ${new Date().getFullYear()} Fstivo. All rights reserved.</p>
            <p style="margin-top: 10px;">This report was automatically generated from real-time platform data.</p>
          </div>
        </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()

    // Wait for content to load then trigger print
    setTimeout(() => {
      printWindow.print()
    }, 500)
  }

  const exportToExcel = () => {
    // Create comprehensive Excel data
    const excelData: (string | number)[][] = []

    // Add header
    excelData.push(['FSTIVO ANALYTICS REPORT'])
    excelData.push([`Generated: ${new Date().toLocaleString()}`])
    excelData.push([`Period: ${dateRange}`])
    excelData.push([])

    // KPI Summary
    excelData.push(['KEY PERFORMANCE INDICATORS'])
    excelData.push(['Metric', 'Value', 'Change', 'Trend'])
    kpiCards.forEach(kpi => {
      excelData.push([kpi.title, kpi.value, kpi.change, kpi.trend === 'up' ? '↑' : '↓'])
    })
    excelData.push([])

    // University Performance
    excelData.push(['UNIVERSITY PERFORMANCE'])
    excelData.push(['Rank', 'University', 'Events', 'Attendees', 'Revenue (PKR)', 'Growth %', 'Avg per Event (PKR)'])
    universityPerformance.forEach((uni, index) => {
      excelData.push([
        `#${index + 1}`,
        uni.name,
        uni.events,
        uni.attendees,
        uni.revenue,
        `${uni.growth}%`,
        (uni.revenue / uni.events).toFixed(2)
      ])
    })
    excelData.push([])

    // Event Type Distribution
    excelData.push(['EVENT TYPE DISTRIBUTION'])
    excelData.push(['Event Type', 'Count', 'Percentage'])
    eventTypeDistribution.forEach(type => {
      excelData.push([type.name, type.count, `${type.value.toFixed(1)}%`])
    })
    excelData.push([])

    // Revenue Trends
    excelData.push(['REVENUE TRENDS'])
    excelData.push(['Month', 'Current (PKR)', 'Previous (PKR)', 'Target (PKR)', 'Growth'])
    revenueData.forEach(month => {
      const growth = month.previous ? (((month.current - month.previous) / month.previous) * 100).toFixed(1) : 0
      excelData.push([
        month.month,
        month.current,
        month.previous,
        month.target,
        `${growth}%`
      ])
    })
    excelData.push([])

    // Registration Trends
    excelData.push(['REGISTRATION TRENDS'])
    excelData.push(['Period', 'Registrations', 'Check-ins', 'Check-in Rate %'])
    registrationTrends.forEach(week => {
      const rate = ((week.checkIns / week.registrations) * 100).toFixed(1)
      excelData.push([week.date, week.registrations, week.checkIns, `${rate}%`])
    })
    excelData.push([])

    // Hourly Activity
    excelData.push(['HOURLY ACTIVITY'])
    excelData.push(['Hour', 'Activity Count'])
    hourlyActivity.forEach(hour => {
      excelData.push([hour.hour, hour.activity])
    })
    excelData.push([])

    // Predictive Insights
    excelData.push(['PREDICTIVE INSIGHTS'])
    excelData.push(['Metric', 'Value'])
    excelData.push(['Predicted Next Month Revenue', `PKR ${predictiveInsights.predictedRevenue.toLocaleString()}`])
    excelData.push(['Average Ticket Value', `PKR ${predictiveInsights.avgTicketValue}`])
    excelData.push(['Growth Rate', `${predictiveInsights.growthRate.toFixed(1)}%`])

    // Convert to CSV format
    const csvContent = excelData.map(row =>
      row.map(cell => {
        // Escape cells containing commas or quotes
        const cellStr = String(cell)
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`
        }
        return cellStr
      }).join(',')
    ).join('\n')

    // Create blob and download
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', `fstivo-analytics-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportReport = (format: 'pdf' | 'excel') => {
    if (format === 'pdf') {
      exportToPDF()
    } else if (format === 'excel') {
      exportToExcel()
    }
  }

  const sendEmailReport = async () => {
    setEmailSending(true)

    try {
      // Generate email HTML content
      const emailHTML = generateEmailHTML()

      // In production, call your email API
      logger.info('Email sent to:', emailForm.recipients)
      logger.info('Subject:', emailForm.subject)
      logger.info('HTML Preview:', emailHTML.substring(0, 500))

      setEmailSuccess(true)
      setTimeout(() => {
        setShowEmailModal(false)
        setEmailSuccess(false)
        setEmailForm({
          recipients: '',
          subject: '',
          message: '',
          includeCharts: true,
          includeTables: true,
          format: 'both'
        })
      }, 2000)

    } catch (error) {
      logger.error('Error sending email:', error)
      alert('Failed to send email. Please try again.')
    } finally {
      setEmailSending(false)
    }
  }

  const generateEmailHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Fstivo Analytics Report</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #f9fafb; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 40px 30px; text-align: center; }
            .header h1 { font-size: 28px; margin-bottom: 8px; }
            .header p { font-size: 14px; opacity: 0.9; }
            .content { padding: 30px; }
            .message { background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #6366f1; }
            .message p { color: #4b5563; line-height: 1.6; }
            .section { margin-bottom: 30px; }
            .section-title { font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 16px; }
            .kpi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; }
            .kpi-card { background: #f9fafb; padding: 20px; border-radius: 8px; text-align: center; }
            .kpi-label { font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 8px; }
            .kpi-value { font-size: 24px; font-weight: bold; color: #1f2937; margin-bottom: 4px; }
            .kpi-change { font-size: 14px; font-weight: 600; }
            .kpi-change.positive { color: #10b981; }
            .kpi-change.negative { color: #ef4444; }
            .table-container { overflow-x: auto; }
            table { width: 100%; border-collapse: collapse; font-size: 14px; }
            thead { background: #f9fafb; }
            th { padding: 12px; text-align: left; font-weight: 600; color: #6b7280; font-size: 12px; text-transform: uppercase; border-bottom: 2px solid #e5e7eb; }
            td { padding: 12px; color: #4b5563; border-bottom: 1px solid #f3f4f6; }
            .rank { font-weight: 600; color: #6366f1; }
            .growth-badge { display: inline-block; padding: 4px 10px; background: #d1fae5; color: #065f46; border-radius: 12px; font-size: 11px; font-weight: 600; }
            .insights { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 24px; border-radius: 8px; margin: 20px 0; }
            .insights h3 { font-size: 16px; margin-bottom: 16px; }
            .insight-item { margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.2); }
            .insight-item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
            .insight-label { font-size: 12px; opacity: 0.9; margin-bottom: 4px; }
            .insight-value { font-size: 22px; font-weight: bold; }
            .cta-button { display: inline-block; background: #6366f1; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
            .footer { background: #f9fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; }
            .footer-links { margin-top: 16px; }
            .footer-links a { color: #6366f1; text-decoration: none; margin: 0 12px; }
            @media only screen and (max-width: 600px) {
              .kpi-grid { grid-template-columns: 1fr; }
              .container { border-radius: 0; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📊 Analytics Report</h1>
              <p>Fstivo Platform Performance - ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>

            <div class="content">
              ${emailForm.message ? `
                <div class="message">
                  <p>${emailForm.message.replace(/\n/g, '<br>')}</p>
                </div>
              ` : ''}

              <div class="section">
                <h2 class="section-title">📈 Key Performance Indicators</h2>
                <div class="kpi-grid">
                  ${kpiCards.map(kpi => `
                    <div class="kpi-card">
                      <div class="kpi-label">${kpi.title}</div>
                      <div class="kpi-value">${kpi.value}</div>
                      <div class="kpi-change ${kpi.trend === 'up' ? 'positive' : 'negative'}">
                        ${kpi.change} vs previous
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>

              ${emailForm.includeTables ? `
                <div class="section">
                  <h2 class="section-title">🏆 Top Universities</h2>
                  <div class="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>University</th>
                          <th style="text-align: center;">Events</th>
                          <th style="text-align: right;">Revenue</th>
                          <th style="text-align: center;">Growth</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${universityPerformance.slice(0, 5).map((uni, index) => `
                          <tr>
                            <td class="rank">#${index + 1}</td>
                            <td><strong>${uni.name}</strong></td>
                            <td style="text-align: center;">${uni.events}</td>
                            <td style="text-align: right;">Rs${(uni.revenue / 1000).toFixed(0)}K</td>
                            <td style="text-align: center;"><span class="growth-badge">+${uni.growth}%</span></td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </div>
                </div>
              ` : ''}

              <div class="insights">
                <h3>🔮 Predictive Insights</h3>
                <div class="insight-item">
                  <div class="insight-label">Predicted Next Month Revenue</div>
                  <div class="insight-value">Rs${(predictiveInsights.predictedRevenue / 1000000).toFixed(1)}M</div>
                </div>
                <div class="insight-item">
                  <div class="insight-label">Average Ticket Value</div>
                  <div class="insight-value">Rs${predictiveInsights.avgTicketValue}</div>
                </div>
                <div class="insight-item">
                  <div class="insight-label">Month-over-Month Growth</div>
                  <div class="insight-value">+${predictiveInsights.growthRate.toFixed(1)}%</div>
                </div>
              </div>

              <center>
                <a href="https://fstivo.com/dashboard" class="cta-button">View Full Dashboard →</a>
              </center>
            </div>

            <div class="footer">
              <p><strong>Fstivo</strong> - Event Management Platform</p>
              <p style="margin-top: 8px;">This report was automatically generated from real-time platform data.</p>
              <div class="footer-links">
                <a href="https://fstivo.com">Website</a>
                <a href="https://fstivo.com/support">Support</a>
                <a href="https://fstivo.com/privacy">Privacy</a>
              </div>
              <p style="margin-top: 16px; color: #9ca3af;">
                © ${new Date().getFullYear()} Fstivo. All rights reserved.
              </p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  const toggleScheduleActive = (id: number) => {
    setSavedSchedules(prev =>
      prev.map(schedule =>
        schedule.id === id ? { ...schedule, active: !schedule.active } : schedule
      )
    )
  }

  const deleteSchedule = (id: number) => {
    setSavedSchedules(prev => prev.filter(schedule => schedule.id !== id))
  }

  const saveSchedule = () => {
    const baseSchedule = {
      id: Date.now(),
      name: scheduleForm.name,
      time: scheduleForm.time,
      recipients: scheduleForm.recipients,
      format: scheduleForm.format as 'pdf' | 'excel' | 'both',
      active: true,
      nextRun: scheduleForm.frequency === 'weekly'
        ? `Monday at ${scheduleForm.time}`
        : `Day ${scheduleForm.dayOfMonth} at ${scheduleForm.time}`
    }

    const newSchedule: SavedSchedule = scheduleForm.frequency === 'weekly'
      ? {
          ...baseSchedule,
          frequency: 'weekly',
          dayOfWeek: scheduleForm.dayOfWeek
        }
      : {
          ...baseSchedule,
          frequency: 'monthly',
          dayOfMonth: scheduleForm.dayOfMonth
        }

    setSavedSchedules(prev => [...prev, newSchedule])
    setShowScheduleModal(false)
    setScheduleForm({
      name: '',
      frequency: 'weekly',
      dayOfWeek: '1',
      dayOfMonth: '1',
      time: '09:00',
      recipients: '',
      format: 'both',
      includeCharts: true,
      includeTables: true,
      active: true
    })
  }

  // Custom Report Builder Functions
  const addWidgetToReport = (widgetId: string) => {
    if (!selectedWidgets.includes(widgetId)) {
      setSelectedWidgets([...selectedWidgets, widgetId])
    }
  }

  const removeWidgetFromReport = (widgetId: string) => {
    setSelectedWidgets(selectedWidgets.filter(w => w !== widgetId))
  }

  const saveCustomReport = () => {
    if (!reportName || selectedWidgets.length === 0) return

    const newReport: SavedReport = {
      id: Date.now(),
      name: reportName,
      widgets: [...selectedWidgets],
      createdAt: new Date().toISOString().split('T')[0],
      lastViewed: new Date().toISOString().split('T')[0]
    }

    setSavedReports(prev => [...prev, newReport])
    setShowReportBuilder(false)
    setReportName('')
    setSelectedWidgets([])
  }

  const deleteReport = (reportId: number) => {
    setSavedReports(prev => prev.filter(r => r.id !== reportId))
    if (activeReportId === reportId) {
      setActiveReportId(null)
    }
  }

  const viewReport = (reportId: number) => {
    setActiveReportId(reportId)
    const report = savedReports.find(r => r.id === reportId)
    if (report) {
      setSelectedWidgets([...report.widgets])
      setSavedReports(prev =>
        prev.map(r =>
          r.id === reportId ? { ...r, lastViewed: new Date().toISOString().split('T')[0] } : r
        )
      )
    }
  }

  const handleDragStart = (widgetId: string) => {
    setDraggedWidget(widgetId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (targetWidgetId: string) => {
    if (draggedWidget && draggedWidget !== targetWidgetId) {
      const draggedIndex = selectedWidgets.indexOf(draggedWidget)
      const targetIndex = selectedWidgets.indexOf(targetWidgetId)

      if (draggedIndex !== -1 && targetIndex !== -1) {
        const newWidgets = [...selectedWidgets]
        newWidgets.splice(draggedIndex, 1)
        newWidgets.splice(targetIndex, 0, draggedWidget)
        setSelectedWidgets(newWidgets)
      }
    }
    setDraggedWidget(null)
  }

  const getWidgetComponent = (widgetId: string) => {
    switch (widgetId) {
      case 'kpi':
        return <div key={widgetId} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpiCards.map((kpi, index) => {
              const Icon = kpi.icon
              return (
                <div key={index} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`${kpi.bgColor} p-3 rounded-lg`}>
                      <Icon className={`w-6 h-6 ${kpi.color}`} />
                    </div>
                    <div className={`flex items-center gap-1 text-sm font-medium ${kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {kpi.trend === 'up' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                      {kpi.change}
                    </div>
                  </div>
                  <h3 className="text-gray-600 text-sm font-medium mb-1">{kpi.title}</h3>
                  <p className="text-3xl font-bold text-gray-900">{kpi.value}</p>
                </div>
              )
            })}
          </div>
        </div>
      case 'revenue':
        return <div key={widgetId} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Revenue Trends</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
              <Area type="monotone" dataKey="current" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorCurrent)" />
              <Line type="monotone" dataKey="target" stroke="#9ca3af" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      case 'registrations':
        return <div key={widgetId} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Registration vs Check-in Trends</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={registrationTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
              <Legend />
              <Bar dataKey="registrations" fill="#6366f1" radius={[8, 8, 0, 0]} />
              <Bar dataKey="checkIns" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      case 'events':
        return <div key={widgetId} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Event Type Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={eventTypeDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {eventTypeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      case 'universities':
        return <div key={widgetId} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">University Performance Ranking</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Rank</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">University</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Events</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Attendees</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Revenue</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Growth</th>
                </tr>
              </thead>
              <tbody>
                {universityPerformance.map((uni, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <span className="font-bold text-gray-900">#{index + 1}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{uni.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center text-gray-700">{uni.events}</td>
                    <td className="py-4 px-4 text-center text-gray-700">{uni.attendees.toLocaleString()}</td>
                    <td className="py-4 px-4 text-right font-medium text-gray-900">
                      Rs{(uni.revenue / 1000).toFixed(0)}K
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        <ArrowUp className="w-3 h-3" />
                        {uni.growth}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      case 'funnel':
        return <div key={widgetId} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Conversion Funnel</h2>
          <div className="space-y-3">
            {funnelData.map((stage, index) => (
              <div key={index} className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">{stage.stage}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900">{stage.value.toLocaleString()}</span>
                    <span className="text-xs font-medium text-gray-500">{stage.percentage}%</span>
                  </div>
                </div>
                <div className="relative h-12 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-lg transition-all duration-500 flex items-center justify-end pr-4"
                    style={{
                      width: `${stage.percentage}%`,
                      background: `linear-gradient(90deg, ${stage.color}, ${stage.color}dd)`
                    }}
                  >
                    {stage.percentage > 15 && (
                      <span className="text-white font-semibold text-sm">
                        {stage.value.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      case 'heatmap':
        return <div key={widgetId} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Weekly Engagement Heatmap</h2>
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              <div className="flex items-center mb-2">
                <div className="w-16"></div>
                {['9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM'].map(hour => (
                  <div key={hour} className="w-20 text-center text-xs font-semibold text-gray-600">{hour}</div>
                ))}
              </div>
              {heatmapData.map((dayData, dayIndex) => (
                <div key={dayIndex} className="flex items-center mb-1">
                  <div className="w-16 text-sm font-semibold text-gray-700">{dayData.day}</div>
                  {['9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM'].map((hour, hourIndex) => {
                    const value = dayData[hour as keyof typeof dayData] as number
                    const maxValue = 245
                    const intensity = (value / maxValue) * 100
                    const opacity = 0.2 + (intensity / 100) * 0.8
                    return (
                      <div
                        key={hourIndex}
                        className="w-20 h-12 mx-0.5 rounded flex items-center justify-center text-xs font-semibold"
                        style={{ backgroundColor: `rgba(99, 102, 241, ${opacity})`, color: intensity > 50 ? 'white' : '#1f2937' }}
                      >
                        {value}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      case 'geo':
        return <div key={widgetId} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Geographic Performance</h2>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-sm font-semibold text-gray-700">City</th>
                <th className="text-center py-2 text-sm font-semibold text-gray-700">Events</th>
                <th className="text-center py-2 text-sm font-semibold text-gray-700">Attendees</th>
                <th className="text-right py-2 text-sm font-semibold text-gray-700">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {geoData.map((city, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-8 rounded" style={{ backgroundColor: '#6366f1', opacity: 0.4 + (city.events / 145) * 0.6 }}></div>
                      <span className="font-medium text-gray-900">{city.city}</span>
                    </div>
                  </td>
                  <td className="py-3 text-center text-gray-700">{city.events}</td>
                  <td className="py-3 text-center text-gray-700">{city.attendees.toLocaleString()}</td>
                  <td className="py-3 text-right font-medium text-gray-900">Rs{(city.revenue / 1000).toFixed(0)}K</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      case 'hourly':
        return <div key={widgetId} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Peak Activity Hours</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={hourlyActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="hour" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
              <Bar dataKey="activity" fill="#6366f1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      case 'insights':
        return <div key={widgetId} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
            <Activity className="w-8 h-8 mb-3 opacity-80" />
            <h3 className="text-lg font-bold mb-2">Predicted Next Month</h3>
            <p className="text-3xl font-bold mb-1">Rs{(predictiveInsights.predictedRevenue / 1000000).toFixed(1)}M</p>
            <p className="text-sm opacity-90">+38% from current month</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white">
            <Ticket className="w-8 h-8 mb-3 opacity-80" />
            <h3 className="text-lg font-bold mb-2">Avg. Ticket Value</h3>
            <p className="text-3xl font-bold mb-1">Rs{predictiveInsights.avgTicketValue}</p>
            <p className="text-sm opacity-90">+12% from last period</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-6 text-white">
            <TrendingUp className="w-8 h-8 mb-3 opacity-80" />
            <h3 className="text-lg font-bold mb-2">Growth Rate</h3>
            <p className="text-3xl font-bold mb-1">+{predictiveInsights.growthRate.toFixed(1)}%</p>
            <p className="text-sm opacity-90">Month-over-month</p>
          </div>
        </div>
      default:
        return null
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-lg max-w-md w-full">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">Error Loading Analytics</h2>
          <p className="text-gray-600 text-center mb-6">{error}</p>
          <button
            onClick={fetchAllData}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
            <div className="flex items-center gap-3">
              <p className="text-gray-600">Track your platform performance and insights</p>
              <div className="flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4 text-green-500 animate-pulse" />
                <span className="text-green-600 font-medium">Live</span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-500">Updated {lastUpdate.toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCompareMode(!compareMode)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                compareMode
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Compare Periods
            </button>
            <button
              onClick={fetchAllData}
              disabled={loading}
              className="p-2 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => {
                const value = e.target.value
                if (value === 'custom') {
                  setShowDatePicker(true)
                } else {
                  setDateRange(value)
                }
              }}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none pr-10"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="12months">Last 12 Months</option>
              <option value="custom">{dateRange === 'custom' ? formatDateRange() : 'Custom Range'}</option>
            </select>
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">All Metrics</option>
            <option value="revenue">Revenue Only</option>
            <option value="attendees">Attendees Only</option>
            <option value="events">Events Only</option>
          </select>

          <div className="ml-auto flex gap-2">
            <button
              onClick={() => setShowReportBuilder(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
            >
              <Plus className="w-4 h-4" />
              Custom Report
            </button>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 font-medium"
            >
              <Bell className="w-4 h-4" />
              Schedule Reports
            </button>
            <button
              onClick={() => setShowEmailModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 font-medium"
            >
              <Mail className="w-4 h-4" />
              Email Report
            </button>
            <button
              onClick={() => exportReport('pdf')}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
            <button
              onClick={() => exportReport('excel')}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Excel
            </button>
          </div>
        </div>
      </div>

      {loading && !kpiData ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {kpiCards.map((kpi, index) => {
              const Icon = kpi.icon
              return (
                <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`${kpi.bgColor} p-3 rounded-lg`}>
                      <Icon className={`w-6 h-6 ${kpi.color}`} />
                    </div>
                    <div className={`flex items-center gap-1 text-sm font-medium ${kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {kpi.trend === 'up' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                      {kpi.change}
                    </div>
                  </div>
                  <h3 className="text-gray-600 text-sm font-medium mb-1">{kpi.title}</h3>
                  <p className="text-3xl font-bold text-gray-900">{kpi.value}</p>
                </div>
              )
            })}
          </div>

          {/* Revenue Trends */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Revenue Trends</h2>
                <p className="text-sm text-gray-600 mt-1">Monthly revenue comparison with targets</p>
              </div>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>
                  <span className="text-gray-600">Current Period</span>
                </div>
                {compareMode && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                    <span className="text-gray-600">Previous Period</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  <span className="text-gray-600">Target</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPrevious" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Area type="monotone" dataKey="current" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorCurrent)" />
                {compareMode && (
                  <Area type="monotone" dataKey="previous" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorPrevious)" />
                )}
                <Line type="monotone" dataKey="target" stroke="#9ca3af" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Two Column Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Registration Trends */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Registration vs Check-in Trends</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={registrationTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Bar dataKey="registrations" fill="#6366f1" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="checkIns" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Event Type Distribution */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Event Type Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={eventTypeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {eventTypeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* University Performance Table */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">University Performance Ranking</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Rank</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">University</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Events</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Attendees</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Revenue</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Growth</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Avg. per Event</th>
                  </tr>
                </thead>
                <tbody>
                  {universityPerformance.map((uni, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <span className="font-bold text-gray-900">#{index + 1}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{uni.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center text-gray-700">{uni.events}</td>
                      <td className="py-4 px-4 text-center text-gray-700">{uni.attendees.toLocaleString()}</td>
                      <td className="py-4 px-4 text-right font-medium text-gray-900">
                        Rs{(uni.revenue / 1000).toFixed(0)}K
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                          <ArrowUp className="w-3 h-3" />
                          {uni.growth}%
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right text-gray-700">
                        Rs{(uni.revenue / uni.events / 1000).toFixed(1)}K
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Conversion Funnel */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Conversion Funnel</h2>
                <p className="text-sm text-gray-600 mt-1">From event view to attendance</p>
              </div>
              <TrendingUp className="w-6 h-6 text-indigo-600" />
            </div>

            <div className="space-y-3">
              {funnelData.map((stage, index) => (
                <div key={index} className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{stage.stage}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-gray-900">{stage.value.toLocaleString()}</span>
                      <span className="text-xs font-medium text-gray-500">{stage.percentage}%</span>
                    </div>
                  </div>
                  <div className="relative h-12 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 rounded-lg transition-all duration-500 flex items-center justify-end pr-4"
                      style={{
                        width: `${stage.percentage}%`,
                        background: `linear-gradient(90deg, ${stage.color}, ${stage.color}dd)`
                      }}
                    >
                      {stage.percentage > 15 && (
                        <span className="text-white font-semibold text-sm">
                          {stage.value.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  {index < funnelData.length - 1 && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-xs text-gray-400">
                      ↓ {((funnelData[index + 1].value / stage.value) * 100).toFixed(1)}%
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600">
                  {((funnelData[funnelData.length - 1].value / funnelData[0].value) * 100).toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600 mt-1">Overall Conversion</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {((funnelData[2].value / funnelData[0].value) * 100).toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600 mt-1">Registration Rate</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {((funnelData[4].value / funnelData[3].value) * 100).toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600 mt-1">Attendance Rate</p>
              </div>
            </div>
          </div>

          {/* Engagement Heatmap */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Weekly Engagement Heatmap</h2>
                <p className="text-sm text-gray-600 mt-1">Registration activity by day and hour</p>
              </div>
              <Activity className="w-6 h-6 text-indigo-600" />
            </div>

            <div className="overflow-x-auto">
              <div className="inline-block min-w-full">
                {/* Hour headers */}
                <div className="flex items-center mb-2">
                  <div className="w-16"></div>
                  {['9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM'].map(hour => (
                    <div key={hour} className="w-20 text-center text-xs font-semibold text-gray-600">
                      {hour}
                    </div>
                  ))}
                </div>

                {/* Heatmap grid */}
                {heatmapData.map((dayData, dayIndex) => (
                  <div key={dayIndex} className="flex items-center mb-1">
                    <div className="w-16 text-sm font-semibold text-gray-700">
                      {dayData.day}
                    </div>
                    {['9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM'].map((hour, hourIndex) => {
                      const value = dayData[hour as keyof typeof dayData] as number
                      const maxValue = 245
                      const intensity = (value / maxValue) * 100
                      const opacity = 0.2 + (intensity / 100) * 0.8

                      return (
                        <div
                          key={hourIndex}
                          className="w-20 h-12 mx-0.5 rounded flex items-center justify-center text-xs font-semibold transition-all hover:scale-110 cursor-pointer group relative"
                          style={{
                            backgroundColor: `rgba(99, 102, 241, ${opacity})`,
                            color: intensity > 50 ? 'white' : '#1f2937'
                          }}
                          title={`${dayData.day} ${hour}: ${value} registrations`}
                        >
                          {value}
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            {value} registrations
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-center gap-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-4 rounded" style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)' }}></div>
                <span className="text-xs text-gray-600">Low</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-4 rounded" style={{ backgroundColor: 'rgba(99, 102, 241, 0.5)' }}></div>
                <span className="text-xs text-gray-600">Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-4 rounded" style={{ backgroundColor: 'rgba(99, 102, 241, 1)' }}></div>
                <span className="text-xs text-gray-600">High</span>
              </div>
            </div>
          </div>

          {/* Geographic Heatmap */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Geographic Performance</h2>
                <p className="text-sm text-gray-600 mt-1">Event distribution across cities</p>
              </div>
              <MapPin className="w-6 h-6 text-indigo-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* City bubbles visualization */}
              <div className="relative h-96 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-8">
                <div className="absolute inset-0 flex items-center justify-center">
                  {geoData.map((city, index) => {
                    const size = 40 + (city.events / 145) * 120
                    const positions = [
                      { top: '15%', left: '20%' },
                      { top: '45%', left: '65%' },
                      { top: '25%', left: '70%' },
                      { top: '60%', left: '25%' },
                      { top: '70%', left: '60%' },
                      { top: '55%', left: '45%' },
                    ]

                    return (
                      <div
                        key={index}
                        className="absolute rounded-full bg-indigo-600 opacity-70 hover:opacity-100 transition-all cursor-pointer flex items-center justify-center group"
                        style={{
                          width: `${size}px`,
                          height: `${size}px`,
                          ...positions[index]
                        }}
                      >
                        <div className="text-white text-center">
                          <div className="font-bold text-xs">{city.city}</div>
                          <div className="text-xs">{city.events}</div>
                        </div>
                        <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-gray-900 text-white p-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                          <div className="font-semibold mb-1">{city.city}</div>
                          <div className="text-xs space-y-0.5">
                            <div>Events: {city.events}</div>
                            <div>Attendees: {city.attendees.toLocaleString()}</div>
                            <div>Revenue: Rs{(city.revenue / 1000).toFixed(0)}K</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* City rankings table */}
              <div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 text-sm font-semibold text-gray-700">City</th>
                      <th className="text-center py-2 text-sm font-semibold text-gray-700">Events</th>
                      <th className="text-center py-2 text-sm font-semibold text-gray-700">Attendees</th>
                      <th className="text-right py-2 text-sm font-semibold text-gray-700">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {geoData.map((city, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-8 rounded"
                              style={{
                                backgroundColor: '#6366f1',
                                opacity: 0.4 + (city.events / 145) * 0.6
                              }}
                            ></div>
                            <span className="font-medium text-gray-900">{city.city}</span>
                          </div>
                        </td>
                        <td className="py-3 text-center text-gray-700">{city.events}</td>
                        <td className="py-3 text-center text-gray-700">{city.attendees.toLocaleString()}</td>
                        <td className="py-3 text-right font-medium text-gray-900">
                          Rs{(city.revenue / 1000).toFixed(0)}K
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Top City</p>
                    <p className="text-lg font-bold text-indigo-600">{geoData[0].city}</p>
                    <p className="text-xs text-gray-500">{geoData[0].events} events</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Total Cities</p>
                    <p className="text-lg font-bold text-purple-600">{geoData.length}</p>
                    <p className="text-xs text-gray-500">Active markets</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Hourly Activity Heatmap */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Peak Activity Hours</h2>
                <p className="text-sm text-gray-600 mt-1">Registration activity by hour</p>
              </div>
              <Clock className="w-6 h-6 text-indigo-600" />
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={hourlyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hour" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Bar dataKey="activity" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Predictive Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
              <Activity className="w-8 h-8 mb-3 opacity-80" />
              <h3 className="text-lg font-bold mb-2">Predicted Next Month</h3>
              <p className="text-3xl font-bold mb-1">Rs{(predictiveInsights.predictedRevenue / 1000000).toFixed(1)}M</p>
              <p className="text-sm opacity-90">+38% from current month</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white">
              <Ticket className="w-8 h-8 mb-3 opacity-80" />
              <h3 className="text-lg font-bold mb-2">Avg. Ticket Value</h3>
              <p className="text-3xl font-bold mb-1">Rs{predictiveInsights.avgTicketValue}</p>
              <p className="text-sm opacity-90">+12% from last period</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-6 text-white">
              <TrendingUp className="w-8 h-8 mb-3 opacity-80" />
              <h3 className="text-lg font-bold mb-2">Growth Rate</h3>
              <p className="text-3xl font-bold mb-1">+{predictiveInsights.growthRate.toFixed(1)}%</p>
              <p className="text-sm opacity-90">Month-over-month</p>
            </div>
          </div>
        </>
      )}

      {/* Email Report Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Email Analytics Report</h2>
              <button
                onClick={() => setShowEmailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {emailSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Report Sent!</h3>
                <p className="text-gray-600">The analytics report has been sent successfully.</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recipients <span className="text-gray-400">(comma separated)</span>
                    </label>
                    <input
                      type="text"
                      value={emailForm.recipients}
                      onChange={(e) => setEmailForm({ ...emailForm, recipients: e.target.value })}
                      placeholder="ceo@fstivo.com, team@fstivo.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                    <input
                      type="text"
                      value={emailForm.subject}
                      onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                      placeholder="Weekly Analytics Report"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                    <textarea
                      value={emailForm.message}
                      onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                      placeholder="Add a personal message..."
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
                      <select
                        value={emailForm.format}
                        onChange={(e) => setEmailForm({ ...emailForm, format: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="both">PDF + Excel</option>
                        <option value="pdf">PDF Only</option>
                        <option value="excel">Excel Only</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={emailForm.includeCharts}
                        onChange={(e) => setEmailForm({ ...emailForm, includeCharts: e.target.checked })}
                        className="rounded text-indigo-600"
                      />
                      <span className="text-sm text-gray-700">Include Charts</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={emailForm.includeTables}
                        onChange={(e) => setEmailForm({ ...emailForm, includeTables: e.target.checked })}
                        className="rounded text-indigo-600"
                      />
                      <span className="text-sm text-gray-700">Include Tables</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowEmailModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={sendEmailReport}
                    disabled={emailSending || !emailForm.recipients}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {emailSending ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Report
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Schedule Reports Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Scheduled Reports</h2>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Existing Schedules */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Active Schedules</h3>
              </div>

              <div className="space-y-3">
                {savedSchedules.map(schedule => (
                  <div key={schedule.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-gray-900">{schedule.name}</h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${schedule.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {schedule.active ? 'Active' : 'Paused'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>{schedule.frequency === 'weekly' ? 'Weekly' : 'Monthly'} • {schedule.time}</p>
                          <p>Recipients: {schedule.recipients}</p>
                          <p className="text-indigo-600 font-medium">Next: {schedule.nextRun}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleScheduleActive(schedule.id)}
                          className={`p-2 rounded-lg transition-colors ${schedule.active ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                          {schedule.active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => deleteSchedule(schedule.id)}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add New Schedule */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Schedule</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Schedule Name</label>
                  <input
                    type="text"
                    value={scheduleForm.name}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, name: e.target.value })}
                    placeholder="e.g., Weekly Executive Report"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                    <select
                      value={scheduleForm.frequency}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, frequency: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                    <input
                      type="time"
                      value={scheduleForm.time}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {scheduleForm.frequency === 'weekly' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Day of Week</label>
                    <select
                      value={scheduleForm.dayOfWeek}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, dayOfWeek: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="1">Monday</option>
                      <option value="2">Tuesday</option>
                      <option value="3">Wednesday</option>
                      <option value="4">Thursday</option>
                      <option value="5">Friday</option>
                      <option value="6">Saturday</option>
                      <option value="7">Sunday</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Day of Month</label>
                    <select
                      value={scheduleForm.dayOfMonth}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, dayOfMonth: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      {Array.from({ length: 28 }, (_, i) => (
                        <option key={i + 1} value={String(i + 1)}>{i + 1}{i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recipients <span className="text-gray-400">(comma separated)</span>
                  </label>
                  <input
                    type="text"
                    value={scheduleForm.recipients}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, recipients: e.target.value })}
                    placeholder="ceo@fstivo.com, team@fstivo.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
                  <select
                    value={scheduleForm.format}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, format: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="both">PDF + Excel</option>
                    <option value="pdf">PDF Only</option>
                    <option value="excel">Excel Only</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={scheduleForm.includeCharts}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, includeCharts: e.target.checked })}
                      className="rounded text-indigo-600"
                    />
                    <span className="text-sm text-gray-700">Include Charts</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={scheduleForm.includeTables}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, includeTables: e.target.checked })}
                      className="rounded text-indigo-600"
                    />
                    <span className="text-sm text-gray-700">Include Tables</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveSchedule}
                  disabled={!scheduleForm.name || !scheduleForm.recipients}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Report Builder Modal */}
      {showReportBuilder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-5xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Custom Report Builder</h2>
              <button
                onClick={() => setShowReportBuilder(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Saved Reports */}
            {savedReports.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Saved Reports</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedReports.map(report => (
                    <div key={report.id} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">{report.name}</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {report.widgets.length} widgets • Last viewed {report.lastViewed}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => viewReport(report.id)}
                            className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                            title="View Report"
                          >
                            <Activity className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteReport(report.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Delete Report"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {report.widgets.slice(0, 3).map(widgetId => {
                          const widget = availableWidgets.find(w => w.id === widgetId)
                          return widget ? (
                            <span key={widgetId} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              {widget.icon} {widget.name}
                            </span>
                          ) : null
                        })}
                        {report.widgets.length > 3 && (
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            +{report.widgets.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Report Name Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Report Name</label>
              <input
                type="text"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="e.g., Executive Summary, Monthly Performance"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Available Widgets */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Widgets</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {availableWidgets.map(widget => (
                  <button
                    key={widget.id}
                    onClick={() => addWidgetToReport(widget.id)}
                    disabled={selectedWidgets.includes(widget.id)}
                    className={`p-4 rounded-lg border-2 transition-all text-center ${
                      selectedWidgets.includes(widget.id)
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 hover:border-indigo-300 text-gray-700'
                    }`}
                  >
                    <div className="text-2xl mb-2">{widget.icon}</div>
                    <div className="text-sm font-medium">{widget.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{widget.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Widgets (Drag & Drop) */}
            {selectedWidgets.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Selected Widgets (Drag to Reorder)</h3>
                  <span className="text-sm text-gray-500">{selectedWidgets.length} selected</span>
                </div>
                <div className="space-y-2">
                  {selectedWidgets.map((widgetId, index) => {
                    const widget = availableWidgets.find(w => w.id === widgetId)
                    return widget ? (
                      <div
                        key={widgetId}
                        draggable
                        onDragStart={() => handleDragStart(widgetId)}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(widgetId)}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-move hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{widget.icon}</span>
                          <div>
                            <div className="font-medium text-gray-900">{widget.name}</div>
                            <div className="text-xs text-gray-500">{widget.description}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeWidgetFromReport(widgetId)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : null
                  })}
                </div>
              </div>
            )}

            {/* Preview */}
            {selectedWidgets.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
                <div className="space-y-6">
                  {selectedWidgets.map(widgetId => getWidgetComponent(widgetId))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowReportBuilder(false)
                  setReportName('')
                  setSelectedWidgets([])
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveCustomReport}
                disabled={!reportName || selectedWidgets.length === 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Save Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdvancedAnalyticsDashboard
