import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListBlacklist, useBlacklistImei, useRemoveFromBlacklist } from "@workspace/api-client-react";
import { FileX, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function AdminBlacklist() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const { data: blacklist, isLoading } = useListBlacklist();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-destructive">IMEI Blacklist</h1>
          <p className="text-muted-foreground text-sm">Blocked devices cannot be added or transferred</p>
        </div>
        <AddBlacklistDialog open={isAddOpen} setOpen={setIsAddOpen} />
      </div>

      <div className="bg-card border-destructive/20 border rounded-2xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-destructive/5">
            <TableRow>
              <TableHead>IMEI</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Added By</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : blacklist?.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground"><FileX className="w-12 h-12 mx-auto mb-3 opacity-20" />No blacklisted devices.</TableCell></TableRow>
            ) : (
              blacklist?.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-mono text-sm font-bold text-destructive">{entry.imei}</TableCell>
                  <TableCell className="text-muted-foreground">{entry.reason || '-'}</TableCell>
                  <TableCell>{entry.addedByName}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(entry.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <RemoveBlacklistButton id={entry.id} />
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

function AddBlacklistDialog({ open, setOpen }: { open: boolean, setOpen: (val: boolean) => void }) {
  const [imei, setImei] = useState("");
  const [reason, setReason] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addMutation = useBlacklistImei({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/blacklist"] });
        setOpen(false);
        setImei("");
        setReason("");
        toast({ title: "IMEI Blacklisted", variant: "destructive" });
      }
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="rounded-xl gap-2 shadow-lg shadow-destructive/20"><Plus className="w-4 h-4" /> Block IMEI</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] rounded-2xl border-destructive/30">
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2">
            <FileX className="w-5 h-5" /> Block Device IMEI
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">IMEI Number</label>
            <Input 
              value={imei} 
              onChange={e => setImei(e.target.value)} 
              placeholder="Enter 15-digit IMEI" 
              className="rounded-xl font-mono"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Reason (Optional)</label>
            <Input 
              value={reason} 
              onChange={e => setReason(e.target.value)} 
              placeholder="e.g. Stolen, Duplicate" 
              className="rounded-xl"
            />
          </div>
          <div className="flex justify-end pt-4">
            <Button 
              variant="destructive"
              className="rounded-xl px-6" 
              disabled={!imei || addMutation.isPending}
              onClick={() => addMutation.mutate({ data: { imei, reason } })}
            >
              {addMutation.isPending ? "Blocking..." : "Block IMEI"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RemoveBlacklistButton({ id }: { id: number }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const removeMutation = useRemoveFromBlacklist({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/blacklist"] });
        toast({ title: "Removed from blacklist" });
      }
    }
  });

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="h-8 rounded-lg text-xs hover:bg-secondary"
      onClick={() => removeMutation.mutate({ id })}
      disabled={removeMutation.isPending}
    >
      <Trash2 className="w-4 h-4 mr-1 text-muted-foreground" /> Unblock
    </Button>
  );
}
