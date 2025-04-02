import { type UserWithPostCount } from "@shared/schema";
import { Link } from "wouter";

interface UserCardProps {
  user: UserWithPostCount;
}

export function UserCard({ user }: UserCardProps) {
  return (
    <div className="border-b border-gray-100 last:border-0">
      <div className="p-4 flex items-center">
        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold mr-4">
          {user.avatar}
        </div>
        <div className="flex-1">
          <h3 className="font-medium">{user.name}</h3>
          <p className="text-gray-500 text-sm">Joined {user.joinDate}</p>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-primary">{user.postCount}</div>
          <p className="text-gray-500 text-xs">posts</p>
        </div>
      </div>
      <div className="px-4 pb-4 flex justify-between items-center">
        <div className="flex gap-4 text-sm">
          <span className="flex items-center gap-1">
            <i className="fas fa-comment text-gray-400"></i>
            <span>{user.commentCount || 0} comments</span>
          </span>
          <span className="flex items-center gap-1">
            <i className="fas fa-chart-line text-gray-400"></i>
            <span>+{user.trend || 0}% this week</span>
          </span>
        </div>
        <Link href={`/user/${user.id}`}>
          <a className="text-primary text-sm font-medium hover:underline">
            View Details
          </a>
        </Link>
      </div>
    </div>
  );
}
