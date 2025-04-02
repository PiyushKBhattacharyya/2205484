import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

export default function Sidebar() {
  const [location] = useLocation();
  
  const { data: authStatus } = useQuery({
    queryKey: ["/api/auth/status"],
    staleTime: 60000 // 1 minute
  });
  
  const { data: refreshData, refetch: refreshAllData } = useQuery({
    queryKey: ["refreshData"],
    enabled: false,
    queryFn: async () => {
      // Refetch all data by invalidating the cache for these queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/social/users"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/social/posts"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/social/stats"] })
      ]);
      return { refreshed: true, timestamp: new Date().toISOString() };
    }
  });
  
  const handleRefresh = () => {
    refreshAllData();
  };
  
  // Calculate last refresh time
  const lastRefresh = refreshData?.timestamp 
    ? new Date(refreshData.timestamp)
    : new Date();
  
  const timeAgo = () => {
    const now = new Date();
    const diffMs = now.getTime() - lastRefresh.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins === 1) return "1 minute ago";
    return `${diffMins} minutes ago`;
  };

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-8">
        <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
          <i className="fas fa-chart-line text-white"></i>
        </div>
        <h1 className="text-xl font-bold">Social Analytics</h1>
      </div>
      
      <nav className="flex-1">
        <ul className="space-y-2">
          <li>
            <Link href="/top-users">
              <a className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${
                location === "/" || location === "/top-users" 
                  ? "text-primary bg-blue-50" 
                  : "text-gray-700 hover:bg-gray-100"
              }`}>
                <i className="fas fa-users"></i>
                <span>Top Users</span>
              </a>
            </Link>
          </li>
          <li>
            <Link href="/trending-posts">
              <a className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${
                location === "/trending-posts" 
                  ? "text-primary bg-blue-50" 
                  : "text-gray-700 hover:bg-gray-100"
              }`}>
                <i className="fas fa-fire"></i>
                <span>Trending Posts</span>
              </a>
            </Link>
          </li>
          <li>
            <Link href="/feed">
              <a className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${
                location === "/feed" 
                  ? "text-primary bg-blue-50" 
                  : "text-gray-700 hover:bg-gray-100"
              }`}>
                <i className="fas fa-stream"></i>
                <span>Latest Feed</span>
              </a>
            </Link>
          </li>
          <li>
            <Link href="/analytics">
              <a className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${
                location === "/analytics" 
                  ? "text-primary bg-blue-50" 
                  : "text-gray-700 hover:bg-gray-100"
              }`}>
                <i className="fas fa-chart-bar"></i>
                <span>Analytics</span>
              </a>
            </Link>
          </li>
        </ul>
      </nav>
      
      <div className="mt-auto pt-4 border-t border-gray-200">
        <div className="px-4 py-2">
          <p className="text-xs text-gray-500 mb-1">Last API refresh</p>
          <p className="text-sm font-medium">{timeAgo()}</p>
        </div>
        <button 
          onClick={handleRefresh}
          className="w-full mt-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
        >
          <i className="fas fa-sync-alt"></i>
          <span>Refresh Data</span>
        </button>
      </div>
    </aside>
  );
}
