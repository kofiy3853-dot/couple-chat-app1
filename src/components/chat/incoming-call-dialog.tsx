"use client";

import { Phone, PhoneOff } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/utils";

interface IncomingCallDialogProps {
  callerName: string;
  callerImage: string | null;
  onAccept: () => void;
  onReject: () => void;
}

export function IncomingCallDialog({
  callerName,
  callerImage,
  onAccept,
  onReject,
}: IncomingCallDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 mx-4 max-w-sm w-full shadow-2xl text-center">
        {/* Caller avatar */}
        <div className="relative mx-auto mb-4">
          <Avatar className="h-24 w-24 mx-auto">
            <AvatarImage src={callerImage || undefined} />
            <AvatarFallback className="bg-rose-100 text-rose-600 text-2xl font-bold">
              {getInitials(callerName)}
            </AvatarFallback>
          </Avatar>
          {/* Ringing animation */}
          <div className="absolute inset-0 rounded-full border-4 border-rose-400 animate-ping opacity-30" />
        </div>

        {/* Caller info */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
          {callerName}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Incoming video call...
        </p>

        {/* Accept/Reject buttons */}
        <div className="flex items-center justify-center gap-8">
          <Button
            onClick={onReject}
            variant="destructive"
            size="icon"
            className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600"
          >
            <PhoneOff className="h-7 w-7" />
          </Button>
          <Button
            onClick={onAccept}
            variant="default"
            size="icon"
            className="h-16 w-16 rounded-full bg-green-500 hover:bg-green-600"
          >
            <Phone className="h-7 w-7" />
          </Button>
        </div>
      </div>
    </div>
  );
}
