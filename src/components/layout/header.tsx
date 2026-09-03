"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { logoutAction } from "@/app/actions/logout";
import { Bell, Settings, LogOut, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface HeaderUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface HeaderProps {
  user: HeaderUser;
}

const routeTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/chat": "Chat",
  "/memories": "Memories",
  "/timeline": "Timeline",
  "/notifications": "Notifications",
  "/settings": "Settings",
  "/settings/profile": "Profile",
};

export function Header({ user }: HeaderProps) {
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);
  const getTitle = () => {
    if (routeTitles[pathname]) return routeTitles[pathname];
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length > 0) {
      const base = "/" + segments[0];
      return routeTitles[base] || segments[0].charAt(0).toUpperCase() + segments[0].slice(1);
    }
    return "Dashboard";
  };

  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <header className="sticky top-0 z-40 flex items-center gap-4 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm px-4 sm:px-6 lg:px-8 py-4">
      <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 lg:hidden">
        {getTitle()}
      </h1>
      <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 hidden lg:block">
        {getTitle()}
      </h1>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild className="relative">
          <Link href="/notifications">
            <Bell className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500" />
          </Link>
        </Button>

        <Button variant="ghost" size="icon" asChild className="hidden sm:inline-flex">
          <Link href="/settings">
            <Settings className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.image || undefined} alt={user.name || ""} />
                <AvatarFallback className="bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 text-xs font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-50">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {user.name || "User"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user.email}
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings/profile" className="cursor-pointer">
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                if (loggingOut) return;
                setLoggingOut(true);
                await logoutAction();
              }}
              disabled={loggingOut}
              className="cursor-pointer text-red-600 focus:text-red-600"
            >
              {loggingOut ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4 mr-2" />
              )}
              {loggingOut ? "Logging out..." : "Log out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}