"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Camera,
  Calendar,
  User,
  Link2,
  Gamepad2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Games", href: "/games", icon: Gamepad2, coupleRequired: true },
  { name: "Memories", href: "/memories", icon: Camera, coupleRequired: true },
  { name: "Timeline", href: "/timeline", icon: Calendar, coupleRequired: true },
  { name: "Profile", href: "/settings/profile", icon: User },
];

export function MobileNav({ hasCouple }: { hasCouple: boolean }) {
  const pathname = usePathname();

  const items = navigation.filter((item) => !item.coupleRequired || hasCouple);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {items.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors min-w-15",
                isActive
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5",
                  isActive
                    ? "text-rose-500 dark:text-rose-400"
                    : "text-gray-400 dark:text-gray-500"
                )}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
        {!hasCouple && (
          <Link
            href="/couple"
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors min-w-15",
              pathname === "/couple"
                ? "text-rose-600 dark:text-rose-400"
                : "text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
            )}
          >
            <Link2 className="h-5 w-5" />
            <span>Connect</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
