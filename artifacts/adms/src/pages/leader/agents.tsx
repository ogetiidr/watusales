import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListUsers, useCreateUser, useUpdateUserStatus, useDeleteUser } from "@workspace/api-client-react";
import { Users, UserPlus, Trash2, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function LeaderAgents() {
  const { data: agents, isLoading } = useListUsers({ role: "agent" });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", username: "", password: "", phone: "" });

  const createMutation = useCreateUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/users"] });
        toast({ title: "Agent created successfully" });
        setOpen(false);
        setForm({ name: "", username: "", password: "", phone: "" });
      },
      onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" })
    }
  });

  const statusMutation = useUpdateUserStatus({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/users"] });
        toast({ title: "Status updated" });
      }
    }
  });

  const deleteMutation = useDeleteUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/users"] });
        toast({ title: "Agent deleted" });
      },
      onError: (e: any) => toast({ title: "Cannot delete", description: e.message, variant: "destructive" })
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">My Agents</h1>
          <p className="text-muted-foreground text-sm">Manage agents under your team</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl gap-2"><UserPlus className="w-4 h-4" />Add Agent</Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader><DialogTitle>Add New Agent</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              {[
                { key: "name", label: "Full Name", placeholder: "John Doe" },
                { key: "username", label: "Username", placeholder: "johndoe" },
                { key: "password", label: "Password", placeholder: "••••••••", type: "password" },
                { key: "phone", label: "Phone (optional)", placeholder: "+1 555 000 0000" },
              ].map(f => (
                <div key={f.key} className="space-y-1.5">
                  <Label>{f.label}</Label>
                  <Input
                    type={f.type || "text"}
                    placeholder={f.placeholder}
                    value={(form as any)[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
              ))}
              <Button className="w-full rounded-xl" disabled={createMutation.isPending}
                onClick={() => createMutation.mutate({ data: { name: form.name, username: form.username, password: form.password, role: "agent" } })}>
                {createMutation.isPending ? "Creating..." : "Create Agent"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-secondary/50">
            <TableRow>
              <TableHead>Agent</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-16 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : !agents?.length ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-16 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No agents yet. Add your first agent above.</p>
                </TableCell>
              </TableRow>
            ) : agents.map(agent => (
              <TableRow key={agent.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {agent.name.charAt(0)}
                    </div>
                    <span className="font-medium">{agent.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground font-mono text-sm">@{agent.username}</TableCell>
                <TableCell>
                  <Badge variant={agent.status === "active" ? "default" : "secondary"} className="rounded-lg capitalize">
                    {agent.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{format(new Date(agent.createdAt), "MMM d, yyyy")}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" className="rounded-lg h-8"
                      onClick={() => statusMutation.mutate({ id: agent.id, data: { status: agent.status === "active" ? "suspended" : "active" } })}>
                      <Power className="w-3 h-3 mr-1" />
                      {agent.status === "active" ? "Suspend" : "Activate"}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="rounded-lg h-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Agent?</AlertDialogTitle>
                          <AlertDialogDescription>This will permanently delete {agent.name}. Agents with active devices cannot be deleted.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                          <AlertDialogAction className="rounded-xl bg-destructive hover:bg-destructive/90"
                            onClick={() => deleteMutation.mutate({ id: agent.id })}>Delete</AlertDialogAction>
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
