"use client";

import { useEffect, useRef } from "react";
import { PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/utils";
import type { CallStatus } from "@/types/video-call";

interface VideoCallModalProps {
  status: CallStatus;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  callDuration: number;
  partnerName: string | null;
  partnerImage: string | null;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  onEndCall: () => void;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function VideoStream({ stream, muted, className }: { stream: MediaStream; muted?: boolean; className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      className={className}
    />
  );
}

export function VideoCallModal({
  status,
  localStream,
  remoteStream,
  isVideoEnabled,
  isAudioEnabled,
  callDuration,
  partnerName,
  partnerImage,
  onToggleVideo,
  onToggleAudio,
  onEndCall,
}: VideoCallModalProps) {
  const hasVideoTrack = localStream?.getVideoTracks().length ?? 0 > 0;

  return (
    <div className="fixed inset-0 z-50 bg-gray-950 flex flex-col">
      {/* Remote video (full screen) */}
      <div className="flex-1 relative overflow-hidden">
        {remoteStream ? (
          <VideoStream
            stream={remoteStream}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Avatar className="h-32 w-32">
              <AvatarImage src={partnerImage || undefined} />
              <AvatarFallback className="bg-rose-100 text-rose-600 text-4xl font-bold">
                {getInitials(partnerName)}
              </AvatarFallback>
            </Avatar>
          </div>
        )}

        {/* Partner name overlay */}
        <div className="absolute top-0 left-0 right-0 p-4 pt-[calc(env(safe-area-inset-top,0px)+1rem)] bg-gradient-to-b from-black/60 to-transparent">
          <h3 className="text-white text-lg font-semibold">{partnerName || "Partner"}</h3>
          {status === "active" && (
            <p className="text-white/70 text-sm">{formatDuration(callDuration)}</p>
          )}
        </div>

        {/* Local video (picture-in-picture) */}
        {localStream && hasVideoTrack > 0 && (
          <div className="absolute bottom-24 right-4 w-32 h-44 sm:w-40 sm:h-56 rounded-xl overflow-hidden border-2 border-white/20 shadow-lg">
            <VideoStream
              stream={localStream}
              muted
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Call controls */}
      <div className="flex items-center justify-center gap-6 pb-12 pt-6 bg-gray-950">
        {/* Toggle audio */}
        <Button
          onClick={onToggleAudio}
          variant="secondary"
          size="icon"
          className="h-14 w-14 rounded-full bg-white/10 hover:bg-white/20 text-white"
        >
          {isAudioEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6 text-red-400" />}
        </Button>

        {/* End call */}
        <Button
          onClick={onEndCall}
          variant="destructive"
          size="icon"
          className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600"
        >
          <PhoneOff className="h-7 w-7" />
        </Button>

        {/* Toggle video */}
        <Button
          onClick={onToggleVideo}
          variant="secondary"
          size="icon"
          className="h-14 w-14 rounded-full bg-white/10 hover:bg-white/20 text-white"
          disabled={!hasVideoTrack}
        >
          {isVideoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6 text-red-400" />}
        </Button>
      </div>
    </div>
  );
}
