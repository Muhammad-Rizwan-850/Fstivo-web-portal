import { Card } from '@/components/ui/card';

interface CheckInStatsProps {
  stats: {
    total: number;
    checkedIn: number;
    remaining: number;
    percentage: number;
  };
}

export function CheckInStats({ stats }: CheckInStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Total Tickets</p>
        <p className="text-3xl font-bold">{stats.total}</p>
      </Card>
      
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Checked In</p>
        <p className="text-3xl font-bold text-green-600 dark:text-green-400">
          {stats.checkedIn}
        </p>
      </Card>
      
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Remaining</p>
        <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
          {stats.remaining}
        </p>
      </Card>
      
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Check-in Rate</p>
        <p className="text-3xl font-bold">{stats.percentage.toFixed(1)}%</p>
        <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all"
            style={{ width: `${stats.percentage}%` }}
          />
        </div>
      </Card>
    </div>
  );
}
