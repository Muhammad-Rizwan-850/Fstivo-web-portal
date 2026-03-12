'use client'

import { useEffect, useState } from 'react'
import supabase from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Download } from 'lucide-react'
import { logger } from '@/lib/logger';

interface Attendee {
  id: string
  name: string
  email: string
  status: 'registered' | 'checked-in' | 'cancelled'
  ticket_type: string
  registration_date: string
}

interface AttendeeListProps {
  eventId: string
}

export function AttendeeList({ eventId }: AttendeeListProps) {
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetchAttendees()
  }, [eventId])

  const fetchAttendees = async () => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          id,
          status,
          created_at,
          ticket_type,
          profiles:user_id (
            full_name,
            email
          )
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedData = (data || []).map((reg: any) => ({
        id: reg.id,
        name: reg.profiles?.full_name || 'N/A',
        email: reg.profiles?.email || 'N/A',
        status: reg.status,
        ticket_type: reg.ticket_type || 'General',
        registration_date: new Date(reg.created_at).toLocaleDateString(),
      }))

      setAttendees(formattedData)
    } catch (error) {
      logger.error('Error fetching attendees:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAttendees = attendees.filter((attendee) => {
    const matchesSearch =
      attendee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attendee.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter =
      filter === 'all' || attendee.status === filter
    return matchesSearch && matchesFilter
  })

  const exportCSV = () => {
    const csv = [
      ['Name', 'Email', 'Status', 'Ticket Type', 'Registration Date'],
      ...filteredAttendees.map((a) => [
        a.name,
        a.email,
        a.status,
        a.ticket_type,
        a.registration_date,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendees-${eventId}-${Date.now()}.csv`
    a.click()
  }

  if (loading) {
    return <div className="p-8 text-center">Loading attendees...</div>
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Attendees</h2>
          <p className="text-muted-foreground">
            {filteredAttendees.length} total attendees
          </p>
        </div>
        <Button onClick={exportCSV}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'registered' ? 'default' : 'outline'}
            onClick={() => setFilter('registered')}
          >
            Registered
          </Button>
          <Button
            variant={filter === 'checked-in' ? 'default' : 'outline'}
            onClick={() => setFilter('checked-in')}
          >
            Checked In
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="p-4 text-left font-medium">Name</th>
              <th className="p-4 text-left font-medium">Email</th>
              <th className="p-4 text-left font-medium">Status</th>
              <th className="p-4 text-left font-medium">Ticket Type</th>
              <th className="p-4 text-left font-medium">Registration Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredAttendees.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center">
                  No attendees found
                </td>
              </tr>
            ) : (
              filteredAttendees.map((attendee) => (
                <tr key={attendee.id} className="border-b hover:bg-muted/50">
                  <td className="p-4 font-medium">{attendee.name}</td>
                  <td className="p-4">{attendee.email}</td>
                  <td className="p-4">
                    <Badge
                      variant={
                        attendee.status === 'checked-in'
                          ? 'default'
                          : attendee.status === 'registered'
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {attendee.status}
                    </Badge>
                  </td>
                  <td className="p-4">{attendee.ticket_type}</td>
                  <td className="p-4">{attendee.registration_date}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
