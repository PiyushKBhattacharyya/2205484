import { 
  SocialUser, 
  SocialPost, 
  SocialComment, 
  UserWithPostCount,
  PostWithCommentCount,
  AnalyticsStat
} from '@shared/schema';

// Generate random avatar (first letter of name)
const generateAvatar = (name: string) => {
  return name.charAt(0).toUpperCase();
};

// Generate mock social users data
const mockUsers: SocialUser[] = [
  { id: 1, name: 'Aditya Sharma', email: 'aditya.sharma@example.com', rollNo: 'ROLL101', accessCode: 'demo' },
  { id: 2, name: 'Priya Patel', email: 'priya.patel@example.com', rollNo: 'ROLL102', accessCode: 'demo' },
  { id: 3, name: 'Rahul Verma', email: 'rahul.verma@example.com', rollNo: 'ROLL103', accessCode: 'demo' },
  { id: 4, name: 'Neha Singh', email: 'neha.singh@example.com', rollNo: 'ROLL104', accessCode: 'demo' },
  { id: 5, name: 'Vikram Malhotra', email: 'vikram.malhotra@example.com', rollNo: 'ROLL105', accessCode: 'demo' },
  { id: 6, name: 'Anjali Desai', email: 'anjali.desai@example.com', rollNo: 'ROLL106', accessCode: 'demo' },
  { id: 7, name: 'Sanjay Kumar', email: 'sanjay.kumar@example.com', rollNo: 'ROLL107', accessCode: 'demo' },
  { id: 8, name: 'Meera Reddy', email: 'meera.reddy@example.com', rollNo: 'ROLL108', accessCode: 'demo' },
  { id: 9, name: 'Rajesh Khanna', email: 'rajesh.khanna@example.com', rollNo: 'ROLL109', accessCode: 'demo' },
  { id: 10, name: 'Pooja Gupta', email: 'pooja.gupta@example.com', rollNo: 'ROLL110', accessCode: 'demo' }
];

// Generate mock posts data
const mockPosts: SocialPost[] = [
  { id: 1, userid: 1, content: 'Just finished an amazing project! #coding #achievement' },
  { id: 2, userid: 2, content: 'Learning new tech stack today. So exciting! #learning #tech' },
  { id: 3, userid: 3, content: 'Had a great team meeting. Ideas flowing! #teamwork' },
  { id: 4, userid: 4, content: 'Working on improving my skills in React. #react #webdev' },
  { id: 5, userid: 5, content: 'Coffee and code - perfect morning! #coffee #developer' },
  { id: 6, userid: 1, content: 'Debugging is like being a detective in a crime movie where you are also the murderer. #programming #humor' },
  { id: 7, userid: 2, content: 'Just deployed my first app! So proud! #milestone #coding' },
  { id: 8, userid: 3, content: 'Participated in a hackathon this weekend. #hackathon #coding' },
  { id: 9, userid: 4, content: 'Trying out a new productivity technique. #productivity' },
  { id: 10, userid: 5, content: 'Working from home today. My cat is my new colleague! #wfh #pets' },
  { id: 11, userid: 6, content: 'Learning about microservices architecture. Complex but fascinating! #architecture #learning' },
  { id: 12, userid: 7, content: 'Just solved a tricky bug that has been bothering me for days! #debugging #victory' },
  { id: 13, userid: 8, content: 'Starting a new open source project. Excited to collaborate! #opensource #community' },
  { id: 14, userid: 9, content: 'AI and ML are changing everything. Time to level up my skills. #AI #machinelearning' },
  { id: 15, userid: 10, content: 'Clean code principles save lives (or at least save developer sanity) #cleancode #bestpractices' }
];

// Generate mock comments data
const mockComments: SocialComment[] = [
  { id: 1, postid: 1, content: 'Great post! Thanks for sharing.' },
  { id: 2, postid: 1, content: 'I completely agree with you.' },
  { id: 3, postid: 2, content: 'This is really insightful.' },
  { id: 4, postid: 2, content: 'Could you elaborate on this point?' },
  { id: 5, postid: 3, content: 'I had a similar experience recently.' },
  { id: 6, postid: 3, content: 'I learned a lot from this!' },
  { id: 7, postid: 4, content: 'Looking forward to more posts like this.' },
  { id: 8, postid: 4, content: 'Have you tried this alternative approach?' },
  { id: 9, postid: 5, content: 'This helped me solve a problem I was facing.' },
  { id: 10, postid: 5, content: 'Would love to discuss this more.' },
  { id: 11, postid: 6, content: 'Haha, that is so true! Story of my life.' },
  { id: 12, postid: 7, content: 'Congratulations! What technologies did you use?' },
  { id: 13, postid: 8, content: 'That sounds fun! Did your team win anything?' },
  { id: 14, postid: 9, content: 'What productivity technique are you trying?' },
  { id: 15, postid: 10, content: 'Cats make the best coworkers!' }
];

// Generate top users with post counts
export const getTopUsers = (): UserWithPostCount[] => {
  return mockUsers.map(user => {
    const userPosts = mockPosts.filter(post => post.userid === user.id);
    const userComments = mockComments.filter(comment => {
      const postIds = userPosts.map(p => p.id);
      return postIds.includes(comment.postid);
    });
    
    return {
      id: user.id,
      name: user.name,
      postCount: userPosts.length,
      commentCount: userComments.length,
      joinDate: 'January 2025', // Mock date
      avatar: generateAvatar(user.name),
      trend: Math.floor(Math.random() * 25) + 5 // Random trend between 5-30%
    };
  }).sort((a, b) => b.postCount - a.postCount).slice(0, 5); // Top 5 users
};

// Generate popular posts with comment counts
export const getPopularPosts = (): PostWithCommentCount[] => {
  return mockPosts.slice(0, 10).map((post, index) => {
    const user = mockUsers.find(u => u.id === post.userid)!;
    const postComments = mockComments.filter(comment => comment.postid === post.id);
    
    return {
      id: post.id,
      userid: post.userid,
      content: post.content,
      userName: user.name,
      userAvatar: generateAvatar(user.name),
      createdAt: 'Today at 10:30 AM', // Mock date
      commentCount: postComments.length,
      trend: Math.floor(Math.random() * 25) + 5, // Random trend
      rank: index + 1
    };
  }).sort((a, b) => b.commentCount - a.commentCount); // Sort by comment count
};

// Generate latest posts with comment counts
export const getLatestPosts = (): PostWithCommentCount[] => {
  return mockPosts.slice(0, 15).map((post, index) => {
    const user = mockUsers.find(u => u.id === post.userid)!;
    const postComments = mockComments.filter(comment => comment.postid === post.id);
    
    return {
      id: post.id,
      userid: post.userid,
      content: post.content,
      userName: user.name,
      userAvatar: generateAvatar(user.name),
      createdAt: `${index < 3 ? 'Today' : 'Yesterday'} at ${10 + index % 12}:${index * 5 % 60 < 10 ? '0' + (index * 5 % 60) : index * 5 % 60} ${index % 2 === 0 ? 'AM' : 'PM'}`, // Varied times
      commentCount: postComments.length,
      trend: Math.floor(Math.random() * 25) + 5 // Random trend
      // Latest posts don't have ranks
    };
  }).reverse(); // Newest first
};

// Generate analytics stats
export const getStats = (): AnalyticsStat => {
  return {
    totalUsers: mockUsers.length,
    totalPosts: mockPosts.length,
    totalComments: mockComments.length,
    avgPostsPerUser: mockPosts.length / mockUsers.length
  };
};

// Get all mock users
export const getAllUsers = (): SocialUser[] => {
  return mockUsers;
};

// Get all mock posts
export const getAllPosts = (): SocialPost[] => {
  return mockPosts;
};

// Get all mock comments
export const getAllComments = (): SocialComment[] => {
  return mockComments;
};