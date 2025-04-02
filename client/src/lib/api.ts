import { apiRequest } from "./queryClient";
import { queryClient } from "./queryClient";

// Registration type
export type RegistrationData = {
  email: string;
  name: string;
  mobileNo: string;
  githubusername: string;
  rollNo: string;
  collegeName: string;
  accessCode: string;
};

// Auth type
export type AuthData = {
  email: string;
  name: string;
  rollNo: string;
  accessCode: string;
  clientID: string;
  clientSecret: string;
};

// API functions
export const registerWithTestServer = async (data: RegistrationData) => {
  const res = await apiRequest("POST", "/api/auth/register", data);
  return res.json();
};

export const authenticateWithTestServer = async (data: AuthData) => {
  const res = await apiRequest("POST", "/api/auth/authenticate", data);
  return res.json();
};

export const checkAuthStatus = async () => {
  const res = await apiRequest("GET", "/api/auth/status", undefined);
  return res.json();
};

export const getTopUsers = async () => {
  const res = await apiRequest("GET", "/api/social/users", undefined);
  return res.json();
};

export const getPosts = async (type: 'popular' | 'latest', page?: number) => {
  const pageParam = page ? `&page=${page}` : '';
  const res = await apiRequest("GET", `/api/social/posts?type=${type}${pageParam}`, undefined);
  return res.json();
};

export const getPostComments = async (postId: number) => {
  const res = await apiRequest("GET", `/api/social/posts/${postId}/comments`, undefined);
  return res.json();
};

export const getUserPosts = async (userId: number) => {
  // This will be used by the user detail page to get specific user posts
  const res = await apiRequest("GET", `/api/social/users/${userId}/posts`, undefined);
  return res.json();
};

export const getStats = async () => {
  const res = await apiRequest("GET", "/api/social/stats", undefined);
  return res.json();
};

// Refresh all data
export const refreshAllData = async () => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["/api/social/users"] }),
    queryClient.invalidateQueries({ queryKey: ["/api/social/posts"] }),
    queryClient.invalidateQueries({ queryKey: ["/api/social/stats"] })
  ]);
  return { success: true };
};
