import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PostCard } from "@/components/ui/post-card";
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

export default function TrendingPosts() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'mostComments' | 'fastestGrowing' | 'mostRecent'>('mostComments');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [allPosts, setAllPosts] = useState<PostWithCommentCount[]>([]);
  const [displayCount, setDisplayCount] = useState<number>(5); // Number of posts to display
  const [paginationData, setPaginationData] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    hasMore: false
  });
  
  // Determine API params based on active tab
  const getTypeParam = () => {
    switch (activeTab) {
      case "mostComments": return "popular";
      case "fastestGrowing": return "popular"; // Currently same endpoint, but different sorting
      case "mostRecent": return "latest";
      default: return "popular";
    }
  };
  
  // Sort the posts based on the active tab
  const sortPosts = (posts: PostWithCommentCount[]) => {
    if (!posts) return [];
    
    const postsCopy = [...posts];
    
    switch (activeTab) {
      case "mostComments":
        return postsCopy.sort((a, b) => b.commentCount - a.commentCount);
      case "fastestGrowing":
        // Sort by trend value which represents growth rate
        return postsCopy.sort((a, b) => (b.trend || 0) - (a.trend || 0));
      case "mostRecent":
        // Sort by creation date (newest first)
        return postsCopy.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
      default:
        return postsCopy;
    }
  };
  
  const { data, isLoading, error } = useQuery<PostsResponse>({
    queryKey: ["/api/social/posts", { type: getTypeParam(), page: currentPage, tab: activeTab }],
    queryFn: () => getPosts(getTypeParam(), currentPage),
    staleTime: 60 * 1000, // Reduced to 1 minute to make refreshes more effective
  });
  
  // Reset state and refresh data when tab changes
  useEffect(() => {
    setCurrentPage(1);
    setDisplayCount(5); // Reset display count when changing tabs
    setAllPosts([]);
    queryClient.invalidateQueries({ 
      queryKey: ["/api/social/posts", { type: getTypeParam() }] 
    });
  }, [activeTab, queryClient]);
  
  // Update state when data changes
  useEffect(() => {
    if (data) {
      // Handle posts data
      const newPosts = data.posts || [];
      // Sort based on active tab
      const sortedPosts = sortPosts(newPosts);
      
      if (currentPage === 1) {
        // Reset posts list when loading first page
        setAllPosts(sortedPosts);
      } else {
        // Append posts for subsequent pages
        const existingIds = new Set(allPosts.map(post => post.id));
        const uniqueNewPosts = sortedPosts.filter(post => !existingIds.has(post.id));
        
        if (uniqueNewPosts.length > 0) {
          setAllPosts(prev => [...prev, ...uniqueNewPosts]);
        }
      }
      
      // Handle pagination data
      if (data.pagination) {
        setPaginationData(data.pagination);
      }
    }
  }, [data, currentPage, activeTab]);
  
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
      queryKey: ["/api/social/posts", { type: getTypeParam(), tab: activeTab }] 
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
    <section id="trending-posts" className="mb-10">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Trending Posts</h2>
          <p className="text-gray-600">Posts with the highest engagement</p>
        </div>
        <button 
          onClick={handleRefresh}
          className="px-4 py-2 bg-primary text-white rounded-lg flex items-center gap-2"
        >
          <i className="fas fa-sync-alt"></i>
          <span>Refresh</span>
        </button>
      </header>

      {/* Filter tabs */}
      <div className="flex mb-6 border-b border-gray-200">
        <button 
          className={`px-4 py-2 font-medium ${
            activeTab === 'mostComments' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('mostComments')}
        >
          Most Comments
        </button>
        <button 
          className={`px-4 py-2 font-medium ${
            activeTab === 'fastestGrowing' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('fastestGrowing')}
        >
          Fastest Growing
        </button>
        <button 
          className={`px-4 py-2 font-medium ${
            activeTab === 'mostRecent' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('mostRecent')}
        >
          Most Recent
        </button>
      </div>

      {/* Trending posts grid */}
      {isLoading && currentPage === 1 ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allPosts.length > 0 ? (
              allPosts.slice(0, displayCount).map((post) => (
                <PostCard key={post.id} post={post} />
              ))
            ) : (
              <div className="col-span-2 p-8 text-center">
                <p className="text-gray-500">No trending posts found</p>
              </div>
            )}
          </div>
          
          {/* Load more button */}
          {allPosts.length > 0 && (
            <div className="text-center py-4 mt-4">
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
          )}
        </>
      )}
    </section>
  );
}
