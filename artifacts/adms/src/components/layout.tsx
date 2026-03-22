import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  Shield, Users, Smartphone, FileX, BarChart3, Settings, 
  LogOut, Bell, Menu, X, CheckSquare, Search, BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useListNotifications } from "@workspace/api-client-react";

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: notifications } = useListNotifications();

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  let navItems: NavItem[] = [];

  if (user?.role === "admin") {
    navItems = [
      { label: "Dashboard", href: "/admin", icon: <BarChart3 className="w-5 h-5" /> },
      { label: "Team Leaders", href: "/admin/leaders", icon: <Shield className="w-5 h-5" /> },
      { label: "Agents", href: "/admin/agents", icon: <Users className="w-5 h-5" /> },
      { label: "Devices", href: "/admin/devices", icon: <Smartphone className="w-5 h-5" /> },
      { label: "Blacklist", href: "/admin/blacklist", icon: <FileX className="w-5 h-5" /> },
      { label: "Performance", href: "/admin/performance", icon: <BarChart3 className="w-5 h-5" /> },
      { label: "System Logs", href: "/admin/logs", icon: <BookOpen className="w-5 h-5" /> },
    ];
  } else if (user?.role === "leader") {
    navItems = [
      { label: "Dashboard", href: "/leader", icon: <BarChart3 className="w-5 h-5" /> },
      { label: "My Agents", href: "/leader/agents", icon: <Users className="w-5 h-5" /> },
      { label: "Devices", href: "/leader/devices", icon: <Smartphone className="w-5 h-5" /> },
      { label: "Approvals", href: "/leader/approvals", icon: <CheckSquare className="w-5 h-5" /> },
      { label: "Performance", href: "/leader/performance", icon: <BarChart3 className="w-5 h-5" /> },
    ];
  } else if (user?.role === "agent") {
    navItems = [
      { label: "Dashboard", href: "/agent", icon: <BarChart3 className="w-5 h-5" /> },
      { label: "My Devices", href: "/agent/devices", icon: <Smartphone className="w-5 h-5" /> },
      { label: "Requests", href: "/agent/requests", icon: <FileX className="w-5 h-5" /> },
      { label: "Search Device", href: "/agent/search", icon: <Search className="w-5 h-5" /> },
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
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-sidebar-foreground">
          {sidebarOpen ? <X /> : <Menu />}
        </Button>
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

            <div className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
                    <div className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer
                      ${isActive 
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-inner' 
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                      }
                    `}>
                      <span className={isActive ? 'text-primary' : ''}>{item.icon}</span>
                      <span>{item.label}</span>
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
            {location.split('/').pop() || 'Dashboard'}
          </h2>
          <div className="flex items-center gap-4 ml-auto">
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full animate-pulse" />
              )}
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-7xl mx-auto h-full"
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
