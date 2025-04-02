import { type PostWithCommentCount, type SocialComment } from "@shared/schema";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPostComments } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Link } from "wouter";

interface FeedCardProps {
  post: PostWithCommentCount;
  isNew?: boolean;
}

export function FeedCard({ post, isNew = false }: FeedCardProps) {
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
          {isNew && (
            <div className="ml-auto">
              <span className="bg-green-100 text-green-600 text-xs font-medium py-1 px-2 rounded-full">
                New
              </span>
            </div>
          )}
        </div>
        <p className="mb-4">{post.content}</p>
        <div className="flex gap-4 mb-3">
          <span className="flex items-center gap-1 text-sm text-gray-500">
            <i className="fas fa-comment"></i>
            <span>Comments</span>
          </span>
          <span className="flex items-center gap-1 text-sm text-gray-500">
            <i className="fas fa-chart-line"></i>
            <span>Trending +{post.trend}%</span>
          </span>
        </div>
        <div className="border-t border-gray-100 pt-3 flex">
          <Link href={`/user/${post.userid}`}>
            <a className="flex-1 text-gray-500 text-sm flex items-center justify-center gap-1 hover:text-primary">
              <i className="fas fa-eye"></i>
              <span>View Author</span>
            </a>
          </Link>
          <button 
            className="flex-1 text-gray-500 text-sm flex items-center justify-center gap-1 hover:text-primary"
            onClick={() => setShowComments(!showComments)}
          >
            <i className="fas fa-comment"></i>
            <span>{showComments ? "Hide Comments" : "View Comments"}</span>
          </button>
          <button className="flex-1 text-gray-500 text-sm flex items-center justify-center gap-1 hover:text-primary">
            <i className="fas fa-share"></i>
            <span>Share</span>
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
