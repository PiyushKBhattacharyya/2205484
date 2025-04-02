import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserCard } from "@/components/ui/user-card";
import { DataCard } from "@/components/ui/data-card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { UserWithPostCount, AnalyticsStat } from "@shared/schema";
import { useState } from "react";

export default function TopUsers() {
  const queryClient = useQueryClient();
  const [displayCount, setDisplayCount] = useState<number>(5); // Number of users to display
  
  const { data, isLoading, error } = useQuery<{
    users: UserWithPostCount[];
    stats: AnalyticsStat;
  }>({
    queryKey: ["/api/social/users"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Handle load more button click
  const handleLoadMore = () => {
    setDisplayCount(prev => prev + 5); // Increase by 5 each time
  };

  if (error) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-red-500">Error loading data</h2>
        <p className="text-gray-600 mt-2">{(error as Error).message}</p>
        <button 
          onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/social/users"] })}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <section id="top-users" className="mb-10">
      <header className="mb-6">
        <h2 className="text-2xl font-bold">Top Users</h2>
        <p className="text-gray-600">Users with the highest number of posts</p>
      </header>

      {/* Stats overview cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <DataCard 
          title="Total Users" 
          value={data?.stats?.totalUsers || 0} 
          isLoading={isLoading} 
        />
        <DataCard 
          title="Total Posts" 
          value={data?.stats?.totalPosts || 0} 
          isLoading={isLoading} 
        />
        <DataCard 
          title="Total Comments" 
          value={data?.stats?.totalComments || 0} 
          isLoading={isLoading} 
        />
        <DataCard 
          title="Avg. Posts/User" 
          value={(data?.stats?.avgPostsPerUser || 0).toFixed(1)} 
          isLoading={isLoading} 
        />
      </div>

      {/* Top users list */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <LoadingSpinner />
        ) : data?.users && data.users.length > 0 ? (
          <>
            {data.users.slice(0, displayCount).map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
            
            {/* Load more button */}
            {displayCount < data.users.length && (
              <div className="text-center py-4 mt-2 border-t border-gray-100">
                <button 
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  onClick={handleLoadMore}
                >
                  Load More
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-500">No users found</p>
          </div>
        )}
      </div>
    </section>
  );
}
