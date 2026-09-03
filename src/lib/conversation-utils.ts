import { db } from "@/lib/db";
import { ForbiddenError, NotFoundError } from "@/lib/errors";

/**
 * Checks whether a user is a member of a conversation.
 * Works for both couple conversations (via CoupleMember) and
 * group conversations (via ConversationParticipant).
 */
export async function assertConversationMember(
  conversationId: string,
  userId: string
): Promise<void> {
  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    include: {
      couple: { include: { members: { select: { userId: true } } } },
      participants: { select: { userId: true } },
    },
  });

  if (!conversation) throw new NotFoundError("Conversation not found");

  const isMember = conversation.isGroup
    ? conversation.participants.some((p) => p.userId === userId)
    : (conversation.couple?.members ?? []).some((m) => m.userId === userId);

  if (!isMember) throw new ForbiddenError("You are not a member of this conversation");
}

/**
 * Returns conversation membership info for a message (by messageId).
 * Throws if not found or not a member.
 */
export async function assertMessageAccess(
  messageId: string,
  userId: string
) {
  const message = await db.message.findUnique({
    where: { id: messageId },
    include: {
      conversation: {
        include: {
          couple: { include: { members: { select: { userId: true } } } },
          participants: { select: { userId: true } },
        },
      },
    },
  });

  if (!message) throw new NotFoundError("Message not found");

  const conv = message.conversation;
  const isMember = conv.isGroup
    ? conv.participants.some((p) => p.userId === userId)
    : (conv.couple?.members ?? []).some((m) => m.userId === userId);

  if (!isMember) throw new ForbiddenError("You are not a member of this conversation");

  return message;
}
