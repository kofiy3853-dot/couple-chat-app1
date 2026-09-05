import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
async function main() {
  console.log('Cleaning Render database...');
  await db.messageReaction.deleteMany();
  await db.attachment.deleteMany();
  await db.message.deleteMany();
  await db.conversationParticipant.deleteMany();
  await db.conversation.deleteMany();
  await db.coupleInvitation.deleteMany();
  await db.coupleMember.deleteMany();
  await db.couple.deleteMany();
  await db.memory.deleteMany();
  await db.timelineEvent.deleteMany();
  await db.notification.deleteMany();
  await db.report.deleteMany();
  await db.userPrivacySetting.deleteMany();
  await db.user.deleteMany();
  console.log('Done. All data deleted.');
}
main().then(() => db.$disconnect());
