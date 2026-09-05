import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { MemoryDetailView } from "@/components/memories/memory-detail-view";

interface PageProps {
  params: Promise<{ memoryId: string }>;
}

export default async function MemoryPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { memoryId } = await params;

  const memory = await db.memory.findUnique({
    where: { id: memoryId },
    include: {
      creator: {
        select: { id: true, name: true, username: true, image: true },
      },
    },
  });

  if (!memory) notFound();

  return (
    <MemoryDetailView
      memory={{
        ...memory,
        date: memory.date.toISOString(),
        createdAt: memory.createdAt.toISOString(),
      }}
      currentUserId={session.user.id}
    />
  );
}
