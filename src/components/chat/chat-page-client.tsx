"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useSocket } from "@/hooks/use-socket";
import { useChat, type Message } from "@/hooks/use-chat";
import { useIncomingCall } from "@/hooks/use-incoming-call";
import { useToast } from "@/hooks/use-toast";
import { rtcConfig, videoConstraints } from "@/lib/webrtc";
import { ChatHeader } from "./chat-header";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { ConnectionBanner } from "./connection-banner";
import { EmptyChat } from "./empty-chat";
import { VideoCallModal } from "./video-call-modal";
import { IncomingCallDialog } from "./incoming-call-dialog";
import type { CallState } from "@/types/video-call";

interface ChatPageClientProps {
  userId: string;
  userName?: string;
  userImage?: string | null;
  conversationId: string | null;
  partnerName: string | null;
  partnerImage: string | null;
  partnerUserId: string | null;
}

export function ChatPageClient({
  userId,
  userName,
  userImage,
  conversationId,
  partnerName,
  partnerImage,
  partnerUserId,
}: ChatPageClientProps) {
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [wsSending, setWsSending] = useState(false);
  const { toast } = useToast();

  // ─── Video call state ────────────────────────────────────────────────────
  const [callState, setCallState] = useState<CallState>({
    status: "idle",
    conversationId: null,
    partnerUserId: null,
    partnerName: null,
    partnerImage: null,
    startedAt: null,
  });
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [callDuration, setCallDuration] = useState(0);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callStartTimeRef = useRef<number | null>(null);
  const iceCandidateBufferRef = useRef<RTCIceCandidateInit[]>([]);

  // Refs for stable callback access
  const onCallEndedRef = useRef<(() => void) | null>(null);
  const sendCallOfferRef = useRef<(conversationId: string, offer: RTCSessionDescriptionInit, callerName: string, callerImage: string | null) => void>(() => {});
  const sendCallAnswerRef = useRef<(conversationId: string, answer: RTCSessionDescriptionInit) => void>(() => {});
  const sendIceCandidateRef = useRef<(conversationId: string, candidate: RTCIceCandidateInit) => void>(() => {});
  const rejectCallRef = useRef<(conversationId: string) => void>(() => {});

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach((t) => t.stop());
      if (peerConnectionRef.current) peerConnectionRef.current.close();
    };
  }, []);

  const cleanupCall = useCallback(() => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    setCallDuration(0);
    iceCandidateBufferRef.current = [];
    callStartTimeRef.current = null;
  }, []);

  const startCallTimer = useCallback(() => {
    callStartTimeRef.current = Date.now();
    callTimerRef.current = setInterval(() => {
      if (callStartTimeRef.current) {
        setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
      }
    }, 1000);
  }, []);

  const stopCallTimer = useCallback(() => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
  }, []);

  const endVideoCall = useCallback(() => {
    stopCallTimer();
    cleanupCall();
    setCallState({
      status: "idle",
      conversationId: null,
      partnerUserId: null,
      partnerName: null,
      partnerImage: null,
      startedAt: null,
    });
    onCallEndedRef.current?.();
  }, [stopCallTimer, cleanupCall]);

  const endVideoCallRef = useRef(endVideoCall);
  useEffect(() => { endVideoCallRef.current = endVideoCall; }, [endVideoCall]);

  const createPeerConnection = useCallback(
    (targetConversationId: string, onIceCandidate: (candidate: RTCIceCandidateInit) => void) => {
      const pc = new RTCPeerConnection(rtcConfig);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          onIceCandidate(event.candidate.toJSON());
        }
      };

      pc.ontrack = (event) => {
        const stream = event.streams[0];
        if (stream) {
          setRemoteStream(stream);
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed" || pc.connectionState === "disconnected" || pc.connectionState === "closed") {
          endVideoCallRef.current();
        }
      };

      peerConnectionRef.current = pc;
      return pc;
    },
    []
  );

  const getLocalMedia = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia(videoConstraints);
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, []);

  const initiateVideoCall = useCallback(
    async (targetConversationId: string, partnerUserId: string, partnerName: string, partnerImage: string | null) => {
      try {
        setCallState({
          status: "outgoing",
          conversationId: targetConversationId,
          partnerUserId,
          partnerName,
          partnerImage,
          startedAt: null,
        });

        const stream = await getLocalMedia();
        const pc = createPeerConnection(targetConversationId, (candidate) => {
          sendIceCandidateRef.current(targetConversationId, candidate);
        });

        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        sendCallOfferRef.current(targetConversationId, offer, userName || "You", userImage ?? null);
      } catch (err) {
        console.error("[VideoCall] Failed to initiate call:", err);
        cleanupCall();
        setCallState((prev) => ({ ...prev, status: "idle" }));
      }
    },
    [getLocalMedia, createPeerConnection, userName, userImage, cleanupCall]
  );

  const acceptVideoCall = useCallback(
    async (
      targetConversationId: string,
      offer: RTCSessionDescriptionInit,
      callerId: string,
      callerName: string,
      callerImage: string | null
    ) => {
      try {
        setCallState({
          status: "connecting",
          conversationId: targetConversationId,
          partnerUserId: callerId,
          partnerName: callerName,
          partnerImage: callerImage,
          startedAt: null,
        });

        const stream = await getLocalMedia();
        const pc = createPeerConnection(targetConversationId, (candidate) => {
          sendIceCandidateRef.current(targetConversationId, candidate);
        });

        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        for (const candidate of iceCandidateBufferRef.current) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        iceCandidateBufferRef.current = [];

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        sendCallAnswerRef.current(targetConversationId, answer);
      } catch (err) {
        console.error("[VideoCall] Failed to accept call:", err);
        cleanupCall();
        setCallState((prev) => ({ ...prev, status: "idle" }));
      }
    },
    [getLocalMedia, createPeerConnection, cleanupCall]
  );

  const handleCallAnswer = useCallback(
    async (answer: RTCSessionDescriptionInit) => {
      const pc = peerConnectionRef.current;
      if (!pc) return;

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        setCallState((prev) => ({ ...prev, status: "active", startedAt: Date.now() }));
        startCallTimer();
      } catch (err) {
        console.error("[VideoCall] Failed to handle answer:", err);
        endVideoCallRef.current();
      }
    },
    [startCallTimer]
  );

  const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    const pc = peerConnectionRef.current;
    if (pc && pc.remoteDescription) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("[VideoCall] Failed to add ICE candidate:", err);
      }
    } else {
      iceCandidateBufferRef.current.push(candidate);
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  }, []);

  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  }, []);

  // ─── Incoming call hook ──────────────────────────────────────────────────
  const incomingCall = useIncomingCall({
    onAccept: useCallback(
      (call) => {
        acceptVideoCall(call.conversationId, call.offer, call.callerId, call.callerName, call.callerImage);
      },
      [acceptVideoCall]
    ),
    onReject: useCallback(
      (cId) => {
        rejectCallRef.current(cId);
      },
      []
    ),
  });

  // ─── Chat messages ──────────────────────────────────────────────────────
  const {
    messages,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    deleteMessage,
    editMessage,
    addReaction,
    addRealtimeMessage,
    applyReactionAdded,
    applyReactionRemoved,
    applyMessagesRead,
  } = useChat({
    conversationId,
    userId,
  });

  const handleNewMessage = useCallback(
    (message: unknown) => {
      addRealtimeMessage(message as Message);
    },
    [addRealtimeMessage]
  );

  const handleReactionAdded = useCallback(
    (data: unknown) => {
      const d = data as { messageId: string; userId: string; emoji: string; userName?: string };
      if (d.userId === userId) return;
      applyReactionAdded(d);
    },
    [userId, applyReactionAdded]
  );

  const handleReactionRemoved = useCallback(
    (data: unknown) => {
      const d = data as { messageId: string; userId: string; emoji: string };
      if (d.userId === userId) return;
      applyReactionRemoved(d);
    },
    [userId, applyReactionRemoved]
  );

  const handleMessagesRead = useCallback(
    (data: { conversationId: string; readBy: string; lastReadMessageId: string }) => {
      applyMessagesRead(data);
    },
    [applyMessagesRead]
  );

  const {
    connected,
    reconnectFailed,
    typingState,
    presenceState,
    sendMessage: wsSendMessage,
    startTyping,
    stopTyping,
    broadcastMessageDeleted,
    broadcastMessageEdited,
    broadcastReactionToggled,
    markAsRead,
    markDelivered,
    startCall: startCallSocket,
    endCall: endCallSocket,
    sendCallOffer,
    sendCallAnswer,
    sendIceCandidate,
    rejectCall,
  } = useSocket({
    conversationId,
    userId,
    onNewMessage: handleNewMessage,
    onReactionAdded: handleReactionAdded,
    onReactionRemoved: handleReactionRemoved,
    onMessagesRead: handleMessagesRead,
    onCallOffer: useCallback((data: { conversationId: string; callerId: string; callerName: string; callerImage: string | null; offer: RTCSessionDescriptionInit }) => {
      incomingCall.handleIncomingOffer(data);
    }, [incomingCall.handleIncomingOffer]),
    onCallAnswer: useCallback((data: { conversationId: string; answer: RTCSessionDescriptionInit }) => {
      handleCallAnswer(data.answer);
    }, [handleCallAnswer]),
    onCallIceCandidate: useCallback((data: { conversationId: string; candidate: RTCIceCandidateInit }) => {
      handleIceCandidate(data.candidate);
    }, [handleIceCandidate]),
  });

  // Wire up onCallEnded for the endVideoCall
  useEffect(() => {
    onCallEndedRef.current = () => {
      if (conversationId) endCallSocket(conversationId);
    };
    sendCallOfferRef.current = sendCallOffer;
    sendCallAnswerRef.current = sendCallAnswer;
    sendIceCandidateRef.current = sendIceCandidate;
    rejectCallRef.current = rejectCall;
  }, [conversationId, endCallSocket, sendCallOffer, sendCallAnswer, sendIceCandidate, rejectCall]);

  // Mark messages as read when partner opens chat
  const lastReadRef = useRef<string | null>(null);
  useEffect(() => {
    if (!conversationId || !connected || loading || messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.senderId === userId) return;
    if (lastReadRef.current === lastMsg.id) return;
    lastReadRef.current = lastMsg.id;
    markAsRead(conversationId, lastMsg.id);
  }, [conversationId, connected, loading, messages, userId, markAsRead]);

  // Auto-deliver incoming messages
  useEffect(() => {
    if (!conversationId || !connected) return;
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.senderId === userId) return;
    if (lastMsg.deliveredAt) return;
    markDelivered(lastMsg.id, conversationId);
  }, [conversationId, connected, messages, userId, markDelivered]);

  const handleSend = async (content: string) => {
    if (!conversationId) return;
    setWsSending(true);
    try {
      wsSendMessage(conversationId, content, "TEXT", replyTo?.id);
      setReplyTo(null);
    } finally {
      setWsSending(false);
    }
  };

  const handleAttachment = async (file: File) => {
    if (!conversationId) return;
    setUploadError(null);
    setWsSending(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        const type = file.type.startsWith("audio/") ? "AUDIO" : "IMAGE";
        wsSendMessage(conversationId, data.data.url, type);
      } else {
        setUploadError(data.error?.message || "Upload failed");
        setTimeout(() => setUploadError(null), 3000);
      }
    } catch {
      setUploadError("Upload failed. Check your connection.");
      setTimeout(() => setUploadError(null), 3000);
    } finally {
      setWsSending(false);
    }
  };

  const handleVoiceRecording = async (blob: Blob, _mimeType: string) => {
    if (!conversationId) return;
    setUploadError(null);
    setWsSending(true);
    try {
      const ext = _mimeType.includes("mp4") ? "m4a" : _mimeType.includes("ogg") ? "ogg" : "webm";
      const file = new File([blob], `voice.${ext}`, { type: _mimeType });
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        wsSendMessage(conversationId, data.data.url, "AUDIO");
      } else {
        setUploadError(data.error?.message || "Voice upload failed");
        setTimeout(() => setUploadError(null), 3000);
      }
    } catch {
      setUploadError("Voice upload failed. Check your connection.");
      setTimeout(() => setUploadError(null), 3000);
    } finally {
      setWsSending(false);
    }
  };

  const handleReact = async (messageId: string, emoji: string) => {
    if (!conversationId) return;
    const result = await addReaction(messageId, emoji);
    if (result.success) {
      broadcastReactionToggled(messageId, conversationId, emoji, result.removed);
    }
  };

  const handleEdit = async (messageId: string, content: string) => {
    if (!conversationId) return;
    const success = await editMessage(messageId, content);
    if (success) {
      broadcastMessageEdited(messageId, conversationId, content);
    } else {
      toast({ title: "Edit failed", description: "Could not edit message." });
    }
    return success;
  };

  const handleDelete = async (messageId: string) => {
    if (!conversationId) return;
    const success = await deleteMessage(messageId);
    if (success) {
      broadcastMessageDeleted(messageId, conversationId);
    } else {
      toast({ title: "Delete failed", description: "Could not delete message." });
    }
    return success;
  };

  // ─── Call handlers ────────────────────────────────────────────────────────
  const handleStartCall = useCallback(async () => {
    if (!conversationId || !partnerUserId || !partnerName) return;

    const partnerPresenceState = presenceState[partnerUserId] ?? "offline";
    if (partnerPresenceState === "in-call") {
      toast({ title: "Partner busy", description: "Your partner is already in a call." });
      return;
    }
    if (partnerPresenceState === "offline") {
      toast({ title: "Partner offline", description: "Your partner is not online." });
      return;
    }

    startCallSocket(conversationId);
    await initiateVideoCall(conversationId, partnerUserId, partnerName, partnerImage);
  }, [conversationId, partnerUserId, partnerName, partnerImage, presenceState, startCallSocket, initiateVideoCall, toast]);

  const handleEndCall = useCallback(() => {
    if (callState.conversationId) {
      endCallSocket(callState.conversationId);
    }
    endVideoCall();
  }, [callState.conversationId, endCallSocket, endVideoCall]);

  if (!conversationId) {
    return <EmptyChat />;
  }

  const isPartnerTyping = partnerUserId ? (typingState[partnerUserId] ?? false) : false;
  const partnerPresence = partnerUserId ? (presenceState[partnerUserId] ?? "offline") : "offline";
  const isCallActive = callState.status !== "idle";

  return (
    <div className="flex flex-col h-dvh sm:h-full bg-white dark:bg-gray-950">
      <ChatHeader
        partnerName={partnerName}
        partnerImage={partnerImage}
        connected={connected}
        reconnectFailed={reconnectFailed}
        isPartnerTyping={isPartnerTyping}
        partnerPresence={partnerPresence}
        onCall={handleStartCall}
        callDisabled={!connected || isCallActive || partnerPresence === "offline" || partnerPresence === "in-call"}
      />

      <ConnectionBanner connected={connected} reconnectFailed={reconnectFailed} />

      <MessageList
        messages={messages}
        currentUserId={userId}
        loading={loading}
        loadingMore={loadingMore}
        hasMore={hasMore}
        onLoadMore={loadMore}
        onReply={setReplyTo}
        onReact={handleReact}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {uploadError && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
          <p className="text-xs text-red-600 dark:text-red-400">{uploadError}</p>
        </div>
      )}

      <MessageInput
        onSend={handleSend}
        onVoiceRecording={handleVoiceRecording}
        onAttachment={handleAttachment}
        onTypingStart={() => conversationId && startTyping(conversationId)}
        onTypingStop={() => conversationId && stopTyping(conversationId)}
        replyTo={replyTo ? { id: replyTo.id, content: replyTo.content, senderName: replyTo.sender.name || "Someone" } : null}
        onCancelReply={() => setReplyTo(null)}
        sending={wsSending}
      />

      {/* Video call modal */}
      {isCallActive && callState.conversationId && (
        <VideoCallModal
          status={callState.status}
          localStream={localStream}
          remoteStream={remoteStream}
          isVideoEnabled={isVideoEnabled}
          isAudioEnabled={isAudioEnabled}
          callDuration={callDuration}
          partnerName={callState.partnerName}
          partnerImage={callState.partnerImage}
          onToggleVideo={toggleVideo}
          onToggleAudio={toggleAudio}
          onEndCall={handleEndCall}
        />
      )}

      {/* Incoming call dialog */}
      {incomingCall.incomingCall && (
        <IncomingCallDialog
          callerName={incomingCall.incomingCall.callerName}
          callerImage={incomingCall.incomingCall.callerImage}
          onAccept={incomingCall.accept}
          onReject={incomingCall.reject}
        />
      )}
    </div>
  );
}
