import { useState } from "react";
import { useGetSettings, useUpdateSettings } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Settings, Scan, ShieldCheck, Trash2, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function AdminSettings() {
  const { data: settings, isLoading } = useGetSettings();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [form, setForm] = useState({
    imeiScanEnabled: true,
    enforceMode1: false,
    agentsCanDeleteDevices: false,
    leadersCanAddDevices: true,
  });

  const [synced, setSynced] = useState(false);
  if (settings && !synced) {
    setForm({
      imeiScanEnabled: settings.imeiScanEnabled,
      enforceMode1: settings.enforceMode1,
      agentsCanDeleteDevices: settings.agentsCanDeleteDevices,
      leadersCanAddDevices: settings.leadersCanAddDevices,
    });
    setSynced(true);
  }

  const updateMutation = useUpdateSettings({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
        toast({ title: "Settings saved", description: "System settings updated successfully." });
      }
    }
  });

  const toggle = (key: keyof typeof form) => setForm(f => ({ ...f, [key]: !f[key] }));

  const save = () => updateMutation.mutate({ data: form });

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-display font-bold">System Settings</h1>
        <p className="text-muted-foreground text-sm">Configure system-wide behavior and permissions</p>
      </div>

      <Card className="shadow-md border-border/50 rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Scan className="w-5 h-5 text-primary" /> IMEI Management</CardTitle>
          <CardDescription>Control how IMEI scanning and device management works</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ToggleRow
            icon={<Scan className="w-4 h-4 text-blue-500" />}
            label="IMEI Scanning Enabled"
            description="Allow agents and team leaders to scan IMEI barcodes when adding devices"
            checked={form.imeiScanEnabled}
            onChange={() => toggle("imeiScanEnabled")}
          />
          <ToggleRow
            icon={<ShieldCheck className="w-4 h-4 text-violet-500" />}
            label="Enforce Mode 1 Requirement"
            description="Require devices to pass Mode 1 verification before being registered"
            checked={form.enforceMode1}
            onChange={() => toggle("enforceMode1")}
          />
        </CardContent>
      </Card>

      <Card className="shadow-md border-border/50 rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Role Permissions</CardTitle>
          <CardDescription>Control what each role is allowed to do in the system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ToggleRow
            icon={<Trash2 className="w-4 h-4 text-red-500" />}
            label="Agents Can Delete Devices"
            description="Allow agents to directly delete devices without approval (not recommended)"
            checked={form.agentsCanDeleteDevices}
            onChange={() => toggle("agentsCanDeleteDevices")}
          />
          <ToggleRow
            icon={<Users className="w-4 h-4 text-emerald-500" />}
            label="Leaders Can Add Devices"
            description="Allow team leaders to directly add devices to agent accounts"
            checked={form.leadersCanAddDevices}
            onChange={() => toggle("leadersCanAddDevices")}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={updateMutation.isPending} className="rounded-xl px-8">
          {updateMutation.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}

function ToggleRow({ icon, label, description, checked, onChange }: { icon: React.ReactNode; label: string; description: string; checked: boolean; onChange: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4 p-4 bg-secondary/30 rounded-xl border border-border/50">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{icon}</div>
        <div>
          <Label className="text-sm font-medium cursor-pointer">{label}</Label>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
