import { useState } from "react";
import { useSearchDevice } from "@workspace/api-client-react";
import { Search as SearchIcon, Shield, User, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";

export default function AgentSearch() {
  const [imeiInput, setImeiInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, isError, error } = useSearchDevice(
    { imei: searchQuery },
    { query: { enabled: !!searchQuery, retry: false } }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (imeiInput.trim()) {
      setSearchQuery(imeiInput.trim());
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
          <SearchIcon className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-display font-bold">Search Global Registry</h1>
        <p className="text-muted-foreground mt-2">Check if a device is registered in the system before adding</p>
      </div>

      <Card className="shadow-lg border-primary/20 rounded-2xl overflow-hidden">
        <CardContent className="p-2">
          <form onSubmit={handleSearch} className="flex gap-2 relative">
            <Input 
              value={imeiInput}
              onChange={e => setImeiInput(e.target.value)}
              placeholder="Enter 15-digit IMEI..."
              className="border-0 h-14 text-lg font-mono pl-4 focus-visible:ring-0 shadow-none bg-transparent"
            />
            <Button type="submit" className="h-14 px-8 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-lg transition-all" disabled={isLoading}>
              {isLoading ? "Searching..." : "Search"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {isError && (
        <div className="text-center py-12 bg-card rounded-2xl border border-border/50 shadow-sm">
          <Smartphone className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
          <h3 className="text-xl font-bold text-foreground">Device Not Found</h3>
          <p className="text-muted-foreground mt-1">This IMEI is available and not currently registered.</p>
        </div>
      )}

      {data && !isLoading && (
        <div className="bg-card border rounded-2xl shadow-md overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-secondary/50 px-6 py-4 border-b border-border/50 flex justify-between items-center">
            <h3 className="font-display font-bold text-lg">Device Details</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${data.device.status === 'blacklisted' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
              {data.device.status}
            </span>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">IMEI Number</p>
                <p className="text-xl font-mono font-bold mt-1 text-foreground">{data.device.imei}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Date Registered</p>
                <p className="text-lg font-medium mt-1 text-foreground">
                  {format(new Date(data.device.dateAdded), "MMM d, yyyy")}
                </p>
              </div>
            </div>

            <div className="border-t border-border/50 pt-6 mt-6 grid grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-500/20 text-blue-600 rounded-lg shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Current Agent</p>
                  <p className="text-lg font-bold text-foreground mt-0.5">{data.agent?.name || "None"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 rounded-lg shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Team Leader</p>
                  <p className="text-lg font-bold text-foreground mt-0.5">{data.leader?.name || "None"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
