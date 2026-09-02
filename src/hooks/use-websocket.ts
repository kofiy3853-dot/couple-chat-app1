"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseWebSocketOptions {
  url?: string;
  onMessage?: (data: unknown) => void;
  onTyping?: (userId: string) => void;
}

export function useWebSocket({ url, onMessage, onTyping }: UseWebSocketOptions = {}) {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectRef = useRef<(() => void) | null>(null);

  const connect = useCallback(() => {
    if (!url) return;

    try {
      const socket = new WebSocket(url);

      socket.onopen = () => {
        setConnected(true);
      };

      socket.onclose = () => {
        setConnected(false);
        reconnectTimeoutRef.current = setTimeout(() => {
          connectRef.current?.();
        }, 5000);
      };

      socket.onerror = () => {
        setConnected(false);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "message" && onMessage) {
            onMessage(data);
          }
          if (data.type === "typing" && onTyping) {
            onTyping(data.userId);
          }
        } catch {
          // ignore parse errors
        }
      };

      wsRef.current = socket;
    } catch {
      setConnected(false);
    }
  }, [url, onMessage, onTyping]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const sendMessage = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const sendTyping = useCallback(() => {
    sendMessage({ type: "typing" });
  }, [sendMessage]);

  return {
    connected,
    connect,
    sendMessage,
    sendTyping,
  };
}
