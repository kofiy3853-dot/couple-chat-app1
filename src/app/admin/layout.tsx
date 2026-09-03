import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if ((session.user as Record<string, unknown>)?.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar
        user={{
          id: session.user.id,
          name: session.user.name ?? null,
          email: session.user.email ?? "",
          image: session.user.image ?? null,
        }}
      />

      <div className="lg:pl-[280px] flex flex-col min-h-screen">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-white px-6">
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              Admin Dashboard
            </span>
            <div className="h-8 w-8 rounded-full bg-rose-100 flex items-center justify-center">
              <span className="text-sm font-medium text-rose-600">
                {session.user.name?.[0]?.toUpperCase() ?? "A"}
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