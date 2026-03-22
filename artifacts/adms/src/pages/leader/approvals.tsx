import { useQueryClient } from "@tanstack/react-query";
import { useListRequests, useApproveRequest, useRejectRequest } from "@workspace/api-client-react";
import { CheckSquare, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useState } from "react";

export default function LeaderApprovals() {
  const { data: requests, isLoading } = useListRequests({ status: "pending" });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const approveMutation = useApproveRequest({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
        queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
        toast({ title: "Request approved" });
      }
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Approval Center</h1>
        <p className="text-muted-foreground text-sm">Review device deletion and transfer requests from your agents</p>
      </div>

      <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-secondary/50">
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Device IMEI</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : requests?.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground"><CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />No pending requests.</TableCell></TableRow>
            ) : (
              requests?.map((req) => (
                <TableRow key={req.id}>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${req.type === 'delete' ? 'bg-destructive/10 text-destructive' : 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400'}`}>
                      {req.type}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono">{req.deviceImei}</TableCell>
                  <TableCell>{req.fromAgentName}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {req.type === 'transfer' ? `To: ${req.toAgentName}` : 'Remove from system'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(req.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <RejectRequestDialog request={req} />
                      <Button 
                        size="sm" 
                        className="h-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg"
                        onClick={() => approveMutation.mutate({ id: req.id })}
                        disabled={approveMutation.isPending}
                      >
                        <Check className="w-4 h-4 mr-1" /> Approve
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function RejectRequestDialog({ request }: { request: any }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const rejectMutation = useRejectRequest({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
        setOpen(false);
        toast({ title: "Request rejected" });
      }
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-destructive hover:bg-destructive hover:text-white rounded-lg">
          <X className="w-4 h-4 mr-1" /> Reject
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] rounded-2xl">
        <DialogHeader>
          <DialogTitle>Reject Request</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Rejection Reason</label>
            <Input 
              value={reason} 
              onChange={e => setReason(e.target.value)} 
              placeholder="Tell the agent why..." 
              className="rounded-xl"
            />
          </div>
          <div className="flex justify-end pt-4">
            <Button 
              variant="destructive"
              className="rounded-xl px-6" 
              onClick={() => rejectMutation.mutate({ id: request.id, data: { reason } })}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
