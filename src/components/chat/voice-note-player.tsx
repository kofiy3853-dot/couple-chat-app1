"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/hooks/use-voice-recorder";

interface VoiceNotePlayerProps {
  src: string;
  isOwn?: boolean;
  className?: string;
}

export function VoiceNotePlayer({ src, isOwn = false, className }: VoiceNotePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={cn("flex items-center gap-2 min-w-[180px]", className)}>
      <audio ref={audioRef} src={src} preload="metadata" />

      <button
        onClick={togglePlay}
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full shrink-0 transition-colors",
          isOwn
            ? "bg-white/20 hover:bg-white/30 text-white"
            : "bg-rose-100 hover:bg-rose-200 text-rose-600 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 dark:text-rose-400"
        )}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" fill="currentColor" />
        ) : (
          <Play className="h-4 w-4 ml-0.5" fill="currentColor" />
        )}
      </button>

      <div className="flex-1 flex flex-col gap-1">
        <div className="h-1.5 rounded-full overflow-hidden bg-black/10 dark:bg-white/10">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-100",
              isOwn ? "bg-white" : "bg-rose-500"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[10px] opacity-70 tabular-nums">
          {formatDuration(Math.floor(currentTime))} / {formatDuration(Math.floor(duration || 0))}
        </span>
      </div>
    </div>
  );
}
