import express from "express";
import { storage } from "../storage";
import { z } from "zod";
import axios from "axios";
import { SocialUserSchema, SocialPostSchema, SocialCommentSchema, SocialPost, SocialComment, SocialUser } from "@shared/schema";
import * as dotenv from 'dotenv';
import * as mockData from "../mockData";

dotenv.config();
const router = express.Router();
const TEST_SERVER_BASE_URL = "http://20.244.56.144/evaluation-service";
const IS_DEMO_MODE = process.env.MODE === 'demo';

// Helper function to get auth token
const getAuthToken = async () => {
  const token = await storage.getAuthToken();
  if (!token) throw new Error("Not authenticated");
  
  // Handle different token formats
  // Check for the presence of properties instead of using type assertion
  const tokenObj = token as any; // Use any for flexibility
  
  if (tokenObj.access_token) {
    return tokenObj.access_token;
  } else if (tokenObj.accessToken) {
    return tokenObj.accessToken;
  } else {
    // If token exists but doesn't match expected format, log it and use a default value for demo
    console.error("Unexpected token format:", token);
    throw new Error("Invalid token format");
  }
};

// Helper to check if cache is stale (older than 5 minutes)
const isCacheStale = async (key: string) => {
  // In demo mode, don't check cache staleness
  if (IS_DEMO_MODE) return false;
  
  const lastUpdate = await storage.getLastUpdate(key);
  if (!lastUpdate) return true;
  
  const now = Date.now();
  const cacheAge = now - lastUpdate;
  return cacheAge > 5 * 60 * 1000; // 5 minutes
};

// Helper to generate a random avatar based on name
const generateAvatar = (name: string) => {
  if (!name) return "";
  const initials = name.split(" ")
    .slice(0, 2)
    .map(part => part[0])
    .join("")
    .toUpperCase();
  return initials;
};

// Get top users with most posts
router.get("/users", async (req, res) => {
  try {
    // If in demo mode, return mock data
    if (IS_DEMO_MODE) {
      const mockTopUsers = mockData.getTopUsers();
      const mockStats = mockData.getStats();
      
      // Cache the mock data
      await storage.setTopUsers(mockTopUsers);
      await storage.setStats(mockStats);
      
      return res.json({ 
        users: mockTopUsers, 
        stats: mockStats
      });
    }
    
    // Check cache first
    if (!await isCacheStale("topUsers")) {
      const cachedUsers = await storage.getTopUsers();
      if (cachedUsers && cachedUsers.length > 0) {
        return res.json({ users: cachedUsers });
      }
    }

    // Get auth token
    const token = await getAuthToken();

    // Fetch users from test server
    const response = await axios.get(`${TEST_SERVER_BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Debug the actual API response structure
    console.log("API Response format:", {
      dataType: typeof response.data,
      isArray: Array.isArray(response.data),
      keysIfObject: typeof response.data === 'object' ? Object.keys(response.data) : 'not an object',
      sample: JSON.stringify(response.data).substring(0, 300) + '...' // Show beginning of response
    });

    // The API returns users data in a different format than expected
    // We need to transform it to our expected format
    let users: SocialUser[] = [];
    try {
      if (typeof response.data === 'object' && !Array.isArray(response.data)) {
        if (response.data.users) {
          // Handle case where users is an object like {1: "John Doe", 2: "Jane Doe", ...}
          if (typeof response.data.users === 'object' && !Array.isArray(response.data.users)) {
            // Transform the object to an array of user objects
            users = Object.entries(response.data.users).map(([idStr, name]) => {
              const id = parseInt(idStr, 10);
              return {
                id,
                name: name as string,
                email: `user${id}@example.com`, // Generate fake email since it's not in the response
                rollNo: `R00${id}` // Generate fake rollNo since it's not in the response
              };
            });
          } else if (Array.isArray(response.data.users)) {
            // If users is already an array, parse it directly
            users = z.array(SocialUserSchema).parse(response.data.users);
          }
        } else if (Array.isArray(response.data)) {
          // Try direct array parsing
          users = z.array(SocialUserSchema).parse(response.data);
        }
      }
      
      console.log("Transformed users:", users.slice(0, 2)); // Log a sample for debugging
      await storage.cacheUsers(users);
    } catch (error) {
      console.error("Error parsing users data:", error);
      throw error;
    }

    // Build user post counts
    const userPostCounts: Map<number, { user: typeof users[0], count: number }> = new Map();

    // Fetch posts for each user to determine post counts
    for (const user of users) {
      try {
        const postsResponse = await axios.get(`${TEST_SERVER_BASE_URL}/users/${user.id}/posts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Debug the posts response
        console.log(`Posts response format for user ${user.id}:`, {
          dataType: typeof postsResponse.data,
          isArray: Array.isArray(postsResponse.data),
          keysIfObject: typeof postsResponse.data === 'object' ? Object.keys(postsResponse.data) : 'not an object',
        });
        
        let userPosts: SocialPost[] = [];
        
        try {
          // Try to parse the response according to expected format
          if (typeof postsResponse.data === 'object' && !Array.isArray(postsResponse.data)) {
            if (postsResponse.data.posts) {
              // Handle two possible formats for posts
              if (Array.isArray(postsResponse.data.posts)) {
                // Format: { posts: [...] }
                userPosts = z.array(SocialPostSchema).parse(postsResponse.data.posts);
              } else if (typeof postsResponse.data.posts === 'object') {
                // Format: { posts: {1: {id: 1, ...}, 2: {id: 2, ...}} }
                userPosts = Object.values(postsResponse.data.posts)
                  .filter(post => typeof post === 'object')
                  .map((post: any) => ({
                    id: post.id || parseInt(Object.keys(post)[0], 10) || 0,
                    userid: user.id,
                    content: post.content || "No content available"
                  }));
              }
            } else if (Array.isArray(postsResponse.data)) {
              // Direct array format
              userPosts = z.array(SocialPostSchema).parse(postsResponse.data);
            }
          }
          
          console.log(`Parsed ${userPosts.length} posts for user ${user.id}`);
        } catch (error) {
          console.error(`Error parsing posts for user ${user.id}:`, error);
          userPosts = []; // Empty on error
        }
        
        await storage.cachePosts(user.id, userPosts);
        
        userPostCounts.set(user.id, { 
          user, 
          count: userPosts.length 
        });
      } catch (error) {
        console.error(`Failed to fetch posts for user ${user.id}:`, error);
        // Continue with next user even if one fails
      }
    }

    // Sort users by post count and take top 5
    const sortedUsers = Array.from(userPostCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((item, index) => ({
        id: item.user.id,
        name: item.user.name,
        postCount: item.count,
        commentCount: Math.floor(Math.random() * 200) + 50, // Mocked for UI
        joinDate: new Date(Date.now() - Math.random() * 10000000000).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
        avatar: generateAvatar(item.user.name),
        trend: Math.floor(Math.random() * 15) + 1,
      }));

    // Calculate stats
    const allPosts = await storage.getAllPosts();
    const totalComments = await calculateTotalComments(allPosts);
    
    const stats = {
      totalUsers: users.length,
      totalPosts: allPosts.length,
      totalComments,
      avgPostsPerUser: users.length > 0 ? allPosts.length / users.length : 0,
    };

    // Cache the results
    await storage.setTopUsers(sortedUsers);
    await storage.setStats(stats);
    await storage.setLastUpdate("topUsers", Date.now());

    return res.json({ users: sortedUsers, stats });
  } catch (error) {
    console.error("Error fetching top users:", error);
    res.status(500).json({ error: "Failed to fetch top users" });
  }
});

// Get popular or latest posts
router.get("/posts", async (req, res) => {
  try {
    const type = z.enum(["popular", "latest"]).parse(req.query.type || "popular");
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = 5; // Fixed page size of 5 items
    
    // If in demo mode, return mock data
    if (IS_DEMO_MODE) {
      const allMockPosts = type === "popular" 
        ? mockData.getPopularPosts() 
        : mockData.getLatestPosts();
      
      // Apply pagination to mock data
      const startIndex = (page - 1) * pageSize;
      const mockPosts = allMockPosts.slice(startIndex, startIndex + pageSize);
      
      // Cache the mock data
      if (type === "popular") {
        await storage.setPopularPosts(mockPosts);
      } else {
        await storage.setLatestPosts(mockPosts);
      }
      
      return res.json({ 
        posts: mockPosts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(allMockPosts.length / pageSize),
          hasMore: startIndex + pageSize < allMockPosts.length
        }
      });
    }
    
    const cacheKey = type === "popular" ? "popularPosts" : "latestPosts";

    // Check cache first
    if (!await isCacheStale(cacheKey)) {
      const allCachedPosts = type === "popular" 
        ? await storage.getPopularPosts()
        : await storage.getLatestPosts();
      
      if (allCachedPosts && allCachedPosts.length > 0) {
        // Apply pagination to cached posts
        const startIndex = (page - 1) * pageSize;
        const cachedPosts = allCachedPosts.slice(startIndex, startIndex + pageSize);
        
        return res.json({ 
          posts: cachedPosts,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(allCachedPosts.length / pageSize),
            hasMore: startIndex + pageSize < allCachedPosts.length
          }
        });
      }
    }

    // Get auth token
    const token = await getAuthToken();

    // Ensure we have users cached
    let users = await storage.getUsers();
    if (!users || users.length === 0) {
      const response = await axios.get(`${TEST_SERVER_BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      try {
        // Handle the object format from the API
        if (typeof response.data === 'object' && !Array.isArray(response.data)) {
          if (response.data.users) {
            // Handle case where users is an object like {1: "John Doe", 2: "Jane Doe", ...}
            if (typeof response.data.users === 'object' && !Array.isArray(response.data.users)) {
              // Transform the object to an array of user objects
              users = Object.entries(response.data.users).map(([idStr, name]) => {
                const id = parseInt(idStr, 10);
                return {
                  id,
                  name: name as string,
                  email: `user${id}@example.com`, // Generate fake email since it's not in the response
                  rollNo: `R00${id}` // Generate fake rollNo since it's not in the response
                };
              });
            } else if (Array.isArray(response.data.users)) {
              // If users is already an array, parse it directly
              users = z.array(SocialUserSchema).parse(response.data.users);
            }
          } else if (Array.isArray(response.data)) {
            // Direct array parsing
            users = z.array(SocialUserSchema).parse(response.data);
          }
        }
        
        console.log("Users data loaded:", users.length);
        await storage.cacheUsers(users);
      } catch (error) {
        console.error("Error parsing users data:", error);
        throw error;
      }
    }

    // Collect all posts if we don't have them already
    let allPosts = await storage.getAllPosts();
    if (allPosts.length === 0) {
      for (const user of users) {
        try {
          const postsResponse = await axios.get(`${TEST_SERVER_BASE_URL}/users/${user.id}/posts`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          // Debug the posts response
          console.log(`Posts response format for user ${user.id}:`, {
            dataType: typeof postsResponse.data,
            isArray: Array.isArray(postsResponse.data),
            keysIfObject: typeof postsResponse.data === 'object' ? Object.keys(postsResponse.data) : 'not an object',
          });
          
          let userPosts: SocialPost[] = [];
          
          try {
            // Try to parse the response according to expected format
            if (typeof postsResponse.data === 'object' && !Array.isArray(postsResponse.data)) {
              if (postsResponse.data.posts) {
                // Handle two possible formats for posts
                if (Array.isArray(postsResponse.data.posts)) {
                  // Format: { posts: [...] }
                  userPosts = z.array(SocialPostSchema).parse(postsResponse.data.posts);
                } else if (typeof postsResponse.data.posts === 'object') {
                  // Format: { posts: {1: {id: 1, ...}, 2: {id: 2, ...}} }
                  userPosts = Object.values(postsResponse.data.posts)
                    .filter(post => typeof post === 'object')
                    .map((post: any) => ({
                      id: post.id || parseInt(Object.keys(post)[0], 10) || 0,
                      userid: user.id,
                      content: post.content || "No content available"
                    }));
                }
              } else if (Array.isArray(postsResponse.data)) {
                // Direct array format
                userPosts = z.array(SocialPostSchema).parse(postsResponse.data);
              }
            }
            
            console.log(`Parsed ${userPosts.length} posts for user ${user.id}`);
          } catch (parseError) {
            console.error(`Error parsing posts for user ${user.id}:`, parseError);
            userPosts = []; // Empty on error
          }
          await storage.cachePosts(user.id, userPosts);
        } catch (error) {
          console.error(`Failed to fetch posts for user ${user.id}:`, error);
        }
      }
      allPosts = await storage.getAllPosts();
    }

    // Get comments for each post to determine popularity
    const postsWithComments: { post: typeof allPosts[0], commentCount: number }[] = [];
    
    for (const post of allPosts) {
      try {
        const cachedComments = await storage.getComments(post.id);
        
        if (cachedComments && cachedComments.length > 0) {
          postsWithComments.push({
            post,
            commentCount: cachedComments.length
          });
        } else {
          const commentsResponse = await axios.get(`${TEST_SERVER_BASE_URL}/posts/${post.id}/comments`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          // Debug the comments response
          console.log(`Comments response format for post ${post.id}:`, {
            dataType: typeof commentsResponse.data,
            isArray: Array.isArray(commentsResponse.data),
            keysIfObject: typeof commentsResponse.data === 'object' ? Object.keys(commentsResponse.data) : 'not an object',
          });
          
          let postComments: SocialComment[] = [];
          
          try {
            // Try to parse the response according to expected format
            if (typeof commentsResponse.data === 'object' && !Array.isArray(commentsResponse.data)) {
              if (commentsResponse.data.comments) {
                // Handle two possible formats for comments
                if (Array.isArray(commentsResponse.data.comments)) {
                  // Format: { comments: [...] }
                  postComments = z.array(SocialCommentSchema).parse(commentsResponse.data.comments);
                } else if (typeof commentsResponse.data.comments === 'object') {
                  // Format: { comments: {1: {id: 1, ...}, 2: {id: 2, ...}} }
                  postComments = Object.values(commentsResponse.data.comments)
                    .filter(comment => typeof comment === 'object')
                    .map((comment: any) => ({
                      id: comment.id || parseInt(Object.keys(comment)[0], 10) || 0,
                      postid: post.id,
                      content: comment.content || "No comment content available"
                    }));
                }
              } else if (Array.isArray(commentsResponse.data)) {
                // Direct array format
                postComments = z.array(SocialCommentSchema).parse(commentsResponse.data);
              }
            }
            
            console.log(`Parsed ${postComments.length} comments for post ${post.id}`);
          } catch (parseError) {
            console.error(`Error parsing comments for post ${post.id}:`, parseError);
            postComments = []; // Empty on error
          }
          await storage.cacheComments(post.id, postComments);
          
          postsWithComments.push({
            post,
            commentCount: postComments.length
          });
        }
      } catch (error) {
        console.error(`Failed to fetch comments for post ${post.id}:`, error);
        // Add post with 0 comments to avoid excluding it
        postsWithComments.push({
          post,
          commentCount: 0
        });
      }
    }

    let resultPosts: typeof postsWithComments = [];
    
    if (type === "popular") {
      // Sort by comment count and limit to top 5
      postsWithComments.sort((a, b) => b.commentCount - a.commentCount);
      resultPosts = postsWithComments.slice(0, 5);
    } else {
      // For latest, just sort by id (assuming higher id = newer post)
      postsWithComments.sort((a, b) => b.post.id - a.post.id);
      resultPosts = postsWithComments.slice(0, 5);
    }

    // Map to return format with user info
    const formattedPosts = resultPosts.map((item, index) => {
      const user = users.find(u => u.id === item.post.userid);
      return {
        id: item.post.id,
        userid: item.post.userid,
        userName: user?.name || "Unknown User",
        userAvatar: generateAvatar(user?.name || "Unknown User"),
        content: item.post.content,
        commentCount: item.commentCount,
        createdAt: new Date(Date.now() - Math.random() * 50000000).toLocaleDateString('en-US', { 
          hour: 'numeric', 
          minute: 'numeric', 
          day: 'numeric', 
          month: 'numeric' 
        }),
        trend: Math.floor(Math.random() * 25) + 5, // Random trend
        rank: index + 1
      };
    });

    // Apply pagination
    const allFormattedPosts = formattedPosts;
    const startIndex = (page - 1) * 5;
    const paginatedPosts = allFormattedPosts.slice(startIndex, startIndex + 5);
    
    // Cache the results
    if (type === "popular") {
      await storage.setPopularPosts(allFormattedPosts);
    } else {
      await storage.setLatestPosts(allFormattedPosts);
    }
    await storage.setLastUpdate(cacheKey, Date.now());

    return res.json({ 
      posts: paginatedPosts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(allFormattedPosts.length / 5),
        hasMore: startIndex + 5 < allFormattedPosts.length
      }
    });
  } catch (error) {
    console.error(`Error fetching ${req.query.type || "popular"} posts:`, error);
    res.status(500).json({ error: `Failed to fetch ${req.query.type || "popular"} posts` });
  }
});

// Get comments for a specific post
router.get("/posts/:postId/comments", async (req, res) => {
  try {
    const postId = parseInt(req.params.postId, 10);
    if (isNaN(postId)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }
    
    // First check if we have comments in cache
    const cachedComments = await storage.getComments(postId);
    if (cachedComments && cachedComments.length > 0) {
      return res.json({ comments: cachedComments });
    }
    
    // If in demo mode, return empty array
    if (IS_DEMO_MODE) {
      return res.json({ comments: [] });
    }
    
    // Try to fetch from API
    try {
      const token = await getAuthToken();
      const commentsResponse = await axios.get(`${TEST_SERVER_BASE_URL}/posts/${postId}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Debug the comments response
      console.log(`Comments response format for post ${postId}:`, {
        dataType: typeof commentsResponse.data,
        isArray: Array.isArray(commentsResponse.data),
        keysIfObject: typeof commentsResponse.data === 'object' ? Object.keys(commentsResponse.data) : 'not an object',
      });
      
      let postComments: SocialComment[] = [];
      
      // Try to parse the response according to expected format
      if (typeof commentsResponse.data === 'object' && !Array.isArray(commentsResponse.data)) {
        if (commentsResponse.data.comments) {
          // Handle two possible formats for comments
          if (Array.isArray(commentsResponse.data.comments)) {
            // Format: { comments: [...] }
            postComments = z.array(SocialCommentSchema).parse(commentsResponse.data.comments);
          } else if (typeof commentsResponse.data.comments === 'object') {
            // Format: { comments: {1: {id: 1, ...}, 2: {id: 2, ...}} }
            postComments = Object.values(commentsResponse.data.comments)
              .filter(comment => typeof comment === 'object')
              .map((comment: any) => ({
                id: comment.id || parseInt(Object.keys(comment)[0], 10) || 0,
                postid: postId,
                content: comment.content || "No comment content available"
              }));
          }
        } else if (Array.isArray(commentsResponse.data)) {
          // Direct array format
          postComments = z.array(SocialCommentSchema).parse(commentsResponse.data);
        }
      }
      
      // Limit to maximum 5 comments
      postComments = postComments.slice(0, 5);
      
      // Cache the comments
      await storage.cacheComments(postId, postComments);
      
      return res.json({ comments: postComments });
    } catch (error) {
      console.error(`Error fetching comments for post ${postId}:`, error);
      res.status(500).json({ error: `Failed to fetch comments for post ${postId}` });
    }
  } catch (error) {
    console.error("Error in comments endpoint:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get stats
router.get("/stats", async (req, res) => {
  try {
    // If in demo mode, return mock data
    if (IS_DEMO_MODE) {
      const mockStats = mockData.getStats();
      await storage.setStats(mockStats);
      return res.json(mockStats);
    }
    
    const stats = await storage.getStats();
    if (stats) {
      return res.json(stats);
    }
    
    // If no stats available, return a default response
    res.json({
      totalUsers: 0,
      totalPosts: 0,
      totalComments: 0,
      avgPostsPerUser: 0
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// Get posts for a specific user
router.get("/users/:userId/posts", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    
    // If in demo mode, return sample posts
    if (IS_DEMO_MODE) {
      // Generate some mock posts for this user
      const mockPosts = mockData.getAllPosts().filter(post => post.userid === userId);
      return res.json({ posts: mockPosts.slice(0, 5) });
    }
    
    // Check if we have cached posts for this user
    const posts = await storage.getPosts(userId);
    if (posts && posts.length > 0) {
      // Get users first
      const users = await storage.getUsers();
      const user = users.find(u => u.id === userId);
      
      // Process the posts to include user data and limit to 5
      const formattedPosts = posts.slice(0, 5).map(post => {
        return {
          id: post.id,
          userid: post.userid,
          content: post.content,
          userData: {
            name: user?.name || "Unknown User",
            avatar: generateAvatar(user?.name || "Unknown User"),
          },
          commentCount: 0, // We'll update this below
          createdAt: new Date(Date.now() - Math.random() * 50000000).toISOString(),
        };
      });
      
      // Get comment counts for each post
      for (const post of formattedPosts) {
        const comments = await storage.getComments(post.id);
        post.commentCount = comments.length;
      }
      
      return res.json({ posts: formattedPosts });
    }
    
    // If we don't have posts cached, return an empty array
    // Real API calls are handled during the initial data loading
    return res.json({ posts: [] });
  } catch (error) {
    console.error(`Error fetching posts for user ${req.params.userId}:`, error);
    res.status(500).json({ error: "Failed to fetch user posts" });
  }
});

// Helper to calculate total comments
async function calculateTotalComments(posts: SocialPost[]) {
  let totalComments = 0;
  
  for (const post of posts) {
    const comments = await storage.getComments(post.id);
    totalComments += comments.length;
  }
  
  return totalComments;
}

export default router;
