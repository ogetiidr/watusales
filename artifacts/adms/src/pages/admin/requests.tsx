import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListRequests, useApproveRequest, useRejectRequest } from "@workspace/api-client-react";
import { ClipboardList, CheckCircle, XCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function AdminRequests() {
  const { data: requests, isLoading } = useListRequests();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const approveMutation = useApproveRequest({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
        toast({ title: "Request approved" });
      }
    }
  });

  const rejectMutation = useRejectRequest({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
        setRejectingId(null);
        setRejectReason("");
        toast({ title: "Request rejected" });
      }
    }
  });

  const filtered = requests?.filter(r => filter === "all" ? true : r.status === filter) || [];

  const counts = {
    pending: requests?.filter(r => r.status === "pending").length || 0,
    approved: requests?.filter(r => r.status === "approved").length || 0,
    rejected: requests?.filter(r => r.status === "rejected").length || 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Request Management</h1>
        <p className="text-muted-foreground text-sm">View and manage all device delete and transfer requests</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatBox label="Pending" count={counts.pending} color="text-yellow-500" />
        <StatBox label="Approved" count={counts.approved} color="text-emerald-500" />
        <StatBox label="Rejected" count={counts.rejected} color="text-red-500" />
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["all", "pending", "approved", "rejected"] as const).map(f => (
          <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" className="rounded-xl capitalize" onClick={() => setFilter(f)}>
            {f}
          </Button>
        ))}
      </div>

      <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-secondary/50">
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Device (IMEI)</TableHead>
              <TableHead>From Agent</TableHead>
              <TableHead>To Agent</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-16 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-16 text-muted-foreground">
                  <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No requests found</p>
                </TableCell>
              </TableRow>
            ) : filtered.map(req => (
              <TableRow key={req.id}>
                <TableCell className="font-mono text-sm">#{req.id}</TableCell>
                <TableCell>
                  <Badge variant={req.type === "delete" ? "destructive" : "secondary"} className="capitalize rounded-lg">
                    {req.type}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-sm">{(req as any).deviceImei || req.deviceId}</TableCell>
                <TableCell>{(req as any).fromAgentName || req.fromAgentId}</TableCell>
                <TableCell>{(req as any).toAgentName || req.toAgentId || "—"}</TableCell>
                <TableCell><StatusBadge status={req.status} /></TableCell>
                <TableCell className="text-sm text-muted-foreground">{format(new Date(req.createdAt), "MMM d, yyyy")}</TableCell>
                <TableCell className="text-right">
                  {req.status === "pending" && (
                    <div className="flex justify-end gap-2">
                      <Button size="sm" className="rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white h-8"
                        onClick={() => approveMutation.mutate({ id: req.id })}>
                        <CheckCircle className="w-3 h-3 mr-1" />Approve
                      </Button>
                      <Dialog open={rejectingId === req.id} onOpenChange={open => { setRejectingId(open ? req.id : null); if (!open) setRejectReason(""); }}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="destructive" className="rounded-lg h-8">
                            <XCircle className="w-3 h-3 mr-1" />Reject
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-2xl">
                          <DialogHeader><DialogTitle>Reject Request #{req.id}</DialogTitle></DialogHeader>
                          <div className="space-y-4 pt-2">
                            <Input placeholder="Reason (optional)" value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="rounded-xl" />
                            <div className="flex gap-2">
                              <Button className="flex-1 rounded-xl" variant="outline" onClick={() => { setRejectingId(null); setRejectReason(""); }}>Cancel</Button>
                              <Button className="flex-1 rounded-xl" variant="destructive"
                                onClick={() => rejectMutation.mutate({ id: req.id, data: { reason: rejectReason } })}>
                                Confirm Reject
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium ${map[status] || ""} capitalize`}>{status}</span>;
}

function StatBox({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm text-center">
      <p className={`text-2xl font-display font-bold ${color}`}>{count}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
