"use client";

import { Video } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CallButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function CallButton({ onClick, disabled }: CallButtonProps) {
  return (
    <Button
      onClick={onClick}
      variant="ghost"
      size="icon"
      className="h-9 w-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
      disabled={disabled}
      title="Start video call"
    >
      <Video className="h-4 w-4 text-gray-600 dark:text-gray-300" />
    </Button>
  );
}
