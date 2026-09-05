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
      <div className="relative">
        <Avatar className="h-20 w-20">
          <AvatarImage src={displayImage || undefined} alt={name || "User"} />
          <AvatarFallback className="bg-rose-100 text-rose-600 text-xl font-semibold">
            {name?.charAt(0)?.toUpperCase() ?? "U"}
          </AvatarFallback>
        </Avatar>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="h-8"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Camera className="h-4 w-4 mr-1" />
            )}
            {currentImage ? "Change" : "Upload"}
          </Button>

          {currentImage && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setPreview(null); onRemove(); }}
              className="text-red-500 hover:text-red-600 h-8"
            >
              <X className="h-4 w-4 mr-1" />
              Remove
            </Button>
          )}
        </div>
        <p className="text-xs text-gray-500">JPEG, PNG, GIF or WebP. Max 2MB.</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}
