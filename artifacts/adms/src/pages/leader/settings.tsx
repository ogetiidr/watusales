import { useState } from "react";
import { useGetSettings, useUpdateSettings } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Settings, Scan, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function LeaderSettings() {
  const { data: settings, isLoading } = useGetSettings();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState({ imeiScanEnabled: true, enforceMode1: false, agentsCanDeleteDevices: false, leadersCanAddDevices: true });
  const [synced, setSynced] = useState(false);

  if (settings && !synced) {
    setForm({ imeiScanEnabled: settings.imeiScanEnabled, enforceMode1: settings.enforceMode1, agentsCanDeleteDevices: settings.agentsCanDeleteDevices, leadersCanAddDevices: settings.leadersCanAddDevices });
    setSynced(true);
  }

  const updateMutation = useUpdateSettings({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
        toast({ title: "Settings saved" });
      }
    }
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-display font-bold">Team Settings</h1>
        <p className="text-muted-foreground text-sm">Configure settings for your team</p>
      </div>

      <Card className="shadow-md border-border/50 rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Scan className="w-5 h-5 text-primary" /> IMEI Settings</CardTitle>
          <CardDescription>Control device scanning and verification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "imeiScanEnabled", icon: <Scan className="w-4 h-4 text-blue-500" />, label: "IMEI Scanning Enabled", desc: "Enable IMEI scanning when adding devices" },
            { key: "enforceMode1", icon: <ShieldCheck className="w-4 h-4 text-violet-500" />, label: "Enforce Mode 1", desc: "Require Mode 1 verification for devices" },
          ].map(item => (
            <div key={item.key} className="flex items-start justify-between gap-4 p-4 bg-secondary/30 rounded-xl border border-border/50">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{item.icon}</div>
                <div>
                  <Label className="text-sm font-medium">{item.label}</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </div>
              <Switch checked={(form as any)[item.key]} onCheckedChange={() => setForm(f => ({ ...f, [item.key]: !(f as any)[item.key] }))} />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => updateMutation.mutate({ data: form })} disabled={updateMutation.isPending} className="rounded-xl px-8">
          {updateMutation.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
