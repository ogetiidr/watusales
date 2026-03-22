import { useGetAgentDashboard } from "@workspace/api-client-react";
import { Smartphone, Target, Trophy, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function AgentDashboard() {
  const { data: dashboard, isLoading } = useGetAgentDashboard();

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold">My Dashboard</h1>
        <p className="text-muted-foreground mt-1">Track your performance and active devices.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="My Devices" value={dashboard?.myDevices || 0} icon={<Smartphone className="w-6 h-6 text-blue-500" />} />
        <MetricCard title="Added Today" value={dashboard?.todaySales || 0} icon={<Target className="w-6 h-6 text-emerald-500" />} />
        <MetricCard title="This Week" value={dashboard?.weeklySales || 0} icon={<Calendar className="w-6 h-6 text-indigo-500" />} />
        <Card className="shadow-md border-primary/20 bg-primary/5 rounded-2xl relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-10"><Trophy className="w-24 h-24" /></div>
          <CardContent className="p-6 relative z-10">
            <p className="text-sm font-medium text-primary">Daily Rank</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-4xl font-display font-bold text-foreground">#{dashboard?.rankToday || '-'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-md border-border/50 rounded-2xl">
          <CardContent className="p-8">
            <h3 className="font-display font-bold text-xl mb-6 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" /> Weekly Goal Progress
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Devices Added</span>
                <span className="font-bold">{dashboard?.weeklySales || 0} / 50</span>
              </div>
              <Progress value={Math.min(100, ((dashboard?.weeklySales || 0) / 50) * 100)} className="h-3 bg-secondary" />
              <p className="text-xs text-muted-foreground text-center pt-2">
                {50 - (dashboard?.weeklySales || 0)} more devices to reach the weekly bonus!
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Placeholder for Quick Actions or recent activity */}
        <div className="bg-gradient-to-br from-primary to-accent rounded-3xl p-8 text-white shadow-xl shadow-primary/20 flex flex-col justify-center">
          <h2 className="text-2xl font-display font-bold mb-2">Ready to add a device?</h2>
          <p className="opacity-90 mb-8">Scan a new IMEI or enter it manually to assign a device to your account.</p>
          <a href={`${import.meta.env.BASE_URL}agent/devices`} className="bg-white text-primary px-6 py-3 rounded-xl font-bold text-center hover:shadow-lg hover:-translate-y-0.5 transition-all w-fit">
            Add New Device
          </a>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) {
  return (
    <Card className="shadow-sm border-border/50 rounded-2xl">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-display font-bold text-foreground mt-2">{value}</p>
          </div>
          <div className="p-3 bg-secondary rounded-xl">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
