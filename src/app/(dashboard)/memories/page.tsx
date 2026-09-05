import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MemoriesPage } from "@/components/memories/memories-page";

export default async function MemoriesRoute() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return <MemoriesPage currentUserId={session.user.id} />;
}
