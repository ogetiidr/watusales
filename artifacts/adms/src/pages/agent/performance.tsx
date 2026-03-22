import { useGetDailyPerformance, useGetWeeklyPerformance } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Trophy, TrendingUp, Star, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Badge } from "@/components/ui/badge";

export default function AgentPerformance() {
  const { user } = useAuth();
  const { data: daily } = useGetDailyPerformance();
  const { data: weeklyData } = useGetWeeklyPerformance();

  const weekly = weeklyData?.rankings ?? [];

  const myDaily = daily?.find(d => d.agentId === user?.id);
  const myWeekly = weekly.find(d => d.agentId === user?.id);
  const myDailyRank = daily ? daily.findIndex(d => d.agentId === user?.id) + 1 : null;
  const myWeeklyRank = weekly.length ? weekly.findIndex(d => d.agentId === user?.id) + 1 : null;

  const chartData = daily?.slice(0, 10).map(d => ({ name: d.agentName.split(" ")[0], devices: d.devicesCount })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">My Performance</h1>
        <p className="text-muted-foreground text-sm">Track your daily and weekly rankings and progress</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Today's Devices" value={myDaily?.devicesCount ?? 0} icon={<TrendingUp className="w-5 h-5 text-emerald-500" />} />
        <StatCard label="Daily Rank" value={myDailyRank ? `#${myDailyRank}` : "—"} icon={<Trophy className="w-5 h-5 text-yellow-500" />} />
        <StatCard label="Weekly Devices" value={myWeekly?.devicesCount ?? 0} icon={<Calendar className="w-5 h-5 text-blue-500" />} />
        <StatCard label="Weekly Rank" value={myWeeklyRank ? `#${myWeeklyRank}` : "—"} icon={<Star className="w-5 h-5 text-violet-500" />} />
      </div>

      <Card className="shadow-md border-border/50 rounded-2xl">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="font-display flex items-center gap-2">
            <BarChart className="w-5 h-5 text-primary" />
            Today's Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {chartData.length > 0 ? (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="devices" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              <p>No performance data yet for today</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RankingTable title="Daily Rankings" icon={<TrendingUp className="w-4 h-4" />} data={daily || []} myId={user?.id} />
        <RankingTable title="Weekly Rankings" icon={<Calendar className="w-4 h-4" />} data={weekly} myId={user?.id} />
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <Card className="shadow-sm border-border/50 rounded-2xl">
      <CardContent className="p-5 flex items-center gap-4">
        <div className="p-2.5 bg-secondary rounded-xl">{icon}</div>
        <div>
          <p className="text-xl font-display font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function RankingTable({ title, icon, data, myId }: { title: string; icon: React.ReactNode; data: any[]; myId?: number }) {
  return (
    <Card className="shadow-md border-border/50 rounded-2xl">
      <CardHeader className="border-b border-border/50 pb-3">
        <CardTitle className="font-display text-base flex items-center gap-2">{icon}{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {data.length === 0 ? (
          <div className="text-center text-muted-foreground py-12 text-sm">No data yet</div>
        ) : data.slice(0, 10).map((entry, i) => (
          <div key={entry.agentId} className={`flex items-center gap-3 px-4 py-3 border-b border-border/30 last:border-0 ${entry.agentId === myId ? 'bg-primary/5' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 
              ${i === 0 ? 'bg-yellow-400 text-yellow-900' : i === 1 ? 'bg-gray-300 text-gray-700' : i === 2 ? 'bg-amber-600 text-white' : 'bg-secondary text-muted-foreground'}`}>
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${entry.agentId === myId ? 'text-primary' : ''}`}>
                {entry.agentName} {entry.agentId === myId && <Badge className="text-[10px] ml-1 rounded-md py-0 h-4">You</Badge>}
              </p>
              <p className="text-xs text-muted-foreground">{entry.leaderName || "No Leader"}</p>
            </div>
            <span className="font-display font-bold text-lg text-foreground">{entry.devicesCount}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
