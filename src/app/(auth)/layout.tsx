import type { Metadata } from "next";
import { Heart } from "lucide-react";

export const metadata: Metadata = {
  title: "Couple - Authentication",
  description: "Sign in or create an account to start chatting",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-rose-50 via-pink-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/30 mb-4">
            <Heart className="h-8 w-8 text-rose-500" fill="currentColor" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Couple
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Share moments with your loved one
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-800">
          {children}
        </div>
      </div>
    </div>
  );
}
