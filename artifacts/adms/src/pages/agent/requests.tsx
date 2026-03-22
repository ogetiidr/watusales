import { useState } from "react";
import { useListRequests, useCreateRequest, useListDevices } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, FileX } from "lucide-react";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export default function AgentRequests() {
  const { data: requests, isLoading } = useListRequests({});
  const { data: devices } = useListDevices({});
  const createRequest = useCreateRequest();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"delete" | "transfer">("delete");
  const [deviceId, setDeviceId] = useState("");

  const activeDevices = devices?.filter(d => d.status === "active") ?? [];

  function handleSubmit() {
    if (!deviceId) { toast({ variant: "destructive", title: "Select a device" }); return; }
    createRequest.mutate({
      data: { type, deviceId: parseInt(deviceId) }
    }, {
      onSuccess: () => {
        toast({ title: "Request submitted", description: "Your request is pending approval." });
        queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
        setOpen(false);
        setDeviceId("");
      },
      onError: () => toast({ variant: "destructive", title: "Failed to submit request" })
    });
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Requests</h1>
          <p className="text-muted-foreground mt-1">Manage device deletion and transfer requests</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" />New Request</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileX className="w-5 h-5" />All Requests</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : !requests?.length ? (
            <div className="text-center py-8 text-muted-foreground">No requests yet</div>
          ) : (
            <div className="space-y-3">
              {requests.map(req => (
                <div key={req.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize">{req.type} Request</span>
                      <Badge className={statusColors[req.status] ?? ""}>{req.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">IMEI: {req.deviceImei}</p>
                    {req.rejectionReason && <p className="text-sm text-red-500">Reason: {req.rejectionReason}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground">{format(new Date(req.createdAt), "MMM d, HH:mm")}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Request</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Request Type</Label>
              <Select value={type} onValueChange={(v: "delete" | "transfer") => setType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="delete">Delete Device</SelectItem>
                  <SelectItem value="transfer">Transfer Device</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Device</Label>
              <Select value={deviceId} onValueChange={setDeviceId}>
                <SelectTrigger><SelectValue placeholder="Select device" /></SelectTrigger>
                <SelectContent>
                  {activeDevices.map(d => (
                    <SelectItem key={d.id} value={String(d.id)}>{d.imei}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createRequest.isPending}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
