-- DropIndex
DROP INDEX "Message_createdAt_idx";

-- AlterTable
ALTER TABLE "Conversation" ALTER COLUMN "coupleId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "UserPrivacySetting" ADD COLUMN     "timelineNotifications" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "Attachment_messageId_idx" ON "Attachment"("messageId");

-- CreateIndex
CREATE INDEX "CoupleInvitation_coupleId_usedById_idx" ON "CoupleInvitation"("coupleId", "usedById");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "MessageReaction_messageId_idx" ON "MessageReaction"("messageId");
