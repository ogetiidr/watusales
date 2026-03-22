import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListDevices, useDeleteDevice, useMoveDevice, useListUsers } from "@workspace/api-client-react";
import { Smartphone, GitMerge, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function AdminDevices() {
  const [search, setSearch] = useState("");
  const { data: devices, isLoading } = useListDevices();
  
  const filtered = devices?.filter(d => d.imei.includes(search) || d.agentName?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Global Device Registry</h1>
          <p className="text-muted-foreground text-sm">View and manage all registered devices</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search IMEI or Agent..." 
            className="pl-9 rounded-xl border-border/50 bg-card focus:bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-secondary/50">
            <TableRow>
              <TableHead>IMEI</TableHead>
              <TableHead>Current Agent</TableHead>
              <TableHead>Team Leader</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Added On</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filtered?.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground"><Smartphone className="w-12 h-12 mx-auto mb-3 opacity-20" />No devices found.</TableCell></TableRow>
            ) : (
              filtered?.map((device) => (
                <TableRow key={device.id}>
                  <TableCell className="font-mono text-sm font-medium">{device.imei}</TableCell>
                  <TableCell>{device.agentName || <span className="text-muted-foreground italic">Unassigned</span>}</TableCell>
                  <TableCell>{device.leaderName || '-'}</TableCell>
                  <TableCell>
                    <DeviceStatusBadge status={device.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(device.dateAdded), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <MoveDeviceDialog device={device} />
                      <DeleteDeviceDialog id={device.id} imei={device.imei} />
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

function DeviceStatusBadge({ status }: { status: string }) {
  const styles = {
    active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400",
    pending: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400",
    removed: "bg-muted text-muted-foreground",
    blacklisted: "bg-destructive/10 text-destructive",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${styles[status as keyof typeof styles] || styles.active}`}>
      {status}
    </span>
  );
}

function MoveDeviceDialog({ device }: { device: any }) {
  const [open, setOpen] = useState(false);
  const [agentId, setAgentId] = useState("");
  const { data: agents } = useListUsers({ role: "agent" });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const moveMutation = useMoveDevice({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
        setOpen(false);
        toast({ title: "Device transferred successfully" });
      }
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs hover:bg-primary/10 hover:text-primary">
          <GitMerge className="w-3 h-3 mr-1" /> Transfer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] rounded-2xl">
        <DialogHeader>
          <DialogTitle>Transfer Device</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="p-3 bg-secondary rounded-xl mb-4 text-sm">
            <p><span className="text-muted-foreground">IMEI:</span> <span className="font-mono">{device.imei}</span></p>
            <p><span className="text-muted-foreground">Current:</span> {device.agentName || 'None'}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Select New Agent</label>
            <Select value={agentId} onValueChange={setAgentId}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select an agent" />
              </SelectTrigger>
              <SelectContent>
                {agents?.map((a) => (
                  <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end pt-4">
            <Button 
              className="rounded-xl px-6" 
              disabled={!agentId || moveMutation.isPending}
              onClick={() => moveMutation.mutate({ id: device.id, data: { toAgentId: parseInt(agentId) } })}
            >
              {moveMutation.isPending ? "Transferring..." : "Confirm Transfer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDeviceDialog({ id, imei }: { id: number, imei: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const deleteMutation = useDeleteDevice({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
        toast({ title: "Device deleted" });
      }
    }
  });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Device?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete IMEI <span className="font-mono text-foreground">{imei}</span>? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => deleteMutation.mutate({ id })}
            className="rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
