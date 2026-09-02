import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import { ChatContainer } from "@/components/chat/chat-container";

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "";

export default async function ChatPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const wsToken = jwt.sign(
    {
      sub: session.user.id,
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  return (
    <div className="h-[calc(100vh-theme(spacing.32))] lg:h-[calc(100vh-theme(spacing.16))] -m-4 sm:-m-6 lg:-m-8">
      <ChatContainer
        currentUserId={session.user.id ?? ""}
        token={wsToken}
      />
    </div>
  );
}
