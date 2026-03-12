'use client'

import { useEffect, useState } from 'react'
import supabase from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Mail, Users, Calendar, Send, Edit } from 'lucide-react'
import { logger } from '@/lib/logger';

interface Campaign {
  id: string
  name: string
  subject: string
  status: 'draft' | 'scheduled' | 'sent'
  scheduled_for: string | null
  sent_at: string | null
  recipient_count: number
  open_rate: number
  click_rate: number
}

interface CampaignDetailsProps {
  campaignId: string
}

export function CampaignDetails({ campaignId }: CampaignDetailsProps) {
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCampaign()
  }, [campaignId])

  const fetchCampaign = async () => {
    if (!supabase) {
      logger.error('Supabase client not initialized')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single()

      if (error) throw error
      setCampaign(data)
    } catch (error) {
      logger.error('Error fetching campaign:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading campaign...</div>
  }

  if (!campaign) {
    return <div className="p-8 text-center">Campaign not found</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{campaign.name}</h1>
          <p className="text-muted-foreground">{campaign.subject}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          {campaign.status === 'draft' && (
            <Button>
              <Send className="mr-2 h-4 w-4" />
              Send
            </Button>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <Badge
        variant={
          campaign.status === 'sent'
            ? 'default'
            : campaign.status === 'scheduled'
            ? 'secondary'
            : 'outline'
        }
      >
        {campaign.status.toUpperCase()}
      </Badge>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recipients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaign.recipient_count}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaign.open_rate}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaign.click_rate}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {campaign.status === 'sent' ? 'Sent' : 'Scheduled'}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {campaign.sent_at
                ? new Date(campaign.sent_at).toLocaleDateString()
                : campaign.scheduled_for
                ? new Date(campaign.scheduled_for).toLocaleDateString()
                : 'Not scheduled'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Content */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Content</CardTitle>
          <CardDescription>Email preview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border p-4">
            <p className="text-sm text-muted-foreground">
              Preview content will be displayed here
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
