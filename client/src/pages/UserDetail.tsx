import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getUserPosts } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PostCard } from "@/components/ui/post-card";
import { useState } from "react";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

export default function UserDetail() {
  const { userId } = useParams();
  const userIdNum = parseInt(userId || "0", 10);
  const [displayCount, setDisplayCount] = useState<number>(5); // Number of posts to display
  
  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/social/users/${userIdNum}/posts`],
    queryFn: () => getUserPosts(userIdNum),
    enabled: !!userIdNum,
  });

  const posts = data?.posts || [];
  const user = posts[0]?.userData || { name: "User", avatar: "U" };
  
  // Data for content length chart
  const contentLengthData = posts.slice(0, 5).map((post: any) => ({
    id: post.id,
    length: post.content.length,
    name: `Post ${post.id}`
  }));
  
  // Data for user activity by day
  const activityByDay = posts.reduce((acc: Record<string, number>, post: any) => {
    const date = new Date(post.createdAt);
    const day = date.toLocaleDateString('en-US', { weekday: 'long' });
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});
  
  const activityData = Object.entries(activityByDay).map(([day, count]) => ({
    day,
    count
  }));
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  // Handle load more button click
  const handleLoadMore = () => {
    setDisplayCount(prev => prev + 5); // Increase by 5 each time
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Error</h2>
        <p className="text-red-500">Failed to load user data</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-6 flex items-center">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold mr-4 text-xl">
          {user.avatar || user.name.charAt(0)}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{user.name}</h1>
          <p className="text-gray-500">User ID: {userIdNum}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Post Length Analysis</CardTitle>
            <CardDescription>Character count for last 5 posts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={contentLengthData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="length" fill="#8884d8" name="Character Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Activity by Day</CardTitle>
            <CardDescription>Number of posts per day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="day"
                  >
                    {activityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <h2 className="text-xl font-bold mb-4">Latest Posts</h2>
      <div className="space-y-4">
        {posts.slice(0, displayCount).map((post: any) => (
          <PostCard key={post.id} post={post} />
        ))}
        
        {/* Load more button */}
        {posts.length > displayCount && (
          <div className="text-center py-4 mt-4">
            <button 
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              onClick={handleLoadMore}
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}