import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListDevices, useDeleteDevice, useMoveDevice, useListUsers, useAddDevice } from "@workspace/api-client-react";
import { Smartphone, GitMerge, Trash2, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IMEIScanner } from "@/components/imei-scanner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

export default function LeaderDevices() {
  const { data: devices, isLoading } = useListDevices();
  const { data: agents } = useListUsers({ role: "agent" });
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [addImei, setAddImei] = useState("");
  const [assignTo, setAssignTo] = useState("");
  const [moveOpen, setMoveOpen] = useState<number | null>(null);
  const [moveTarget, setMoveTarget] = useState("");

  const filtered = devices?.filter(d => d.imei.includes(search) || d.agentName?.toLowerCase().includes(search.toLowerCase())) || [];

  const createMutation = useAddDevice({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
        toast({ title: "Device added successfully" });
        setAddOpen(false);
        setAddImei(""); setAssignTo("");
      },
      onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" })
    }
  });

  const deleteMutation = useDeleteDevice({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
        toast({ title: "Device deleted" });
      }
    }
  });

  const moveMutation = useMoveDevice({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
        toast({ title: "Device moved" });
        setMoveOpen(null); setMoveTarget("");
      }
    }
  });

  const statusColor: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-800",
    pending: "bg-yellow-100 text-yellow-800",
    removed: "bg-gray-100 text-gray-600",
    blacklisted: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Team Devices</h1>
          <p className="text-muted-foreground text-sm">View and manage all devices under your team</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search IMEI or Agent..." className="pl-9 rounded-xl w-64" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl gap-2"><Plus className="w-4 h-4" />Add Device</Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader><DialogTitle>Add Device to Agent</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label>IMEI Number</Label>
                  <IMEIScanner
                    value={addImei}
                    onChange={setAddImei}
                    disabled={createMutation.isPending}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Assign to Agent</Label>
                  <Select value={assignTo} onValueChange={setAssignTo}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select agent..." /></SelectTrigger>
                    <SelectContent>
                      {agents?.map(a => <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full rounded-xl" disabled={createMutation.isPending || !addImei || !assignTo}
                  onClick={() => createMutation.mutate({ data: { imei: addImei, agentId: Number(assignTo) } })}>
                  {createMutation.isPending ? "Adding..." : "Add Device"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-secondary/50">
            <TableRow>
              <TableHead>IMEI</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date Added</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-16 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-16 text-muted-foreground">
                  <Smartphone className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No devices found</p>
                </TableCell>
              </TableRow>
            ) : filtered.map(device => (
              <TableRow key={device.id}>
                <TableCell className="font-mono text-sm font-medium">{device.imei}</TableCell>
                <TableCell>{device.agentName || <span className="text-muted-foreground text-sm">Unassigned</span>}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium capitalize ${statusColor[device.status] || ""}`}>
                    {device.status}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{format(new Date(device.dateAdded), "MMM d, yyyy")}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Dialog open={moveOpen === device.id} onOpenChange={open => { setMoveOpen(open ? device.id : null); if (!open) setMoveTarget(""); }}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="rounded-lg h-8"><GitMerge className="w-3 h-3 mr-1" />Move</Button>
                      </DialogTrigger>
                      <DialogContent className="rounded-2xl">
                        <DialogHeader><DialogTitle>Move Device</DialogTitle></DialogHeader>
                        <div className="space-y-4 pt-2">
                          <Select value={moveTarget} onValueChange={setMoveTarget}>
                            <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select target agent..." /></SelectTrigger>
                            <SelectContent>
                              {agents?.filter(a => a.id !== device.agentId).map(a => <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <Button className="w-full rounded-xl" disabled={!moveTarget}
                            onClick={() => moveMutation.mutate({ id: device.id, data: { newAgentId: Number(moveTarget) } })}>Move Device</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="rounded-lg h-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Device?</AlertDialogTitle>
                          <AlertDialogDescription>This will permanently delete the device with IMEI {device.imei}.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                          <AlertDialogAction className="rounded-xl bg-destructive hover:bg-destructive/90"
                            onClick={() => deleteMutation.mutate({ id: device.id })}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
