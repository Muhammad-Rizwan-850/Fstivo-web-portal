'use client'

import { useEffect, useState } from 'react'
import supabase from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { QrCode, Users, UserCheck, Clock } from 'lucide-react'
import { logger } from '@/lib/logger';

interface CheckInStats {
  total: number
  checkedIn: number
  pending: number
  recentCheckIns: Array<{
    id: string
    name: string
    time: string
  }>
}

interface CheckInDashboardProps {
  eventId: string
}

export function CheckInDashboard({ eventId }: CheckInDashboardProps) {
  const [stats, setStats] = useState<CheckInStats>({
    total: 0,
    checkedIn: 0,
    pending: 0,
    recentCheckIns: [],
  })
  const [loading, setLoading] = useState(true)
  const [qrCode, setQrCode] = useState('')

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 5000) // Refresh every 5s
    return () => clearInterval(interval)
  }, [eventId])

  const fetchStats = async () => {
    if (!supabase) {
      setLoading(false)
      return
    }

    try {
      // Get total registrations
      const { count: total } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)

      // Get checked-in count
      const { count: checkedIn } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('status', 'checked-in')

      // Get recent check-ins
      const { data: recentData } = await supabase
        .from('registrations')
        .select(`
          id,
          checked_in_at,
          profiles:user_id (
            full_name
          )
        `)
        .eq('event_id', eventId)
        .eq('status', 'checked-in')
        .order('checked_in_at', { ascending: false })
        .limit(5)

      setStats({
        total: total || 0,
        checkedIn: checkedIn || 0,
        pending: (total || 0) - (checkedIn || 0),
        recentCheckIns: (recentData || []).map((item: any) => ({
          id: item.id,
          name: item.profiles?.full_name || 'Unknown',
          time: new Date(item.checked_in_at).toLocaleTimeString(),
        })),
      })
    } catch (error) {
      logger.error('Error fetching check-in stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleQRScan = async (code: string) => {
    if (!supabase || !code) return

    try {
      const { error } = await supabase
        .from('registrations')
        .update({
          status: 'checked-in',
          checked_in_at: new Date().toISOString()
        })
        .eq('id', code)

      if (error) throw error

      setQrCode('')
      fetchStats()
    } catch (error) {
      logger.error('Error checking in:', error)
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading check-in dashboard...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Check-In Dashboard</h1>
        <p className="text-muted-foreground">Real-time event check-in monitoring</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registered</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Checked In</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.checkedIn}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.checkedIn / stats.total) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>

      {/* QR Scanner */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Check-In</CardTitle>
          <CardDescription>Scan QR code or enter registration ID</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Enter registration ID or scan QR code"
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && qrCode) {
                  handleQRScan(qrCode)
                }
              }}
            />
            <Button onClick={() => handleQRScan(qrCode)} disabled={!qrCode}>
              <QrCode className="mr-2 h-4 w-4" />
              Check In
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Check-ins */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Check-Ins</CardTitle>
          <CardDescription>Last 5 attendees checked in</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentCheckIns.length === 0 ? (
            <p className="text-sm text-muted-foreground">No check-ins yet</p>
          ) : (
            <div className="space-y-2">
              {stats.recentCheckIns.map((checkIn) => (
                <div
                  key={checkIn.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <UserCheck className="h-4 w-4 text-green-500" />
                    <span className="font-medium">{checkIn.name}</span>
                  </div>
                  <Badge variant="outline">{checkIn.time}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
