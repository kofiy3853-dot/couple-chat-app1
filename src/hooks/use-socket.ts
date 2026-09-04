"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import WebSocketClient from "@/server/websocket/client";
import type { PresenceStatus } from "@/lib/constants";

interface UseSocketOptions {
  conversationId: string | null;
  userId: string;
  onNewMessage?: (message: unknown) => void;
  onMessageDeleted?: (messageId: string) => void;
  onMessageEdited?: (data: { messageId: string; content: string; editedBy: string }) => void;
  onReactionAdded?: (data: { messageId: string; userId: string; userName?: string; emoji: string }) => void;
  onReactionRemoved?: (data: { messageId: string; userId: string; emoji: string }) => void;
  onGameChallengeReceived?: (data: { fromUserId: string; fromUserName: string; type: "truth" | "dare" }) => void;
  onGameChoiceMade?: (data: { fromUserId: string; fromUserName: string; type: "truth" | "dare" }) => void;
  onGameQuestionReceived?: (data: { fromUserId: string; fromUserName: string; question: string; type: "truth" | "dare" }) => void;
  onGameAnswerResult?: (data: { fromUserId: string; fromUserName: string; completed: boolean }) => void;
  onGameEnded?: (data: { fromUserId: string }) => void;
}

export function useSocket({ conversationId, userId, onNewMessage, onMessageDeleted, onMessageEdited, onReactionAdded, onReactionRemoved, onGameChallengeReceived, onGameChoiceMade, onGameQuestionReceived, onGameAnswerResult, onGameEnded }: UseSocketOptions) {
  const [connected, setConnected] = useState(false);
  const [typingState, setTypingState] = useState<Record<string, boolean>>({});
  const [presenceState, setPresenceState] = useState<Record<string, PresenceStatus>>({});
  const typingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const clientRef = useRef<WebSocketClient | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  const onNewMessageRef = useRef(onNewMessage);
  const onMessageDeletedRef = useRef(onMessageDeleted);
  const onMessageEditedRef = useRef(onMessageEdited);
  const onReactionAddedRef = useRef(onReactionAdded);
  const onReactionRemovedRef = useRef(onReactionRemoved);
  const onGameChallengeReceivedRef = useRef(onGameChallengeReceived);
  const onGameChoiceMadeRef = useRef(onGameChoiceMade);
  const onGameQuestionReceivedRef = useRef(onGameQuestionReceived);
  const onGameAnswerResultRef = useRef(onGameAnswerResult);
  const onGameEndedRef = useRef(onGameEnded);

  useEffect(() => { onNewMessageRef.current = onNewMessage; }, [onNewMessage]);
  useEffect(() => { onMessageDeletedRef.current = onMessageDeleted; }, [onMessageDeleted]);
  useEffect(() => { onMessageEditedRef.current = onMessageEdited; }, [onMessageEdited]);
  useEffect(() => { onReactionAddedRef.current = onReactionAdded; }, [onReactionAdded]);
  useEffect(() => { onReactionRemovedRef.current = onReactionRemoved; }, [onReactionRemoved]);
  useEffect(() => { onGameChallengeReceivedRef.current = onGameChallengeReceived; }, [onGameChallengeReceived]);
  useEffect(() => { onGameChoiceMadeRef.current = onGameChoiceMade; }, [onGameChoiceMade]);
  useEffect(() => { onGameQuestionReceivedRef.current = onGameQuestionReceived; }, [onGameQuestionReceived]);
  useEffect(() => { onGameAnswerResultRef.current = onGameAnswerResult; }, [onGameAnswerResult]);
  useEffect(() => { onGameEndedRef.current = onGameEnded; }, [onGameEnded]);

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  useEffect(() => {
    if (!userId) return;

    const client = WebSocketClient.getInstance({ userId });
    clientRef.current = client;

    const unsubConnected = client.on("connected", () => {
      setConnected(true);
      if (conversationIdRef.current) {
        client.joinConversation(conversationIdRef.current);
      }
    });

    const unsubDisconnected = client.on("disconnected", () => setConnected(false));

    const unsubOnline = client.on("user-online", (data: { userId: string }) => {
      setPresenceState((prev) => ({ ...prev, [data.userId]: prev[data.userId] === "offline" ? "online" : (prev[data.userId] ?? "online") }));
    });

    const unsubOffline = client.on("user-offline", (data: { userId: string }) => {
      setPresenceState((prev) => ({ ...prev, [data.userId]: "offline" }));
      setTypingState((prev) => ({ ...prev, [data.userId]: false }));
    });

    const unsubPresenceSnapshot = client.on("presence-snapshot", (data: Record<string, PresenceStatus>) => {
      setPresenceState(data);
    });

    const unsubRecordingStart = client.on("recording-start", (data: { userId: string }) => {
      if (data.userId === userId) return;
      setPresenceState((prev) => ({ ...prev, [data.userId]: "recording" }));
    });

    const unsubRecordingStop = client.on("recording-stop", (data: { userId: string }) => {
      if (data.userId === userId) return;
      setPresenceState((prev) => ({ ...prev, [data.userId]: "online" }));
    });

    const unsubCallStart = client.on("call-start", (data: { userId: string }) => {
      if (data.userId === userId) return;
      setPresenceState((prev) => ({ ...prev, [data.userId]: "in-call" }));
    });

    const unsubCallEnd = client.on("call-end", (data: { userId: string }) => {
      if (data.userId === userId) return;
      setPresenceState((prev) => ({ ...prev, [data.userId]: "online" }));
    });

    const unsubTypingStart = client.on("typing-start", (data: { userId: string }) => {
      if (data.userId === userId) return;
      setTypingState((prev) => ({ ...prev, [data.userId]: true }));
      if (typingTimers.current[data.userId]) clearTimeout(typingTimers.current[data.userId]);
      typingTimers.current[data.userId] = setTimeout(() => {
        setTypingState((prev) => ({ ...prev, [data.userId]: false }));
      }, 3000);
    });

    const unsubTypingStop = client.on("typing-stop", (data: { userId: string }) => {
      if (data.userId === userId) return;
      if (typingTimers.current[data.userId]) clearTimeout(typingTimers.current[data.userId]);
      setTypingState((prev) => ({ ...prev, [data.userId]: false }));
    });

    const unsubNewMessage = client.on("new-message", (message: unknown) => {
      onNewMessageRef.current?.(message);
    });

    const unsubMessageDeleted = client.on("message-deleted", (data: { messageId: string }) => {
      onMessageDeletedRef.current?.(data.messageId);
    });

    const unsubMessageEdited = client.on("message-edited", (data: { messageId: string; content: string; editedBy: string }) => {
      onMessageEditedRef.current?.(data);
    });

    const unsubReactionAdded = client.on("reaction-added", (data: { messageId: string; userId: string; userName?: string; emoji: string }) => {
      onReactionAddedRef.current?.(data);
    });

    const unsubReactionRemoved = client.on("reaction-removed", (data: { messageId: string; userId: string; emoji: string }) => {
      onReactionRemovedRef.current?.(data);
    });

    const unsubGameChallenge = client.on("game-challenge-received", (data: { fromUserId: string; fromUserName: string; type: "truth" | "dare" }) => {
      onGameChallengeReceivedRef.current?.(data);
    });

    const unsubGameChoice = client.on("game-choice-made", (data: { fromUserId: string; fromUserName: string; type: "truth" | "dare" }) => {
      onGameChoiceMadeRef.current?.(data);
    });

    const unsubGameQuestion = client.on("game-question-received", (data: { fromUserId: string; fromUserName: string; question: string; type: "truth" | "dare" }) => {
      onGameQuestionReceivedRef.current?.(data);
    });

    const unsubGameAnswer = client.on("game-answer-result", (data: { fromUserId: string; fromUserName: string; completed: boolean }) => {
      onGameAnswerResultRef.current?.(data);
    });

    const unsubGameEnded = client.on("game-ended", (data: { fromUserId: string }) => {
      onGameEndedRef.current?.(data);
    });

    client.connect();

    return () => {
      unsubConnected();
      unsubDisconnected();
      unsubOnline();
      unsubOffline();
      unsubPresenceSnapshot();
      unsubRecordingStart();
      unsubRecordingStop();
      unsubCallStart();
      unsubCallEnd();
      unsubTypingStart();
      unsubTypingStop();
      unsubNewMessage();
      unsubMessageDeleted();
      unsubMessageEdited();
      unsubReactionAdded();
      unsubReactionRemoved();
      unsubGameChallenge();
      unsubGameChoice();
      unsubGameQuestion();
      unsubGameAnswer();
      unsubGameEnded();
      Object.values(typingTimers.current).forEach(clearTimeout);

      if (conversationIdRef.current) {
        client.leaveConversation(conversationIdRef.current);
      }
      setConnected(false);
    };
  }, [userId]);

  useEffect(() => {
    const client = clientRef.current;
    if (!client || !conversationId || !connected) return;
    client.joinConversation(conversationId);
    return () => {
      client.leaveConversation(conversationId);
    };
  }, [conversationId, connected]);

  const sendMessage = useCallback(
    (conversationId: string, content: string, type: "TEXT" | "IMAGE" | "AUDIO" = "TEXT", replyToId?: string) => {
      clientRef.current?.sendMessage({ conversationId, content, type, replyToId });
    },
    []
  );

  const broadcastMessage = useCallback(
    (message: { id: string; conversationId: string; senderId: string; content: string; type: string; deletedAt: unknown; createdAt: string; updatedAt: string; isEdited: boolean; replyToId: string | null; replyTo: unknown; sender: unknown; reactions: unknown[]; attachments: unknown[] }) => {
      clientRef.current?.getSocket()?.emit("broadcast-new-message", { message });
    },
    []
  );

  const broadcastMessageDeleted = useCallback(
    (messageId: string, conversationId: string) => {
      clientRef.current?.getSocket()?.emit("message-deleted", { messageId, conversationId });
    },
    []
  );

  const broadcastMessageEdited = useCallback(
    (messageId: string, conversationId: string, content: string) => {
      clientRef.current?.getSocket()?.emit("message-edited", { messageId, conversationId, content });
    },
    []
  );

  const broadcastReactionToggled = useCallback(
    (messageId: string, conversationId: string, emoji: string, removed: boolean) => {
      const event = removed ? "reaction-removed" : "reaction-added";
      clientRef.current?.getSocket()?.emit(event, { messageId, conversationId, emoji });
    },
    []
  );

  const startTyping = useCallback(
    (conversationId: string) => {
      clientRef.current?.startTyping(conversationId);
    },
    []
  );

  const stopTyping = useCallback(
    (conversationId: string) => {
      clientRef.current?.stopTyping(conversationId);
    },
    []
  );

  const addReaction = useCallback(
    (messageId: string, conversationId: string, emoji: string) => {
      clientRef.current?.addReaction(messageId, conversationId, emoji);
    },
    []
  );

  const removeReaction = useCallback(
    (messageId: string, conversationId: string, emoji: string) => {
      clientRef.current?.removeReaction(messageId, conversationId, emoji);
    },
    []
  );

  const deleteMessage = useCallback(
    (messageId: string, conversationId: string) => {
      clientRef.current?.deleteMessage(messageId, conversationId);
    },
    []
  );

  const markAsRead = useCallback(
    (conversationId: string, lastReadMessageId: string) => {
      clientRef.current?.markAsRead(conversationId, lastReadMessageId);
    },
    []
  );

  const startRecording = useCallback(
    (conversationId: string) => {
      clientRef.current?.startRecording(conversationId);
    },
    []
  );

  const stopRecording = useCallback(
    (conversationId: string) => {
      clientRef.current?.stopRecording(conversationId);
    },
    []
  );

  const startCall = useCallback(
    (conversationId: string) => {
      clientRef.current?.startCall(conversationId);
    },
    []
  );

  const endCall = useCallback(
    (conversationId: string) => {
      clientRef.current?.endCall(conversationId);
    },
    []
  );

  const editMessage = useCallback(
    (messageId: string, conversationId: string, content: string) => {
      clientRef.current?.editMessage(messageId, conversationId, content);
    },
    []
  );

  // ─── Game methods ──────────────────────────────────────────────────────
  const startGame = useCallback(
    (conversationId: string, type: "truth" | "dare") => {
      clientRef.current?.startGame(conversationId, type);
    },
    []
  );

  const makeChoice = useCallback(
    (conversationId: string, type: "truth" | "dare") => {
      clientRef.current?.makeChoice(conversationId, type);
    },
    []
  );

  const sendQuestion = useCallback(
    (conversationId: string, question: string, type: "truth" | "dare") => {
      clientRef.current?.sendQuestion(conversationId, question, type);
    },
    []
  );

  const sendAnswer = useCallback(
    (conversationId: string, completed: boolean) => {
      clientRef.current?.sendAnswer(conversationId, completed);
    },
    []
  );

  const endGame = useCallback(
    (conversationId: string) => {
      clientRef.current?.endGame(conversationId);
    },
    []
  );

  return {
    connected,
    typingState,
    presenceState,
    sendMessage,
    broadcastMessage,
    broadcastMessageDeleted,
    broadcastMessageEdited,
    broadcastReactionToggled,
    startTyping,
    stopTyping,
    startRecording,
    stopRecording,
    startCall,
    endCall,
    addReaction,
    removeReaction,
    deleteMessage,
    editMessage,
    markAsRead,
    startGame,
    makeChoice,
    sendQuestion,
    sendAnswer,
    endGame,
  };
}
