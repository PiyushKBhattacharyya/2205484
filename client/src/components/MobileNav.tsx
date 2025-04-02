import { useLocation, Link } from "wouter";

export default function MobileNav() {
  const [location] = useLocation();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
      <nav className="flex justify-around">
        <Link href="/top-users">
          <a className={`flex flex-col items-center py-3 ${
            location === "/" || location === "/top-users" 
              ? "text-primary" 
              : "text-gray-500"
          }`}>
            <i className="fas fa-users"></i>
            <span className="text-xs mt-1">Users</span>
          </a>
        </Link>
        <Link href="/trending-posts">
          <a className={`flex flex-col items-center py-3 ${
            location === "/trending-posts" 
              ? "text-primary" 
              : "text-gray-500"
          }`}>
            <i className="fas fa-fire"></i>
            <span className="text-xs mt-1">Trending</span>
          </a>
        </Link>
        <Link href="/feed">
          <a className={`flex flex-col items-center py-3 ${
            location === "/feed" 
              ? "text-primary" 
              : "text-gray-500"
          }`}>
            <i className="fas fa-stream"></i>
            <span className="text-xs mt-1">Feed</span>
          </a>
        </Link>
        <Link href="/analytics">
          <a className={`flex flex-col items-center py-3 ${
            location === "/analytics" 
              ? "text-primary" 
              : "text-gray-500"
          }`}>
            <i className="fas fa-chart-bar"></i>
            <span className="text-xs mt-1">Analytics</span>
          </a>
        </Link>
      </nav>
    </div>
  );
}
