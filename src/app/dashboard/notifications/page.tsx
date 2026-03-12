import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Notifications | FSTIVO Dashboard',
  description: 'Manage your notifications',
};

export default async function NotificationsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get notifications
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  const unreadCount = notifications?.filter((n: any) => !n.read).length || 0;

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with your latest activities
          </p>
        </div>
        {unreadCount > 0 && (
          <div className="rounded-full bg-blue-600 px-3 py-1 text-sm text-white">
            {unreadCount} Unread
          </div>
        )}
      </div>

      <div className="rounded-lg border p-6">
        <h2 className="mb-4 text-lg font-semibold">All Notifications</h2>
        {notifications && notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification: any) => (
              <div
                key={notification.id}
                className={'flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-accent' +
                  (!notification.read ? ' border-l-4 border-l-blue-500 bg-blue-50/50' : '')}
              >
                <div className="flex-1 space-y-1">
                  <p className="font-medium leading-none">{notification.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>
                {!notification.read && (
                  <div className="flex-shrink-0">
                    <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <h3 className="mt-4 text-lg font-medium">No notifications</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              You are all caught up! Check back later for updates.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
