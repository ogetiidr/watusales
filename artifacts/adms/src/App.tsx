import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";

// Pages
import Login from "@/pages/login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminLeaders from "@/pages/admin/leaders";
import AdminAgents from "@/pages/admin/agents";
import AdminDevices from "@/pages/admin/devices";
import AdminBlacklist from "@/pages/admin/blacklist";
import AdminPerformance from "@/pages/admin/performance";
import AdminLogs from "@/pages/admin/logs";
import AdminSettings from "@/pages/admin/settings";
import AdminReports from "@/pages/admin/reports";
import AdminRequests from "@/pages/admin/requests";
import AdminNotifications from "@/pages/admin/notifications";
import LeaderDashboard from "@/pages/leader/dashboard";
import LeaderAgents from "@/pages/leader/agents";
import LeaderDevices from "@/pages/leader/devices";
import LeaderApprovals from "@/pages/leader/approvals";
import LeaderPerformance from "@/pages/leader/performance";
import LeaderSettings from "@/pages/leader/settings";
import LeaderReports from "@/pages/leader/reports";
import LeaderNotifications from "@/pages/leader/notifications";
import AgentDashboard from "@/pages/agent/dashboard";
import AgentDevices from "@/pages/agent/devices";
import AgentRequests from "@/pages/agent/requests";
import AgentSearch from "@/pages/agent/search";
import AgentAccount from "@/pages/agent/account";
import AgentPerformance from "@/pages/agent/performance";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, allowedRoles }: { component: any, allowedRoles: string[] }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        setLocation("/login");
      } else if (!allowedRoles.includes(user.role)) {
        setLocation(`/${user.role}`);
      }
    }
  }, [isLoading, user]);

  if (isLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  if (!user || !allowedRoles.includes(user.role)) return null;

  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function RootRedirect() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        setLocation(`/${user.role}`);
      } else {
        setLocation("/login");
      }
    }
  }, [isLoading, user]);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={RootRedirect} />
      <Route path="/login" component={Login} />

      {/* Admin Routes */}
      <Route path="/admin">{() => <ProtectedRoute component={AdminDashboard} allowedRoles={["admin"]} />}</Route>
      <Route path="/admin/leaders">{() => <ProtectedRoute component={AdminLeaders} allowedRoles={["admin"]} />}</Route>
      <Route path="/admin/agents">{() => <ProtectedRoute component={AdminAgents} allowedRoles={["admin"]} />}</Route>
      <Route path="/admin/devices">{() => <ProtectedRoute component={AdminDevices} allowedRoles={["admin"]} />}</Route>
      <Route path="/admin/blacklist">{() => <ProtectedRoute component={AdminBlacklist} allowedRoles={["admin"]} />}</Route>
      <Route path="/admin/requests">{() => <ProtectedRoute component={AdminRequests} allowedRoles={["admin"]} />}</Route>
      <Route path="/admin/performance">{() => <ProtectedRoute component={AdminPerformance} allowedRoles={["admin"]} />}</Route>
      <Route path="/admin/notifications">{() => <ProtectedRoute component={AdminNotifications} allowedRoles={["admin"]} />}</Route>
      <Route path="/admin/reports">{() => <ProtectedRoute component={AdminReports} allowedRoles={["admin"]} />}</Route>
      <Route path="/admin/logs">{() => <ProtectedRoute component={AdminLogs} allowedRoles={["admin"]} />}</Route>
      <Route path="/admin/settings">{() => <ProtectedRoute component={AdminSettings} allowedRoles={["admin"]} />}</Route>

      {/* Leader Routes */}
      <Route path="/leader">{() => <ProtectedRoute component={LeaderDashboard} allowedRoles={["leader"]} />}</Route>
      <Route path="/leader/agents">{() => <ProtectedRoute component={LeaderAgents} allowedRoles={["leader"]} />}</Route>
      <Route path="/leader/devices">{() => <ProtectedRoute component={LeaderDevices} allowedRoles={["leader"]} />}</Route>
      <Route path="/leader/approvals">{() => <ProtectedRoute component={LeaderApprovals} allowedRoles={["leader"]} />}</Route>
      <Route path="/leader/performance">{() => <ProtectedRoute component={LeaderPerformance} allowedRoles={["leader"]} />}</Route>
      <Route path="/leader/notifications">{() => <ProtectedRoute component={LeaderNotifications} allowedRoles={["leader"]} />}</Route>
      <Route path="/leader/reports">{() => <ProtectedRoute component={LeaderReports} allowedRoles={["leader"]} />}</Route>
      <Route path="/leader/settings">{() => <ProtectedRoute component={LeaderSettings} allowedRoles={["leader"]} />}</Route>

      {/* Agent Routes */}
      <Route path="/agent">{() => <ProtectedRoute component={AgentDashboard} allowedRoles={["agent"]} />}</Route>
      <Route path="/agent/devices">{() => <ProtectedRoute component={AgentDevices} allowedRoles={["agent"]} />}</Route>
      <Route path="/agent/requests">{() => <ProtectedRoute component={AgentRequests} allowedRoles={["agent"]} />}</Route>
      <Route path="/agent/performance">{() => <ProtectedRoute component={AgentPerformance} allowedRoles={["agent"]} />}</Route>
      <Route path="/agent/search">{() => <ProtectedRoute component={AgentSearch} allowedRoles={["agent"]} />}</Route>
      <Route path="/agent/account">{() => <ProtectedRoute component={AgentAccount} allowedRoles={["agent"]} />}</Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
