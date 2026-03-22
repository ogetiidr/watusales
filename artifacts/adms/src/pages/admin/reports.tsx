import { FileDown, Users, Smartphone, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function AdminReports() {
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
        <p className="text-muted-foreground text-sm">Download CSV reports for agents, devices, and performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ReportCard
          icon={<Users className="w-8 h-8 text-blue-500" />}
          title="Agents Report"
          description="Export all agent accounts with their team leader assignments and status"
          color="from-blue-500/10 to-blue-500/5"
          onDownload={() => download("agents", "agents")}
        />
        <ReportCard
          icon={<Smartphone className="w-8 h-8 text-violet-500" />}
          title="Devices Report"
          description="Export all registered devices with IMEI, agent assignment, and status"
          color="from-violet-500/10 to-violet-500/5"
          onDownload={() => download("devices", "devices")}
        />
        <ReportCard
          icon={<BarChart3 className="w-8 h-8 text-emerald-500" />}
          title="Performance Report"
          description="Export agent performance with daily, weekly, and total device counts"
          color="from-emerald-500/10 to-emerald-500/5"
          onDownload={() => download("performance", "performance")}
        />
      </div>

      <Card className="shadow-md border-border/50 rounded-2xl">
        <CardHeader>
          <CardTitle className="font-display">About Reports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>• All reports are exported as <strong className="text-foreground">CSV files</strong> compatible with Excel, Google Sheets, and other spreadsheet tools.</p>
          <p>• Reports reflect <strong className="text-foreground">live data</strong> at the time of export.</p>
          <p>• Performance reports include <strong className="text-foreground">today's count, weekly count, and total devices</strong> per agent.</p>
          <p>• Weekly period runs <strong className="text-foreground">Monday through Sunday</strong>, with Sunday being the final day.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function ReportCard({ icon, title, description, color, onDownload }: {
  icon: React.ReactNode; title: string; description: string; color: string; onDownload: () => void;
}) {
  return (
    <Card className="shadow-md border-border/50 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className={`bg-gradient-to-br ${color} border-b border-border/30`}>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-background/70 rounded-xl shadow-sm">{icon}</div>
          <CardTitle className="font-display text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <CardDescription className="text-sm">{description}</CardDescription>
        <Button onClick={onDownload} className="w-full rounded-xl gap-2" variant="outline">
          <FileDown className="w-4 h-4" />
          Download CSV
        </Button>
      </CardContent>
    </Card>
  );
}
