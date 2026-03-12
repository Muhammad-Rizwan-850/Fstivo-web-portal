'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { logger } from '@/lib/logger';

const campaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required'),
  subject: z.string().min(1, 'Subject line is required'),
  content: z.string().min(1, 'Email content is required'),
  audience_id: z.string().min(1, 'Please select an audience'),
});

interface CampaignFormProps {
  eventId: string;
}

export function CampaignForm({ eventId }: CampaignFormProps) {
  const form = useForm<z.infer<typeof campaignSchema>>({
    resolver: zodResolver(campaignSchema),
  });

  const onSubmit = async (data: z.infer<typeof campaignSchema>) => {
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, event_id: eventId }),
      });

      if (res.ok) {
        window.location.href = '/events/' + eventId + '/campaigns';
      }
    } catch (error) {
      logger.error('Failed to create campaign:', error);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Campaign Details</h2>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Campaign Name</Label>
            <Input
              id="name"
              {...form.register('name')}
              placeholder="e.g., Event Reminder"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="subject">Email Subject</Label>
            <Input
              id="subject"
              {...form.register('subject')}
              placeholder="Don't miss our upcoming event!"
            />
            {form.formState.errors.subject && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.subject.message}</p>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Content</h2>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="content">Email Content</Label>
            <Textarea
              id="content"
              {...form.register('content')}
              placeholder="Write your email content here..."
              rows={12}
            />
            {form.formState.errors.content && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.content.message}</p>
            )}
          </div>
        </div>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" className="flex-1">
          Create Campaign
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
