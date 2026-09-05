import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TimelinePage } from "@/components/timeline/timeline-page";

export default async function TimelineRoute() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return <TimelinePage currentUserId={session.user.id} />;
}
