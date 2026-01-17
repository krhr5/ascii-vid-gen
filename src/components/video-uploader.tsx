"use client";

import { useCallback } from "react";
import { Upload, Film } from "lucide-react";
import { motion } from "framer-motion";
import { parseGIF, decompressFrames } from "gifuct-js";

interface GifFrame {
  patch: Uint8ClampedArray;
  dims: { top: number; left: number; width: number; height: number };
  delay: number;
  disposalType: number;
}

interface VideoUploaderProps {
  onVideoLoad: (video: HTMLVideoElement | HTMLImageElement, file: File, gifFrames?: GifFrame[]) => void;
  onLoadingChange: (isLoading: boolean) => void;
}

export function VideoUploader({ onVideoLoad, onLoadingChange }: VideoUploaderProps) {

  const handleFile = useCallback(
    async (file: File) => {
      // Check file type - support various MIME types and extensions
      const validTypes = ["video/mp4", "video/webm", "video/quicktime", "image/gif"];
      const validExtensions = [".mp4", ".webm", ".mov", ".gif"];
      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
      
      const isValidType = validTypes.includes(file.type) || validExtensions.includes(fileExtension);
      
      if (!isValidType) {
        alert("Please upload a valid video file (MP4, WebM, MOV, or GIF)");
        return;
      }

      // Set loading state immediately
      onLoadingChange(true);

      try {
        if (file.type === "image/gif" || fileExtension === ".gif") {
          // Yield to browser to allow loading screen to render before heavy processing
          // This ensures React has time to render the loading screen UI
          await new Promise(resolve => {
            requestAnimationFrame(() => {
              requestAnimationFrame(resolve);
            });
          });

          try {
            const arrayBuffer = await file.arrayBuffer();
            const gif = parseGIF(arrayBuffer);
            const frames = decompressFrames(gif, true) as GifFrame[];
            
            const img = new Image();
            img.onerror = () => {
              onLoadingChange(false);
              alert("Failed to load GIF image");
            };
            img.src = URL.createObjectURL(file);
            img.onload = () => {
              onVideoLoad(img, file, frames);
            };
          } catch (error) {
            console.error("Failed to parse GIF:", error);
            const img = new Image();
            img.onerror = () => {
              onLoadingChange(false);
              alert("Failed to load GIF image");
            };
            img.src = URL.createObjectURL(file);
            img.onload = () => {
              onVideoLoad(img, file);
            };
          }
        } else {
          const video = document.createElement("video");
          let hasLoaded = false;
          
          video.onerror = () => {
            if (!hasLoaded) {
              hasLoaded = true;
              onLoadingChange(false);
              alert("Failed to load video file. Please try a different file.");
            }
          };
          
          video.src = URL.createObjectURL(file);
          video.muted = true;
          video.loop = true;
          video.playsInline = true;

          video.onloadedmetadata = () => {
            if (!hasLoaded) {
              hasLoaded = true;
              onVideoLoad(video, file);
            }
          };
          
          // Fallback for videos that don't trigger onloadedmetadata quickly
          setTimeout(() => {
            if (!hasLoaded && video.readyState >= 2) {
              hasLoaded = true;
              onVideoLoad(video, file);
            }
          }, 2000);
        }
      } catch (error) {
        console.error("Error processing file:", error);
        onLoadingChange(false);
        alert("An error occurred while processing the file. Please try again.");
      }
    },
    [onVideoLoad, onLoadingChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl mx-auto"
      >
        <label
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="group relative flex flex-col items-center justify-center w-full h-80 border-2 border-dashed border-primary/30 rounded-2xl cursor-pointer transition-all duration-300 hover:border-primary/60 hover:bg-background/60 glow-border overflow-hidden bg-background/90"
        >
          <div className="absolute inset-0 grid-pattern opacity-50" />
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="relative z-10 flex flex-col items-center gap-4"
          >
            <div className="p-4 rounded-full bg-primary/10 border border-primary/20">
              <Upload className="w-10 h-10 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-foreground">
                Drop your video here
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                or click to browse
              </p>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Film className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                MP4, WebM, MOV, GIF supported
              </span>
            </div>
          </motion.div>
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime,image/gif"
            onChange={handleChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </label>
      </motion.div>
  );
}
