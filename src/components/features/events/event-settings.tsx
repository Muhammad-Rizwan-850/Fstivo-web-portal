'use client'

import { useState, useEffect } from 'react'
import supabase from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Settings, Bell, Mail, Users, Trash2 } from 'lucide-react'
import { logger } from '@/lib/logger';

interface EventSettingsProps {
  eventId: string
}

interface Settings {
  is_published: boolean
  allow_registration: boolean
  email_notifications: boolean
  auto_approve: boolean
  require_approval: boolean
}

export function EventSettings({ eventId }: EventSettingsProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<Settings>({
    is_published: false,
    allow_registration: true,
    email_notifications: true,
    auto_approve: false,
    require_approval: true,
  })

  useEffect(() => {
    fetchSettings()
  }, [eventId])

  const fetchSettings = async () => {
    if (!supabase) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()

      if (error) throw error

      setSettings({
        is_published: data.is_published || false,
        allow_registration: data.allow_registration !== false,
        email_notifications: data.email_notifications !== false,
        auto_approve: data.auto_approve || false,
        require_approval: data.require_approval || false,
      })
    } catch (error) {
      logger.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (key: keyof Settings) => {
    const newValue = !settings[key]
    setSettings((prev) => ({ ...prev, [key]: newValue }))

    if (!supabase) return

    try {
      const { error } = await supabase
        .from('events')
        .update({ [key]: newValue })
        .eq('id', eventId)

      if (error) throw error
    } catch (error) {
      logger.error('Error updating setting:', error)
      // Revert on error
      setSettings((prev) => ({ ...prev, [key]: !newValue }))
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading settings...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Event Settings</h1>
        <p className="text-muted-foreground">Manage your event configuration</p>
      </div>

      {/* Visibility Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Visibility & Access
          </CardTitle>
          <CardDescription>Control who can see and access your event</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Published</Label>
              <p className="text-sm text-muted-foreground">
                Make event visible to the public
              </p>
            </div>
            <Button
              variant={settings.is_published ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleToggle('is_published')}
            >
              {settings.is_published ? 'ON' : 'OFF'}
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Registration</Label>
              <p className="text-sm text-muted-foreground">
                Enable new registrations for this event
              </p>
            </div>
            <Button
              variant={settings.allow_registration ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleToggle('allow_registration')}
            >
              {settings.allow_registration ? 'ON' : 'OFF'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Configure event notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Send email updates to attendees
              </p>
            </div>
            <Button
              variant={settings.email_notifications ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleToggle('email_notifications')}
            >
              {settings.email_notifications ? 'ON' : 'OFF'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Registration Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Registration
          </CardTitle>
          <CardDescription>Manage registration workflow</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-Approve Registrations</Label>
              <p className="text-sm text-muted-foreground">
                Automatically approve all new registrations
              </p>
            </div>
            <Button
              variant={settings.auto_approve ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleToggle('auto_approve')}
            >
              {settings.auto_approve ? 'ON' : 'OFF'}
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require Approval</Label>
              <p className="text-sm text-muted-foreground">
                Manually review each registration
              </p>
            </div>
            <Button
              variant={settings.require_approval ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleToggle('require_approval')}
              disabled={settings.auto_approve}
            >
              {settings.require_approval ? 'ON' : 'OFF'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" disabled>
            Delete Event
          </Button>
          <p className="mt-2 text-sm text-muted-foreground">
            Deleting this event will remove all associated data permanently.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
