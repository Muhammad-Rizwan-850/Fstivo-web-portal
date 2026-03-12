import { createClient } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Users, DollarSign, TrendingUp, CheckCircle } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
  }

  const userRole = user?.user_metadata?.role || 'attendee'

  // Mock stats data - replace with actual database queries
  const stats = {
    totalEvents: 12,
    upcomingEvents: 3,
    totalVolunteers: 48,
    activeVolunteers: 24,
    totalRevenue: 125000,
    thisMonthRevenue: 15000,
    pendingTasks: 8,
    completedTasks: 24,
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.user_metadata?.full_name || 'User'}!
        </h1>
        <p className="text-gray-600 mt-1 capitalize">
          {userRole === 'organizer' && 'Manage your events and grow your impact'}
          {userRole === 'volunteer' && 'Track your impact and discover new opportunities'}
          {userRole === 'sponsor' && 'View your sponsorships and engagement'}
          {userRole === 'admin' && 'Overview of platform activity'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents}</div>
            <p className="text-xs text-muted-foreground">
              {stats.upcomingEvents} upcoming
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volunteers</CardTitle>
            <Users className="h-4 w-4 text-teal-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVolunteers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeVolunteers} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">PKR {stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +PKR {stats.thisMonthRevenue.toLocaleString()} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedTasks}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingTasks} pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Role-specific content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest updates and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <p className="text-sm">New volunteer registration for Tech Summit</p>
                <span className="text-xs text-muted-foreground ml-auto">2h ago</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                <p className="text-sm">Payment received: PKR 5,000</p>
                <span className="text-xs text-muted-foreground ml-auto">5h ago</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                <p className="text-sm">Event "Leadership Conference" published</p>
                <span className="text-xs text-muted-foreground ml-auto">1d ago</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                <p className="text-sm">3 pending volunteer applications</p>
                <span className="text-xs text-muted-foreground ml-auto">2d ago</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Your next scheduled events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex flex-col items-center justify-center bg-purple-100 rounded-lg p-2 min-w-[60px]">
                  <span className="text-sm font-bold text-purple-600">15</span>
                  <span className="text-xs text-purple-600">Jul</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">Tech Innovation Summit</h4>
                  <p className="text-sm text-muted-foreground">LUMS, Lahore</p>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Published</span>
              </div>

              <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex flex-col items-center justify-center bg-teal-100 rounded-lg p-2 min-w-[60px]">
                  <span className="text-sm font-bold text-teal-600">22</span>
                  <span className="text-xs text-teal-600">Jul</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">Youth Leadership Conference</h4>
                  <p className="text-sm text-muted-foreground">IBA, Karachi</p>
                </div>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Draft</span>
              </div>

              <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex flex-col items-center justify-center bg-blue-100 rounded-lg p-2 min-w-[60px]">
                  <span className="text-sm font-bold text-blue-600">05</span>
                  <span className="text-xs text-blue-600">Aug</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">Sustainable Future Expo</h4>
                  <p className="text-sm text-muted-foreground">NUST, Islamabad</p>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Published</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
