"use client";

import { useState, useRef, useCallback } from "react";

interface UseVoiceRecorderOptions {
  onRecordingComplete: (blob: Blob) => void;
  onError?: (error: Error) => void;
}

export function useVoiceRecorder({ onRecordingComplete, onError }: UseVoiceRecorderOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        onRecordingComplete(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.onerror = (e) => {
        onError?.(new Error("Recording failed"));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error("Microphone access denied"));
    }
  }, [onRecordingComplete, onError]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setDuration(0);
      chunksRef.current = [];
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
  }, [isRecording]);

  return {
    isRecording,
    duration,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
