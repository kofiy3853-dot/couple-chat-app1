import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Demo mode - no auth, just show admin
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <AdminSidebar
        user={{
          id: "admin",
          name: "Admin",
          email: "admin@example.com",
          image: null,
        }}
      />

      <div className="lg:pl-[280px] flex flex-col min-h-screen">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-white dark:bg-gray-900 px-6">
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Admin Dashboard
            </span>
            <div className="h-8 w-8 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center">
              <span className="text-sm font-medium text-rose-600 dark:text-rose-400">
                A
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}