import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FeedCard } from "@/components/ui/feed-card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PostWithCommentCount } from "@shared/schema";
import { getPosts } from "@/lib/api";

interface PaginationData {
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
}

interface PostsResponse {
  posts: PostWithCommentCount[];
  pagination?: PaginationData;
}

export default function Feed() {
  const queryClient = useQueryClient();
  const [sortBy, setSortBy] = useState<string>("newest");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [allPosts, setAllPosts] = useState<PostWithCommentCount[]>([]);
  const [displayCount, setDisplayCount] = useState<number>(5); // Number of posts to display
  const [paginationData, setPaginationData] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    hasMore: false
  });
  
  // Determine API params based on sortBy value
  const getTypeParam = () => {
    switch (sortBy) {
      case "comments": return "popular";
      case "active": return "latest"; // We'll simulate this with regular feed for now
      case "newest":
      default: return "latest";
    }
  };
  
  const { data, isLoading, error } = useQuery<PostsResponse>({
    queryKey: ["/api/social/posts", { type: getTypeParam(), page: currentPage, sort: sortBy }],
    queryFn: () => getPosts(getTypeParam(), currentPage),
    staleTime: 60 * 1000, // Reduced to 1 minute to make refreshes more effective
  });
  
  // Reset and refresh when sort changes
  useEffect(() => {
    setCurrentPage(1);
    setDisplayCount(5); // Reset display count when changing sort
    setAllPosts([]);
    queryClient.invalidateQueries({ 
      queryKey: ["/api/social/posts", { type: getTypeParam() }] 
    });
  }, [sortBy, queryClient]);
  
  // Use useEffect to update state when data changes
  useEffect(() => {
    if (data) {
      // Handle posts data
      const newPosts = data.posts || [];
      
      if (currentPage === 1) {
        // Reset posts list when loading first page
        setAllPosts(newPosts);
      } else {
        // Append posts for subsequent pages
        const existingIds = new Set(allPosts.map(post => post.id));
        const uniqueNewPosts = newPosts.filter(post => !existingIds.has(post.id));
        
        if (uniqueNewPosts.length > 0) {
          setAllPosts(prev => [...prev, ...uniqueNewPosts]);
        }
      }
      
      // Handle pagination data
      if (data.pagination) {
        setPaginationData(data.pagination);
      }
    }
  }, [data, currentPage]);

  const handleLoadMore = () => {
    // Increase display count by 5 (to next multiple of 5)
    setDisplayCount(prev => prev + 5);
    
    // If we need more data from API, load next page
    if (displayCount + 5 > allPosts.length && paginationData.hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handleRefresh = () => {
    setCurrentPage(1); // Reset to first page
    setDisplayCount(5); // Reset display count back to initial 5
    setAllPosts([]); // Clear current posts
    queryClient.invalidateQueries({ 
      queryKey: ["/api/social/posts", { type: getTypeParam(), sort: sortBy }] 
    });
  };

  if (error) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-red-500">Error loading data</h2>
        <p className="text-gray-600 mt-2">{(error as Error).message}</p>
        <button 
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <section id="feed">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Latest Feed</h2>
          <p className="text-gray-600">Real-time updates from across the platform</p>
        </div>
        <button 
          onClick={handleRefresh}
          className="px-4 py-2 bg-primary text-white rounded-lg flex items-center gap-2"
        >
          <i className="fas fa-sync-alt"></i>
          <span>Refresh</span>
        </button>
      </header>

      {/* Filter options */}
      <div className="bg-white p-3 rounded-lg shadow-sm mb-6 flex flex-wrap gap-3">
        <div className="flex-1 flex items-center">
          <span className="text-gray-500 mr-2">Sort by:</span>
          <select 
            className="bg-gray-100 rounded-md px-3 py-1 border-none text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest</option>
            <option value="comments">Most Comments</option>
            <option value="active">Most Active Users</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-md text-sm flex items-center gap-1">
            <i className="fas fa-filter"></i>
            <span>Filter</span>
          </button>
          <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-md text-sm flex items-center gap-1">
            <i className="fas fa-calendar-alt"></i>
            <span>Date Range</span>
          </button>
        </div>
      </div>

      {/* Feed list */}
      {isLoading && currentPage === 1 ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-4">
          {allPosts.length > 0 ? (
            <>
              {allPosts.slice(0, displayCount).map((post, index) => (
                <FeedCard 
                  key={post.id} 
                  post={post} 
                  isNew={index === 0 && currentPage === 1} 
                />
              ))}
              
              {/* Load more button */}
              <div className="text-center py-4">
                {isLoading && currentPage > 1 ? (
                  <LoadingSpinner />
                ) : (displayCount < allPosts.length || paginationData.hasMore) ? (
                  <button 
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    onClick={handleLoadMore}
                  >
                    Load More
                  </button>
                ) : null}
              </div>
            </>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500">No posts found</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
