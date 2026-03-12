import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: 'draft' | 'scheduled' | 'sent' | 'sending';
  sent_at?: string;
  recipients_count?: number;
  open_rate?: number;
  click_rate?: number;
}

interface CampaignListProps {
  campaigns: Campaign[];
}

export function CampaignList({ campaigns }: CampaignListProps) {
  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'sending':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'scheduled':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'draft':
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  if (campaigns.length === 0) {
    return (
      <Card className="p-12 text-center">
        <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
        <p className="text-muted-foreground mb-4">
          Create your first email campaign to start engaging attendees
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {campaigns.map((campaign) => (
        <Card key={campaign.id} className="p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold">{campaign.name}</h3>
                <Badge className={getStatusColor(campaign.status)}>
                  {campaign.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{campaign.subject}</p>
            </div>
            <Button variant="outline" size="sm">
              View Details
            </Button>
          </div>

          {(campaign.recipients_count || campaign.sent_at) && (
            <div className="grid grid-cols-4 gap-4 pt-4 border-t text-sm">
              {campaign.recipients_count && (
                <div>
                  <p className="text-muted-foreground">Recipients</p>
                  <p className="font-semibold">{campaign.recipients_count}</p>
                </div>
              )}
              {campaign.sent_at && (
                <div>
                  <p className="text-muted-foreground">Sent</p>
                  <p className="font-semibold">
                    {new Date(campaign.sent_at).toLocaleDateString()}
                  </p>
                </div>
              )}
              {campaign.open_rate !== undefined && (
                <div>
                  <p className="text-muted-foreground">Open Rate</p>
                  <p className="font-semibold">{campaign.open_rate.toFixed(1)}%</p>
                </div>
              )}
              {campaign.click_rate !== undefined && (
                <div>
                  <p className="text-muted-foreground">Click Rate</p>
                  <p className="font-semibold">{campaign.click_rate.toFixed(1)}%</p>
                </div>
              )}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
