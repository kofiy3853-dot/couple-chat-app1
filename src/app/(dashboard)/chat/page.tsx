import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ChatPageClient } from "@/components/chat/chat-page-client";

export default async function ChatPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const currentUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  });

  if (!currentUser) {
    redirect("/login");
  }

  const coupleMember = await db.coupleMember.findFirst({
    where: { userId: currentUser.id },
    include: {
      couple: {
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
          },
          conversation: {
            select: { id: true },
          },
        },
      },
    },
  });

  const conversationId = coupleMember?.couple?.conversation?.id ?? null;

  let partnerName: string | null = null;
  let partnerImage: string | null = null;
  let partnerUserId: string | null = null;

  if (coupleMember?.couple?.members) {
    const partner = coupleMember.couple.members.find(
      (m) => m.userId !== currentUser.id
    );
    if (partner) {
      partnerName = partner.user.name;
      partnerImage = partner.user.image;
      partnerUserId = partner.user.id;
    }
  }

  return (
    <ChatPageClient
      userId={currentUser.id}
      conversationId={conversationId}
      partnerName={partnerName}
      partnerImage={partnerImage}
      partnerUserId={partnerUserId}
    />
  );
}
