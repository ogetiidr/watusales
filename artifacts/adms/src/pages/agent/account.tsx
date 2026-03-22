import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { useUpdateUserProfile, useChangePassword } from "@workspace/api-client-react";
import { User, Phone, Key, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function AgentAccount() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [profile, setProfile] = useState({ name: user?.name || "", phone: (user as any)?.phone || "" });
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirm: "" });

  const profileMutation = useUpdateUserProfile({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        toast({ title: "Profile updated successfully" });
      },
      onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" })
    }
  });

  const passwordMutation = useChangePassword({
    mutation: {
      onSuccess: () => {
        toast({ title: "Password changed successfully" });
        setPasswords({ currentPassword: "", newPassword: "", confirm: "" });
      },
      onError: () => toast({ title: "Error", description: "Failed to change password. Check current password.", variant: "destructive" })
    }
  });

  const saveProfile = () => {
    if (!user) return;
    profileMutation.mutate({ id: user.id, data: { name: profile.name, phone: profile.phone } });
  };

  const changePassword = () => {
    if (passwords.newPassword !== passwords.confirm) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (passwords.newPassword.length < 6) {
      toast({ title: "Password too short", description: "Minimum 6 characters", variant: "destructive" });
      return;
    }
    passwordMutation.mutate({ data: { currentPassword: passwords.currentPassword, newPassword: passwords.newPassword } });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-display font-bold">Account Settings</h1>
        <p className="text-muted-foreground text-sm">Update your profile information and password</p>
      </div>

      <Card className="shadow-md border-border/50 rounded-2xl">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="flex items-center gap-2 font-display">
            <User className="w-5 h-5 text-primary" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-4 p-4 bg-secondary/30 rounded-xl border border-border/50">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-lg">{user?.name}</p>
              <p className="text-muted-foreground text-sm">@{user?.username}</p>
              <p className="text-primary text-xs font-medium capitalize mt-1">{user?.role}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Full Name</Label>
            <Input value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} className="rounded-xl" placeholder="Your full name" />
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />Phone Number</Label>
            <Input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} className="rounded-xl" placeholder="+1 555 000 0000" type="tel" />
          </div>

          <Button onClick={saveProfile} disabled={profileMutation.isPending} className="rounded-xl gap-2 w-full">
            <Save className="w-4 h-4" />
            {profileMutation.isPending ? "Saving..." : "Save Profile"}
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-md border-border/50 rounded-2xl">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="flex items-center gap-2 font-display">
            <Key className="w-5 h-5 text-primary" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {[
            { key: "currentPassword", label: "Current Password", placeholder: "Enter current password" },
            { key: "newPassword", label: "New Password", placeholder: "Enter new password" },
            { key: "confirm", label: "Confirm New Password", placeholder: "Confirm new password" },
          ].map(f => (
            <div key={f.key} className="space-y-1.5">
              <Label>{f.label}</Label>
              <Input
                type="password"
                placeholder={f.placeholder}
                value={(passwords as any)[f.key]}
                onChange={e => setPasswords(p => ({ ...p, [f.key]: e.target.value }))}
                className="rounded-xl"
              />
            </div>
          ))}

          <Button onClick={changePassword} disabled={passwordMutation.isPending} variant="outline" className="rounded-xl gap-2 w-full">
            <Key className="w-4 h-4" />
            {passwordMutation.isPending ? "Changing..." : "Change Password"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
