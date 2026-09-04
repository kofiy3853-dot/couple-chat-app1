import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Deleting all data...");

  await prisma.messageReaction.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();

  await prisma.memory.deleteMany();
  await prisma.timelineEvent.deleteMany();
  await prisma.coupleInvitation.deleteMany();
  await prisma.coupleMember.deleteMany();
  await prisma.couple.deleteMany();

  await prisma.notification.deleteMany();
  await prisma.report.deleteMany();
  await prisma.userPrivacySetting.deleteMany();

  await prisma.user.deleteMany();

  console.log("All data deleted.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });