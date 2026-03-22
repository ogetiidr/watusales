import { useState } from "react";
import { useGetDailyPerformance, useGetWeeklyPerformance } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Star, TrendingUp } from "lucide-react";

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
  return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
}

export default function AdminPerformance() {
  const { data: daily, isLoading: dailyLoading } = useGetDailyPerformance({});
  const { data: weekly, isLoading: weeklyLoading } = useGetWeeklyPerformance({});

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Performance Rankings</h1>
        <p className="text-muted-foreground mt-1">Track agent performance and rankings</p>
      </div>

      <Tabs defaultValue="daily">
        <TabsList>
          <TabsTrigger value="daily">Daily Rankings</TabsTrigger>
          <TabsTrigger value="weekly">Weekly Rankings</TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Today's Rankings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dailyLoading ? (
                <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
              ) : !daily?.length ? (
                <div className="text-center py-8 text-muted-foreground">No data for today yet</div>
              ) : (
                <div className="space-y-3">
                  {daily.map((entry) => (
                    <div key={entry.agentId} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center"><RankIcon rank={entry.rank} /></div>
                        <div>
                          <p className="font-medium">{entry.agentName}</p>
                          {entry.leaderName && <p className="text-xs text-muted-foreground">Leader: {entry.leaderName}</p>}
                        </div>
                      </div>
                      <Badge variant="secondary">{entry.devicesCount} devices</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                Weekly Rankings
                {weekly && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    {weekly.weekStart} – {weekly.weekEnd}
                    {weekly.isFinalized && <Badge className="ml-2" variant="outline">Finalized</Badge>}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {weeklyLoading ? (
                <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
              ) : !weekly?.rankings?.length ? (
                <div className="text-center py-8 text-muted-foreground">No data for this week yet</div>
              ) : (
                <div className="space-y-3">
                  {weekly.rankings.map((entry) => (
                    <div key={entry.agentId} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center"><RankIcon rank={entry.rank} /></div>
                        <div>
                          <p className="font-medium">{entry.agentName}</p>
                          {entry.leaderName && <p className="text-xs text-muted-foreground">Leader: {entry.leaderName}</p>}
                        </div>
                      </div>
                      <Badge variant="secondary">{entry.devicesCount} devices</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
