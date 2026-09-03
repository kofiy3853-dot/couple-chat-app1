import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800">
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
