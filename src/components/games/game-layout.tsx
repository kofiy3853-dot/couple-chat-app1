"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GameLayoutProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
  children: React.ReactNode;
  className?: string;
}

export function GameLayout({ title, subtitle, onBack, children, className }: GameLayoutProps) {
  return (
    <div className={cn("max-w-2xl mx-auto", className)}>
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-9 w-9 shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}
