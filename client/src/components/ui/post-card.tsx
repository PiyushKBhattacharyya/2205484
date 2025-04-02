import { type PostWithCommentCount, type SocialComment } from "@shared/schema";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPostComments } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface PostCardProps {
  post: PostWithCommentCount;
}

export function PostCard({ post }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  
  const { data: commentsData, isLoading } = useQuery({
    queryKey: [`/api/social/posts/${post.id}/comments`],
    queryFn: () => getPostComments(post.id),
    enabled: showComments, // Only fetch when comments are shown
  });
  
  const comments = commentsData?.comments || [];
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-center mb-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold mr-3">
            {post.userAvatar}
          </div>
          <div>
            <h3 className="font-medium">{post.userName}</h3>
            <p className="text-gray-500 text-xs">{post.createdAt}</p>
          </div>
        </div>
        <p className="mb-4">{post.content}</p>
        <div className="flex justify-between items-center mb-3">
          <div className="flex gap-4">
            <span className="flex items-center gap-1 text-sm font-medium">
              <i className="fas fa-comment text-primary"></i>
              <span>Comments</span>
            </span>
          </div>
          <span className="bg-primary/10 text-primary text-xs font-medium py-1 px-2 rounded-full">
            #{post.rank} Trending
          </span>
        </div>
        <div className="border-t border-gray-100 pt-3 flex justify-between">
          <button className="text-gray-500 text-sm flex items-center gap-1">
            <i className="fas fa-eye"></i>
            <span>View Details</span>
          </button>
          <button 
            className="text-primary text-sm font-medium"
            onClick={() => setShowComments(!showComments)}
          >
            {showComments ? "Hide Comments" : "View Comments"}
          </button>
        </div>
        
        {showComments && (
          <div className="mt-4 border-t border-gray-100 pt-3">
            <h4 className="font-medium mb-2">Comments</h4>
            
            {isLoading ? (
              <div className="flex justify-center py-4">
                <LoadingSpinner />
              </div>
            ) : comments.length > 0 ? (
              <div className="space-y-3">
                {comments.map((comment: SocialComment) => (
                  <div key={comment.id} className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm">{comment.content}</p>
                    <p className="text-xs text-gray-500 mt-1">Comment #{comment.id}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm py-2">No comments found for this post.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
