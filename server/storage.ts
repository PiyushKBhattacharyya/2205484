import { users, type User, type InsertUser, type SocialUser, type SocialPost, type SocialComment, type UserWithPostCount, type PostWithCommentCount, type AnalyticsStat, type AuthToken } from "@shared/schema";

// Storage interface with methods for social media analytics
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Authentication storage
  setAuthToken(token: AuthToken): Promise<void>;
  getAuthToken(): Promise<AuthToken | undefined>;
  
  // Social media data storage
  cacheUsers(users: SocialUser[]): Promise<void>;
  getUsers(): Promise<SocialUser[]>;
  
  cachePosts(userId: number, posts: SocialPost[]): Promise<void>;
  getPosts(userId: number): Promise<SocialPost[]>;
  getAllPosts(): Promise<SocialPost[]>;
  
  cacheComments(postId: number, comments: SocialComment[]): Promise<void>;
  getComments(postId: number): Promise<SocialComment[]>;
  
  // Analytics data storage
  setTopUsers(users: UserWithPostCount[]): Promise<void>;
  getTopUsers(): Promise<UserWithPostCount[]>;
  
  setPopularPosts(posts: PostWithCommentCount[]): Promise<void>;
  getPopularPosts(): Promise<PostWithCommentCount[]>;
  
  setLatestPosts(posts: PostWithCommentCount[]): Promise<void>;
  getLatestPosts(): Promise<PostWithCommentCount[]>;
  
  setStats(stats: AnalyticsStat): Promise<void>;
  getStats(): Promise<AnalyticsStat | undefined>;
  
  // Last update timestamp for cache management
  setLastUpdate(key: string, timestamp: number): Promise<void>;
  getLastUpdate(key: string): Promise<number | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private socialUsers: SocialUser[];
  private postsMap: Map<number, SocialPost[]>;
  private allPosts: SocialPost[];
  private commentsMap: Map<number, SocialComment[]>;
  private topUsers: UserWithPostCount[];
  private popularPosts: PostWithCommentCount[];
  private latestPosts: PostWithCommentCount[];
  private stats: AnalyticsStat | undefined;
  private authToken: AuthToken | undefined;
  private lastUpdateMap: Map<string, number>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.socialUsers = [];
    this.postsMap = new Map();
    this.allPosts = [];
    this.commentsMap = new Map();
    this.topUsers = [];
    this.popularPosts = [];
    this.latestPosts = [];
    this.stats = undefined;
    this.authToken = undefined;
    this.lastUpdateMap = new Map();
    this.currentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Authentication methods
  async setAuthToken(token: AuthToken): Promise<void> {
    this.authToken = token;
  }

  async getAuthToken(): Promise<AuthToken | undefined> {
    return this.authToken;
  }

  // Social users methods
  async cacheUsers(users: SocialUser[]): Promise<void> {
    this.socialUsers = users;
  }

  async getUsers(): Promise<SocialUser[]> {
    return this.socialUsers;
  }

  // Posts methods
  async cachePosts(userId: number, posts: SocialPost[]): Promise<void> {
    this.postsMap.set(userId, posts);
    
    // Update the all posts collection
    const existingPostIds = new Set(this.allPosts.map(post => post.id));
    for (const post of posts) {
      if (!existingPostIds.has(post.id)) {
        this.allPosts.push(post);
      }
    }
  }

  async getPosts(userId: number): Promise<SocialPost[]> {
    return this.postsMap.get(userId) || [];
  }

  async getAllPosts(): Promise<SocialPost[]> {
    return this.allPosts;
  }

  // Comments methods
  async cacheComments(postId: number, comments: SocialComment[]): Promise<void> {
    this.commentsMap.set(postId, comments);
  }

  async getComments(postId: number): Promise<SocialComment[]> {
    return this.commentsMap.get(postId) || [];
  }

  // Analytics methods
  async setTopUsers(users: UserWithPostCount[]): Promise<void> {
    this.topUsers = users;
  }

  async getTopUsers(): Promise<UserWithPostCount[]> {
    return this.topUsers;
  }

  async setPopularPosts(posts: PostWithCommentCount[]): Promise<void> {
    this.popularPosts = posts;
  }

  async getPopularPosts(): Promise<PostWithCommentCount[]> {
    return this.popularPosts;
  }

  async setLatestPosts(posts: PostWithCommentCount[]): Promise<void> {
    this.latestPosts = posts;
  }

  async getLatestPosts(): Promise<PostWithCommentCount[]> {
    return this.latestPosts;
  }

  async setStats(stats: AnalyticsStat): Promise<void> {
    this.stats = stats;
  }

  async getStats(): Promise<AnalyticsStat | undefined> {
    return this.stats;
  }

  // Cache timestamp methods
  async setLastUpdate(key: string, timestamp: number): Promise<void> {
    this.lastUpdateMap.set(key, timestamp);
  }

  async getLastUpdate(key: string): Promise<number | undefined> {
    return this.lastUpdateMap.get(key);
  }
}

export const storage = new MemStorage();
