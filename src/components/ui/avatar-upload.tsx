"use client";

import { useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, X } from "lucide-react";

interface AvatarUploadProps {
  currentImage: string | null;
  name: string | null;
  onUpload: (dataUrl: string) => void;
  onRemove: () => void;
}

export function AvatarUpload({ currentImage, name, onUpload, onRemove }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (data.success) {
        setPreview(data.data.url);
        onUpload(data.data.url);
      }
    } catch {
      // upload failed
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const displayImage = preview || currentImage;

  return (
    <div className="flex items-center gap-4">
      <div className="relative group">
        <Avatar className="h-20 w-20">
          <AvatarImage src={displayImage || undefined} alt={name || "User"} />
          <AvatarFallback className="bg-rose-100 text-rose-600 text-xl font-semibold">
            {name?.charAt(0)?.toUpperCase() ?? "U"}
          </AvatarFallback>
        </Avatar>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-wait"
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 text-white animate-spin" />
          ) : (
            <Camera className="h-5 w-5 text-white" />
          )}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {currentImage ? "Change photo" : "Upload photo"}
        </p>
        <p className="text-xs text-gray-500">JPEG, PNG, GIF or WebP. Max 2MB.</p>
        {currentImage && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setPreview(null); onRemove(); }}
            className="text-red-500 hover:text-red-600 h-7 px-2"
          >
            <X className="h-3 w-3 mr-1" />
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}
