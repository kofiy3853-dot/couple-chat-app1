import { ChatContainer } from "@/components/chat/chat-container";

export default async function ChatPage() {
  return (
    <div className="h-[calc(100vh-theme(spacing.32))] lg:h-[calc(100vh-theme(spacing.16))] -m-4 sm:-m-6 lg:-m-8">
      <ChatContainer />
    </div>
  );
}