"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  onRemove: () => void;
  disabled?: boolean;
  aspectRatio?: number;
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  disabled = false,
  aspectRatio = 1,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(value);

  // Replace with your Cloudinary details
  const CLOUD_NAME = "dpahqjffg";
  const UPLOAD_PRESET = "POS_ADMIN_DASHBOARD";

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsUploading(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);

      try {
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
          {
            method: "POST",
            body: formData,
          }
        );
        const data = await response.json();
        console.log(data,"upload data");
        if (data.secure_url) {
          setPreviewUrl(data.secure_url);
          onChange(data.secure_url);
          toast({
            title: "Success",
            description: "Image uploaded successfully.",
          });
        } else {
          throw new Error("Upload failed");
        }
      } catch (error) {
        console.error("Image upload error:", error);
        toast({
          title: "Error",
          description: "Failed to upload image. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    },
    [onChange, UPLOAD_PRESET, CLOUD_NAME]
  );

  const handleRemove = () => {
    setPreviewUrl("");
    onRemove();
  };

  return (
    <div className="space-y-2">
      <div
        className="relative w-full h-48 bg-muted rounded-md flex items-center justify-center border-2 border-dashed border-muted-foreground/20 overflow-hidden"
        style={{ aspectRatio: aspectRatio }}
      >
        {previewUrl ? (
          <>
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            {!disabled && (
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </>
        ) : (
          <div className="text-center text-muted-foreground">
            {isUploading ? (
              <div className="flex items-center gap-2">
                <span>Uploading...</span>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent" />
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Drag and drop or click to upload</p>
                <p className="text-xs">PNG, JPG, or WebP (max 5MB)</p>
              </>
            )}
          </div>
        )}
        {!disabled && !isUploading && (
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileChange}
            disabled={disabled}
          />
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Recommended resolution: {Math.round(300 * aspectRatio)}x300px or higher
      </p>
    </div>
  );
}