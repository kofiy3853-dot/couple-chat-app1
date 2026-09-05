import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { NoCoupleView } from "@/components/dashboard/no-couple-view";
import { getDashboardData } from "@/lib/dashboard-data";

export default async function DashboardIndexPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const currentUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, image: true },
  });

  if (!currentUser) {
    return <NoCoupleView userName="there" />;
  }

  const data = await getDashboardData(currentUser.id);

  if (!data) {
    return <NoCoupleView userName={currentUser.name?.split(" ")[0] || "there"} />;
  }

  return (
    <DashboardContent
      userName={currentUser.name?.split(" ")[0] || "there"}
      userImage={currentUser.image}
      partner={{ name: data.partner.name, image: data.partner.image }}
      daysTogether={data.daysTogether}
      messageCount={data.messageCount}
      memoryCount={data.memoryCount}
      conversationId={data.conversationId}
      recentMessages={data.recentMessages}
      recentMemories={data.recentMemories}
      recentTimelineEvents={data.recentTimelineEvents}
      unreadNotifications={data.unreadNotifications}
      anniversaryDate={data.anniversaryDate}
    />
  );
}
