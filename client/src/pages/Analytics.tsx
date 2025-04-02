import { useQuery } from "@tanstack/react-query";
import { getStats, getTopUsers, getPosts } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { DataCard } from "@/components/ui/data-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  Cell,
  LineChart,
  Line,
} from "recharts";

export default function Analytics() {
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/social/stats"],
    queryFn: getStats,
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/social/users"],
    queryFn: getTopUsers,
  });

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ["/api/social/posts", "popular"],
    queryFn: () => getPosts("popular"),
  });

  const users = usersData?.users || [];
  const posts = postsData?.posts || [];
  const stats = statsData || {
    totalUsers: 0,
    totalPosts: 0,
    totalComments: 0,
    avgPostsPerUser: 0,
  };

  // Colors for charts
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  // Data for users by post count chart
  const userPostData = users
    .slice(0, 5)
    .map((user: any) => ({
      name: user.name,
      posts: user.postCount,
    }));

  // Data for trending posts chart
  const trendingPostData = posts
    .slice(0, 5)
    .map((post: any) => ({
      name: `Post ${post.id}`,
      trend: post.trend,
    }));

  // Distribution of comment counts
  const commentDistribution = posts.reduce((acc: Record<string, number>, post: any) => {
    const range = getCommentRange(post.commentCount);
    acc[range] = (acc[range] || 0) + 1;
    return acc;
  }, {});

  const commentDistributionData = Object.entries(commentDistribution).map(
    ([range, count]) => ({
      range,
      count,
    })
  );

  // Helper function to categorize comment counts
  function getCommentRange(count: number): string {
    if (count === 0) return "0";
    if (count <= 5) return "1-5";
    if (count <= 10) return "6-10";
    if (count <= 20) return "11-20";
    return "21+";
  }

  if (statsLoading || usersLoading || postsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Platform Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <DataCard title="Total Users" value={stats.totalUsers} />
        <DataCard title="Total Posts" value={stats.totalPosts} />
        <DataCard
          title="Avg Posts/User"
          value={stats.avgPostsPerUser.toFixed(1)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Top Users by Post Count</CardTitle>
            <CardDescription>Post count for top 5 users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userPostData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="posts" fill="#8884d8" name="Posts" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trending Posts</CardTitle>
            <CardDescription>Trend percentage for top 5 posts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendingPostData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="trend"
                    stroke="#8884d8"
                    activeDot={{ r: 8 }}
                    name="Trend %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Comment Distribution</CardTitle>
            <CardDescription>
              Distribution of comments across posts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={commentDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="range"
                  >
                    {commentDistributionData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Health</CardTitle>
            <CardDescription>Key metrics comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    {
                      name: "Platform Metrics",
                      users: stats.totalUsers,
                      posts: stats.totalPosts,
                    },
                  ]}
                >
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="users" fill="#0088FE" name="Users" />
                  <Bar dataKey="posts" fill="#00C49F" name="Posts" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}