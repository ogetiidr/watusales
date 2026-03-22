import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  Shield, Users, Smartphone, FileX, BarChart3, Settings, 
  LogOut, Bell, Menu, X, CheckSquare, Search, BookOpen,
  FileDown, ClipboardList, MessageSquare, User, TrendingUp, Trophy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useListNotifications, useMarkNotificationRead } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data: notifications } = useListNotifications();
  const markReadMutation = useMarkNotificationRead({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notifications"] }) }
  });

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  let navItems: NavItem[] = [];

  if (user?.role === "admin") {
    navItems = [
      { label: "Dashboard", href: "/admin", icon: <BarChart3 className="w-5 h-5" /> },
      { label: "Team Leaders", href: "/admin/leaders", icon: <Shield className="w-5 h-5" /> },
      { label: "Agents", href: "/admin/agents", icon: <Users className="w-5 h-5" /> },
      { label: "Devices", href: "/admin/devices", icon: <Smartphone className="w-5 h-5" /> },
      { label: "Blacklist", href: "/admin/blacklist", icon: <FileX className="w-5 h-5" /> },
      { label: "Requests", href: "/admin/requests", icon: <ClipboardList className="w-5 h-5" /> },
      { label: "Performance", href: "/admin/performance", icon: <Trophy className="w-5 h-5" /> },
      { label: "Notifications", href: "/admin/notifications", icon: <MessageSquare className="w-5 h-5" /> },
      { label: "Reports", href: "/admin/reports", icon: <FileDown className="w-5 h-5" /> },
      { label: "System Logs", href: "/admin/logs", icon: <BookOpen className="w-5 h-5" /> },
      { label: "Settings", href: "/admin/settings", icon: <Settings className="w-5 h-5" /> },
    ];
  } else if (user?.role === "leader") {
    navItems = [
      { label: "Dashboard", href: "/leader", icon: <BarChart3 className="w-5 h-5" /> },
      { label: "My Agents", href: "/leader/agents", icon: <Users className="w-5 h-5" /> },
      { label: "Devices", href: "/leader/devices", icon: <Smartphone className="w-5 h-5" /> },
      { label: "Approvals", href: "/leader/approvals", icon: <CheckSquare className="w-5 h-5" /> },
      { label: "Performance", href: "/leader/performance", icon: <Trophy className="w-5 h-5" /> },
      { label: "Notifications", href: "/leader/notifications", icon: <MessageSquare className="w-5 h-5" /> },
      { label: "Reports", href: "/leader/reports", icon: <FileDown className="w-5 h-5" /> },
      { label: "Settings", href: "/leader/settings", icon: <Settings className="w-5 h-5" /> },
    ];
  } else if (user?.role === "agent") {
    navItems = [
      { label: "Dashboard", href: "/agent", icon: <BarChart3 className="w-5 h-5" /> },
      { label: "My Devices", href: "/agent/devices", icon: <Smartphone className="w-5 h-5" /> },
      { label: "Requests", href: "/agent/requests", icon: <ClipboardList className="w-5 h-5" /> },
      { label: "Performance", href: "/agent/performance", icon: <TrendingUp className="w-5 h-5" /> },
      { label: "Search Device", href: "/agent/search", icon: <Search className="w-5 h-5" /> },
      { label: "Account", href: "/agent/account", icon: <User className="w-5 h-5" /> },
    ];
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-sidebar text-sidebar-foreground">
        <div className="flex items-center gap-2 font-display font-bold text-xl">
          <Shield className="w-6 h-6 text-primary" />
          <span>ADMS</span>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell notifications={notifications || []} unreadCount={unreadCount} onMarkRead={id => markReadMutation.mutate({ id })} />
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-sidebar-foreground">
            {sidebarOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {/* Sidebar */}
      <AnimatePresence>
        {(sidebarOpen || window.innerWidth >= 768) && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`
              fixed md:relative z-40 w-64 h-full bg-sidebar text-sidebar-foreground flex flex-col shadow-2xl md:shadow-none
              ${sidebarOpen ? 'block' : 'hidden md:flex'}
            `}
          >
            <div className="p-6 hidden md:flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-display font-bold text-xl leading-tight">ADMS</h1>
                <p className="text-xs text-sidebar-foreground/60">Management System</p>
              </div>
            </div>

            <div className="flex-1 px-4 py-4 space-y-0.5 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
                    <div className={`
                      flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 cursor-pointer
                      ${isActive 
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-inner' 
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                      }
                    `}>
                      <span className={isActive ? 'text-primary' : ''}>{item.icon}</span>
                      <span className="text-sm">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="p-4 mt-auto">
              <div className="bg-sidebar-accent/30 rounded-2xl p-4 border border-sidebar-border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-medium text-sm truncate">{user?.name}</p>
                    <p className="text-xs text-sidebar-foreground/60 capitalize">{user?.role}</p>
                  </div>
                </div>
                <Button 
                  variant="destructive" 
                  className="w-full justify-start gap-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground border-0"
                  onClick={logout}
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Topbar */}
        <header className="h-16 border-b bg-card flex items-center justify-between px-6 shrink-0 z-10">
          <h2 className="font-display font-semibold text-lg text-foreground capitalize hidden md:block">
            {navItems.find(n => n.href === location)?.label || "Dashboard"}
          </h2>
          <div className="flex items-center gap-4 ml-auto">
            <div className="hidden md:block">
              <NotificationBell notifications={notifications || []} unreadCount={unreadCount} onMarkRead={id => markReadMutation.mutate({ id })} />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-7xl mx-auto"
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

function NotificationBell({ notifications, unreadCount, onMarkRead }: {
  notifications: any[];
  unreadCount: number;
  onMarkRead: (id: number) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-destructive rounded-full text-[10px] text-white flex items-center justify-center font-bold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 rounded-2xl p-0 shadow-xl" sideOffset={8}>
        <div className="p-4 border-b border-border/50">
          <h3 className="font-display font-semibold">Notifications</h3>
          {unreadCount > 0 && <p className="text-xs text-muted-foreground">{unreadCount} unread</p>}
        </div>
        <div className="max-h-[360px] overflow-y-auto divide-y divide-border/30">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : notifications.slice(0, 15).map(n => (
            <div 
              key={n.id} 
              className={`p-4 cursor-pointer hover:bg-secondary/50 transition-colors ${!n.read ? 'bg-primary/5' : ''}`}
              onClick={() => !n.read && onMarkRead(n.id)}
            >
              <div className="flex items-start gap-3">
                {!n.read && <div className="w-2 h-2 bg-primary rounded-full mt-1.5 shrink-0" />}
                <div className={!n.read ? "" : "pl-5"}>
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">{format(new Date(n.createdAt), "MMM d, h:mm a")}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
