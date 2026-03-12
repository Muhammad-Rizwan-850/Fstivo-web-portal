import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, User, Mail, Calendar } from 'lucide-react';

interface CheckInResultProps {
  registration: {
    id: string;
    registration_number: string;
    user: {
      full_name: string;
      email: string;
    };
    event: {
      title: string;
    };
    checked_in_at: string;
  };
}

export function CheckInResult({ registration }: CheckInResultProps) {
  const checkInTime = new Date(registration.checked_in_at).toLocaleString();

  return (
    <Card className="border-green-200 bg-green-50" role="region" aria-labelledby="checkin-success-title">
      <CardHeader>
        <CardTitle id="checkin-success-title" className="flex items-center gap-2 text-green-800">
          <CheckCircle className="h-5 w-5" aria-hidden="true" />
          Check-In Successful
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-green-600" aria-hidden="true" />
            <span className="font-medium">{registration.user.full_name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-green-600" aria-hidden="true" />
            <span className="text-sm text-gray-600">{registration.user.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-green-600" aria-hidden="true" />
            <span className="text-sm text-gray-600">{registration.event.title}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-green-200">
          <span className="text-sm font-medium text-green-800">Registration #:</span>
          <Badge variant="secondary" className="bg-green-100 text-green-800" aria-label={`Registration number ${registration.registration_number}`}>
            {registration.registration_number}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-green-800">Checked in at:</span>
          <time className="text-sm text-gray-600" dateTime={registration.checked_in_at}>
            {checkInTime}
          </time>
        </div>
      </CardContent>
    </Card>
  );
}