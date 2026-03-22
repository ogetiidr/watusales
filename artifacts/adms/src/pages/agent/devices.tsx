import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListDevices, useAddDevice } from "@workspace/api-client-react";
import { Smartphone, Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function AgentDevices() {
  const { data: devices, isLoading } = useListDevices();
  const [isAddOpen, setIsAddOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">My Devices</h1>
          <p className="text-muted-foreground text-sm">Devices currently assigned to you</p>
        </div>
        <AddDeviceDialog open={isAddOpen} setOpen={setIsAddOpen} />
      </div>

      <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-secondary/50">
            <TableRow>
              <TableHead>IMEI Number</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date Added</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : devices?.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="text-center py-12 text-muted-foreground"><Smartphone className="w-12 h-12 mx-auto mb-3 opacity-20" />You haven't added any devices yet.</TableCell></TableRow>
            ) : (
              devices?.map((device) => (
                <TableRow key={device.id}>
                  <TableCell className="font-mono font-medium text-lg text-primary tracking-wider">{device.imei}</TableCell>
                  <TableCell>
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 capitalize">
                      {device.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(device.dateAdded), "MMM d, yyyy h:mm a")}
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

function AddDeviceDialog({ open, setOpen }: { open: boolean, setOpen: (val: boolean) => void }) {
  const [imei, setImei] = useState("");
  const [conflictData, setConflictData] = useState<any>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addMutation = useAddDevice({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/agent"] });
        setOpen(false);
        setImei("");
        setConflictData(null);
        toast({ title: "Device Added", description: "The device has been successfully added to your account." });
      },
      onError: (err: any) => {
        // Handle 409 conflict
        if (err?.error === 'Duplicate IMEI') {
          setConflictData(err);
        } else {
          toast({ variant: "destructive", title: "Failed to add device", description: err.message || "An error occurred." });
        }
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setConflictData(null);
    addMutation.mutate({ data: { imei } });
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) { setImei(""); setConflictData(null); }}}>
      <DialogTrigger asChild>
        <Button className="rounded-xl gap-2 shadow-lg shadow-primary/20"><Plus className="w-4 h-4" /> Add Device</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-2xl">
        <DialogHeader>
          <DialogTitle>Add New Device</DialogTitle>
        </DialogHeader>
        
        {conflictData && (
          <Alert variant="destructive" className="mt-4 border-destructive/50 bg-destructive/5">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>IMEI Conflict</AlertTitle>
            <AlertDescription className="mt-2 text-sm">
              This IMEI is already assigned to:
              <strong className="block mt-1">{conflictData.currentOwner?.name}</strong>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Scan or Enter IMEI</label>
            <Input 
              value={imei} 
              onChange={e => setImei(e.target.value)} 
              placeholder="Enter 15-digit IMEI" 
              className="rounded-xl h-12 font-mono text-lg tracking-widest text-center"
              autoFocus
            />
          </div>
          <div className="flex justify-end pt-4">
            <Button 
              type="submit"
              className="w-full rounded-xl h-12" 
              disabled={!imei || addMutation.isPending}
            >
              {addMutation.isPending ? "Verifying..." : "Add Device"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
