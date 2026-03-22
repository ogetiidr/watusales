import { useState } from "react";
import { useSendNotification, useListUsers } from "@workspace/api-client-react";
import { Bell, Send, Users, Shield, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function AdminNotifications() {
  const { toast } = useToast();
  const { data: allUsers } = useListUsers({});
  const [form, setForm] = useState({ title: "", message: "", targetType: "all" as any, targetUserId: undefined as number | undefined });

  const sendMutation = useSendNotification({
    mutation: {
      onSuccess: (data) => {
        toast({ title: "Notification sent!", description: (data as any).message });
        setForm({ title: "", message: "", targetType: "all", targetUserId: undefined });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to send notification", variant: "destructive" });
      }
    }
  });

  const send = () => {
    if (!form.title || !form.message) {
      toast({ title: "Missing fields", description: "Title and message are required", variant: "destructive" });
      return;
    }
    sendMutation.mutate({ data: form });
  };

  const targetOptions = [
    { value: "all", label: "Everyone", icon: <Users className="w-4 h-4" /> },
    { value: "agents", label: "All Agents", icon: <User className="w-4 h-4" /> },
    { value: "leaders", label: "All Team Leaders", icon: <Shield className="w-4 h-4" /> },
    { value: "user", label: "Specific User", icon: <User className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-display font-bold">Send Notifications</h1>
        <p className="text-muted-foreground text-sm">Send messages to all users, specific roles, or individual users</p>
      </div>

      <Card className="shadow-md border-border/50 rounded-2xl">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="flex items-center gap-2 font-display">
            <Bell className="w-5 h-5 text-primary" />
            Compose Notification
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          <div className="space-y-2">
            <Label>Send To</Label>
            <Select value={form.targetType} onValueChange={v => setForm(f => ({ ...f, targetType: v as any, targetUserId: undefined }))}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {targetOptions.map(o => (
                  <SelectItem key={o.value} value={o.value}>
                    <span className="flex items-center gap-2">{o.icon}{o.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {form.targetType === "user" && (
            <div className="space-y-2">
              <Label>Select User</Label>
              <Select onValueChange={v => setForm(f => ({ ...f, targetUserId: Number(v) }))}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Choose a user..." />
                </SelectTrigger>
                <SelectContent>
                  {allUsers?.filter(u => u.role !== "admin").map(u => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.name} ({u.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              placeholder="Notification title..."
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              placeholder="Write your message here..."
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              className="rounded-xl resize-none min-h-[120px]"
            />
          </div>

          <Button onClick={send} disabled={sendMutation.isPending} className="w-full rounded-xl gap-2">
            <Send className="w-4 h-4" />
            {sendMutation.isPending ? "Sending..." : "Send Notification"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
