"use client";

import { useCallback, useRef, useState } from "react";

interface IncomingCall {
  conversationId: string;
  callerId: string;
  callerName: string;
  callerImage: string | null;
  offer: RTCSessionDescriptionInit;
}

interface UseIncomingCallOptions {
  onAccept: (call: IncomingCall) => void;
  onReject: (conversationId: string) => void;
}

export function useIncomingCall({ onAccept, onReject }: UseIncomingCallOptions) {
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleIncomingOffer = useCallback(
    (data: { conversationId: string; callerId: string; callerName: string; callerImage: string | null; offer: RTCSessionDescriptionInit }) => {
      // Auto-dismiss after 30 seconds
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setIncomingCall(null);
        timeoutRef.current = null;
      }, 30000);

      setIncomingCall({
        conversationId: data.conversationId,
        callerId: data.callerId,
        callerName: data.callerName,
        callerImage: data.callerImage,
        offer: data.offer,
      });
    },
    []
  );

  const accept = useCallback(() => {
    if (!incomingCall) return;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    onAccept(incomingCall);
    setIncomingCall(null);
  }, [incomingCall, onAccept]);

  const reject = useCallback(() => {
    if (!incomingCall) return;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    onReject(incomingCall.conversationId);
    setIncomingCall(null);
  }, [incomingCall, onReject]);

  const dismiss = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIncomingCall(null);
  }, []);

  return {
    incomingCall,
    handleIncomingOffer,
    accept,
    reject,
    dismiss,
  };
}
