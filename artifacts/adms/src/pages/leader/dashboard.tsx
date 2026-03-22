import { useGetLeaderDashboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Smartphone, Clock, Activity } from "lucide-react";
import { format } from "date-fns";

export default function LeaderDashboard() {
  const { data, isLoading } = useGetLeaderDashboard();

  if (isLoading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>;

  const stats = [
    { label: "My Agents", value: data?.totalAgents ?? 0, icon: <Users className="w-6 h-6" />, color: "text-blue-500" },
    { label: "Total Devices", value: data?.totalDevices ?? 0, icon: <Smartphone className="w-6 h-6" />, color: "text-green-500" },
    { label: "Pending Requests", value: data?.pendingRequests ?? 0, icon: <Clock className="w-6 h-6" />, color: "text-orange-500" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Leader Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your team's performance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-3xl font-bold mt-1">{s.value}</p>
                </div>
                <div className={`p-3 rounded-full bg-card border ${s.color}`}>{s.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5" />Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {!data?.recentActivity?.length ? (
            <div className="text-center py-6 text-muted-foreground">No recent activity</div>
          ) : (
            <div className="space-y-3">
              {data.recentActivity.map((log) => (
                <div key={log.id} className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">{log.action.replace(/_/g, " ")}</p>
                    {log.details && <p className="text-muted-foreground text-xs">{log.details}</p>}
                  </div>
                  <span className="text-muted-foreground text-xs whitespace-nowrap">{format(new Date(log.createdAt), "MMM d, HH:mm")}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
