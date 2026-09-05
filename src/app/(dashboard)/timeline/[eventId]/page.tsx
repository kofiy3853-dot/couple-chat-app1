import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { TimelineEventDetailView } from "@/components/timeline/timeline-event-detail-view";

interface PageProps {
  params: Promise<{ eventId: string }>;
}

export default async function TimelineEventPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { eventId } = await params;

  const event = await db.timelineEvent.findUnique({
    where: { id: eventId },
    include: {
      creator: {
        select: { id: true, name: true, username: true, image: true },
      },
    },
  });

  if (!event) notFound();

  return (
    <TimelineEventDetailView
      event={{
        ...event,
        date: event.date.toISOString(),
        createdAt: event.createdAt.toISOString(),
      }}
      currentUserId={session.user.id}
    />
  );
}
