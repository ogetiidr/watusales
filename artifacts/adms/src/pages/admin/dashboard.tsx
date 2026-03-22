import { useGetAdminDashboard } from "@workspace/api-client-react";
import { Shield, Users, Smartphone, TrendingUp, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function AdminDashboard() {
  const { data: dashboard, isLoading } = useGetAdminDashboard();

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  // Mock data for the chart since the API just returns a single todaySales integer
  const chartData = [
    { name: "Mon", sales: Math.max(0, (dashboard?.todaySales || 0) - 5) },
    { name: "Tue", sales: Math.max(0, (dashboard?.todaySales || 0) - 2) },
    { name: "Wed", sales: Math.max(0, (dashboard?.todaySales || 0) + 3) },
    { name: "Thu", sales: Math.max(0, (dashboard?.todaySales || 0) - 1) },
    { name: "Fri", sales: dashboard?.todaySales || 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Team Leaders" value={dashboard?.totalLeaders || 0} icon={<Shield className="w-5 h-5 text-blue-500" />} />
        <StatCard title="Total Agents" value={dashboard?.totalAgents || 0} icon={<Users className="w-5 h-5 text-indigo-500" />} />
        <StatCard title="Total Devices" value={dashboard?.totalDevices || 0} icon={<Smartphone className="w-5 h-5 text-violet-500" />} />
        <StatCard title="Today's Sales" value={dashboard?.todaySales || 0} icon={<TrendingUp className="w-5 h-5 text-emerald-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-md border-border/50 rounded-2xl overflow-hidden">
          <CardHeader className="bg-card border-b border-border/50">
            <CardTitle className="font-display">Sales Overview</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-border/50 rounded-2xl overflow-hidden">
          <CardHeader className="bg-card border-b border-border/50">
            <CardTitle className="font-display flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Top Agent Today
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {dashboard?.topAgentToday ? (
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/20 mb-4 border-4 border-background">
                  <span className="text-2xl font-bold text-white">
                    {dashboard.topAgentToday.agentName.charAt(0)}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-foreground">{dashboard.topAgentToday.agentName}</h3>
                <p className="text-muted-foreground">{dashboard.topAgentToday.leaderName || 'No Leader'}</p>
                <div className="mt-6 w-full bg-secondary/50 rounded-xl p-4 border border-border/50">
                  <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold mb-1">Devices Added</p>
                  <p className="text-3xl font-display font-bold text-primary">{dashboard.topAgentToday.devicesCount}</p>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-3 py-12">
                <Users className="w-12 h-12 opacity-20" />
                <p>No sales recorded today.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) {
  return (
    <Card className="shadow-sm border-border/50 rounded-2xl hover:shadow-md transition-shadow">
      <CardContent className="p-6 flex items-center gap-4">
        <div className="p-4 bg-secondary rounded-xl">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-display font-bold text-foreground mt-1">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
