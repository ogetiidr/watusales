import { FileDown, Users, Smartphone, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function LeaderReports() {
  const { toast } = useToast();

  const download = (path: string, name: string) => {
    const a = document.createElement("a");
    a.href = `/api/reports/${path}`;
    a.download = `${name}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast({ title: "Downloading...", description: `${name} report is being downloaded.` });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Reports & Export</h1>
        <p className="text-muted-foreground text-sm">Download CSV reports for your team's agents, devices, and performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: <Users className="w-8 h-8 text-blue-500" />, title: "Agents Report", desc: "Export your team agents with their status", path: "agents", color: "from-blue-500/10 to-blue-500/5" },
          { icon: <Smartphone className="w-8 h-8 text-violet-500" />, title: "Devices Report", desc: "Export all devices under your team", path: "devices", color: "from-violet-500/10 to-violet-500/5" },
          { icon: <BarChart3 className="w-8 h-8 text-emerald-500" />, title: "Performance Report", desc: "Export agent performance data", path: "performance", color: "from-emerald-500/10 to-emerald-500/5" },
        ].map(r => (
          <Card key={r.path} className="shadow-md border-border/50 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className={`bg-gradient-to-br ${r.color} border-b border-border/30`}>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-background/70 rounded-xl shadow-sm">{r.icon}</div>
                <CardTitle className="font-display text-lg">{r.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <CardDescription className="text-sm">{r.desc}</CardDescription>
              <Button onClick={() => download(r.path, r.path)} className="w-full rounded-xl gap-2" variant="outline">
                <FileDown className="w-4 h-4" />Download CSV
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
