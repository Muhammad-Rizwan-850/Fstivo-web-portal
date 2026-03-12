import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';

interface Connection {
  id: string;
  full_name: string;
  role?: string;
  avatar_url?: string;
  headline?: string;
}

interface ConnectionCardProps {
  connection: Connection;
}

export function ConnectionCard({ connection }: ConnectionCardProps) {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <Avatar className="h-12 w-12">
          <AvatarImage asChild>
            <Image
              src={connection.avatar_url || '/default-avatar.png'}
              alt={connection.full_name}
              width={48}
              height={48}
            />
          </AvatarImage>
          <AvatarFallback>
            {connection.full_name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold truncate">{connection.full_name}</h4>
          {connection.role && (
            <p className="text-sm text-muted-foreground truncate">{connection.role}</p>
          )}
          {connection.headline && (
            <p className="text-sm text-muted-foreground truncate">{connection.headline}</p>
          )}
        </div>
        
        <Button variant="outline" size="sm">
          Message
        </Button>
      </div>
    </Card>
  );
}
