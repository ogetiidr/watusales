import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListUsers, useUpdateUserStatus, useMoveAgent } from "@workspace/api-client-react";
import { Users, Power, Lock, GitMerge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function AdminAgents() {
  const { data: agents, isLoading } = useListUsers({ role: "agent" });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const statusMutation = useUpdateUserStatus({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/users"] });
        toast({ title: "Status updated" });
      }
    }
  });

  const toggleStatus = (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    statusMutation.mutate({ id, data: { status: newStatus } });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Agents</h1>
        <p className="text-muted-foreground text-sm">View and manage all system agents</p>
      </div>

      <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-secondary/50">
            <TableRow>
              <TableHead>Agent</TableHead>
              <TableHead>Team Leader</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : agents?.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground"><Users className="w-12 h-12 mx-auto mb-3 opacity-20" />No agents found.</TableCell></TableRow>
            ) : (
              agents?.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell>
                    <p className="font-medium text-foreground">{agent.name}</p>
                    <p className="text-xs text-muted-foreground">{agent.username}</p>
                  </TableCell>
                  <TableCell>{agent.leaderName || <span className="text-muted-foreground italic">None</span>}</TableCell>
                  <TableCell>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${agent.status === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400'}`}>
                      {agent.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(agent.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`h-8 rounded-lg text-xs ${agent.status === 'active' ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-500/20' : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-500/20'}`}
                        onClick={() => toggleStatus(agent.id, agent.status)}
                        disabled={statusMutation.isPending}
                      >
                        {agent.status === 'active' ? <Lock className="w-3 h-3 mr-1" /> : <Power className="w-3 h-3 mr-1" />}
                        {agent.status === 'active' ? 'Suspend' : 'Activate'}
                      </Button>
                      <MoveAgentDialog agent={agent} />
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

function MoveAgentDialog({ agent }: { agent: any }) {
  const [open, setOpen] = useState(false);
  const [leaderId, setLeaderId] = useState("");
  const { data: leaders } = useListUsers({ role: "leader" });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const moveMutation = useMoveAgent({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/users"] });
        setOpen(false);
        toast({ title: "Agent moved successfully" });
      }
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs hover:bg-primary/10 hover:text-primary">
          <GitMerge className="w-3 h-3 mr-1" /> Move
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] rounded-2xl">
        <DialogHeader>
          <DialogTitle>Move Agent to Leader</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select New Team Leader</label>
            <Select value={leaderId} onValueChange={setLeaderId}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select a leader" />
              </SelectTrigger>
              <SelectContent>
                {leaders?.map((l) => (
                  <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end pt-4">
            <Button 
              className="rounded-xl px-6" 
              disabled={!leaderId || moveMutation.isPending}
              onClick={() => moveMutation.mutate({ id: agent.id, data: { newLeaderId: parseInt(leaderId) } })}
            >
              {moveMutation.isPending ? "Moving..." : "Move Agent"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
