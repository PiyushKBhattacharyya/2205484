import { Switch, Route } from "wouter";
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import TopUsers from "@/pages/TopUsers";
import TrendingPosts from "@/pages/TrendingPosts";
import Feed from "@/pages/Feed";
import UserDetail from "@/pages/UserDetail";
import Analytics from "@/pages/Analytics";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import { useToast } from "@/hooks/use-toast";
import { authenticateWithTestServer, checkAuthStatus, AuthData } from "./lib/api";

// Define credential type
type Credentials = {
  email: string;
  name: string;
  rollNo: string;
  accessCode: string;
  clientID: string;
  clientSecret: string;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Check authentication status on load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const data = await checkAuthStatus();
        setIsAuthenticated(data.authenticated);
        
        if (!data.authenticated) {
          // If not authenticated, try to authenticate with stored/default credentials
          await authenticate();
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        // Try to authenticate anyway
        await authenticate();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Authenticate using personal information and credentials from the server
  const authenticate = async () => {
    try {
      // Using the exact registration credentials provided
      const credentials: AuthData = {
        email: "piyushbhattacharyya@gmail.com",
        name: "piyush kaushik bhattacharyya",
        rollNo: "2205484",
        // Server will use these environment variables
        accessCode: "",
        clientID: "",
        clientSecret: ""
      };

      const data = await authenticateWithTestServer(credentials);
      
      if (data.success) {
        setIsAuthenticated(true);
        toast({
          title: "Authentication successful",
          description: "Connected to social media API",
        });
      } else {
        console.error("Auth failed with response:", data);
        toast({
          title: "Authentication failed",
          description: data.message || data.error || "Could not connect to API",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Authentication failed:", error);
      toast({
        title: "Authentication failed",
        description: "Network error connecting to API server",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 text-gray-800">
      {/* Sidebar for desktop */}
      <Sidebar />
      
      {/* Mobile bottom navigation */}
      <MobileNav />
      
      {/* Main content area */}
      <main className="flex-1 p-4 md:p-8 mb-16 md:mb-0 overflow-auto">
        <Switch>
          <Route path="/" component={TopUsers} />
          <Route path="/top-users" component={TopUsers} />
          <Route path="/trending-posts" component={TrendingPosts} />
          <Route path="/feed" component={Feed} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/user/:userId" component={UserDetail} />
          <Route component={NotFound} />
        </Switch>
      </main>
      
      <Toaster />
    </div>
  );
}

export default App;
