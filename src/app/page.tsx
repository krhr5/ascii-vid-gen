"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Plus } from "lucide-react";
import Image from "next/image";
import { VideoUploader } from "@/components/video-uploader";
import { ControlPanel } from "@/components/control-panel";
import { ASCIIPreview } from "@/components/ascii-preview";
import { ASCIISettings, DEFAULT_SETTINGS } from "@/lib/ascii-converter";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/loading-screen";

interface GifFrame {
  patch: Uint8ClampedArray;
  dims: { top: number; left: number; width: number; height: number };
  delay: number;
  disposalType: number;
}

export default function Home() {
  const [video, setVideo] = useState<HTMLVideoElement | HTMLImageElement | null>(null);
  const [gifFrames, setGifFrames] = useState<GifFrame[] | undefined>(undefined);
  const [fileName, setFileName] = useState<string>("");
  const [settings, setSettings] = useState<ASCIISettings>(DEFAULT_SETTINGS);
  const [originalWidth, setOriginalWidth] = useState(0);
  const [originalHeight, setOriginalHeight] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const loadingStartTimeRef = useRef<number | null>(null);
  const pendingVideoRef = useRef<{
    video: HTMLVideoElement | HTMLImageElement;
    file: File;
    frames?: GifFrame[];
  } | null>(null);

  const handleLoadingChange = useCallback((loading: boolean) => {
    if (loading) {
      // Start loading - record start time immediately
      const startTime = Date.now();
      loadingStartTimeRef.current = startTime;
      setIsLoading(true);
    } else {
      // Error case - reset immediately
      setIsLoading(false);
      loadingStartTimeRef.current = null;
      pendingVideoRef.current = null;
    }
  }, []);

  const handleVideoLoad = useCallback((loadedVideo: HTMLVideoElement | HTMLImageElement, file: File, frames?: GifFrame[]) => {
    // Store the loaded video
    pendingVideoRef.current = { video: loadedVideo, file, frames };
    
    // Always wait 2 seconds from when loading started
    const startTime = loadingStartTimeRef.current;
    if (!startTime) {
      // Fallback if startTime wasn't set (shouldn't happen, but just in case)
      loadingStartTimeRef.current = Date.now();
      setTimeout(() => {
        setIsLoading(false);
        loadingStartTimeRef.current = null;
        setVideo(loadedVideo);
        setFileName(file.name);
        setGifFrames(frames);
        if (loadedVideo instanceof HTMLVideoElement) {
          setOriginalWidth(loadedVideo.videoWidth);
          setOriginalHeight(loadedVideo.videoHeight);
        } else {
          setOriginalWidth(loadedVideo.naturalWidth);
          setOriginalHeight(loadedVideo.naturalHeight);
        }
        pendingVideoRef.current = null;
      }, 2000);
      return;
    }
    
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, 2000 - elapsed);
    
    setTimeout(() => {
      const pending = pendingVideoRef.current;
      if (pending) {
        setIsLoading(false);
        loadingStartTimeRef.current = null;
        
        // Show the editing components
        setVideo(pending.video);
        setFileName(pending.file.name);
        setGifFrames(pending.frames);
        if (pending.video instanceof HTMLVideoElement) {
          setOriginalWidth(pending.video.videoWidth);
          setOriginalHeight(pending.video.videoHeight);
        } else {
          setOriginalWidth(pending.video.naturalWidth);
          setOriginalHeight(pending.video.naturalHeight);
        }
        
        pendingVideoRef.current = null;
      }
    }, remaining);
  }, []);

  const handleReset = () => {
    if (video) {
      if (video instanceof HTMLVideoElement) {
        video.pause();
      }
      URL.revokeObjectURL(video.src);
    }
    setVideo(null);
    setGifFrames(undefined);
    setFileName("");
    setOriginalWidth(0);
    setOriginalHeight(0);
  };

  // Preload the loading GIF to ensure it's ready immediately
  useEffect(() => {
    if (typeof window !== "undefined") {
      const img = document.createElement("img");
      img.src = "/loading-ascii.gif";
    }
  }, []);

  // Add/remove class on body when video is loaded
  useEffect(() => {
    if (video) {
      document.body.classList.add("video-editing");
    } else {
      document.body.classList.remove("video-editing");
    }
    return () => {
      document.body.classList.remove("video-editing");
    };
  }, [video]);

  return (
    <>
      <LoadingScreen isLoading={isLoading} />
      <div className="min-h-screen">
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image 
              src="/icon-vid.png" 
              alt="ASCII Video Converter" 
              width={48} 
              height={48}
              className="h-full w-auto rounded-xl"
            />
            <div>
              <h1 className="font-semibold text-lg tracking-tight">ASCII Video</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Transform videos into moving ASCII art
              </p>
            </div>
          </div>
          {video && (
            <Button variant="outline" size="sm" onClick={handleReset} className="border-border cursor-pointer">
              <Plus className="w-4 h-4 mr-2" />
              New Video
            </Button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {!video && !isLoading ? (
            <motion.div
              key="uploader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center gap-8 pt-12"
            >
              <div className="text-center space-y-4 max-w-xl">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-xs text-primary"
                >
                  <Sparkles className="w-3 h-3" />
                  Convert any video to ASCII
                </motion.div>
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-4xl sm:text-5xl font-bold tracking-tight"
                >
                  Video to{" "}
                  <span className="text-primary">ASCII Art</span>
                </motion.h2>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-muted-foreground text-lg"
                >
                  Create stunning ASCII animations for your creative web projects. Export in GIF, MP4, or WebM.
                </motion.p>
              </div>
              <VideoUploader onVideoLoad={handleVideoLoad} onLoadingChange={handleLoadingChange} />
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap justify-center gap-3 text-xs text-muted-foreground"
              >
                {["Original Colors", "Custom Gradients", "Transparent BG", "Same Dimensions"].map(
                  (feature, i) => (
                    <span
                      key={feature}
                      className="px-3 py-1.5 bg-card/50 border border-border rounded-full"
                    >
                      {feature}
                    </span>
                  )
                )}
              </motion.div>
            </motion.div>
          ) : !isLoading && video ? (
            <motion.div
              key="editor"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{fileName}</span>
                <span>•</span>
                <span>{originalWidth} × {originalHeight}</span>
              </div>
              <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
                <div className="min-w-0 overflow-hidden">
                  <ASCIIPreview
                    video={video}
                    gifFrames={gifFrames}
                    settings={settings}
                    originalWidth={originalWidth}
                    originalHeight={originalHeight}
                  />
                </div>
                <div className="lg:self-stretch">
                  <ControlPanel
                    settings={settings}
                    onSettingsChange={setSettings}
                  />
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>

      <footer className="border-t border-border/50 mt-auto">
        <div className="container mx-auto px-4 h-14 flex items-center justify-center">
          <p className="text-xs text-muted-foreground">
            ASCII Video Converter • Export to GIF, MP4, WebM
          </p>
        </div>
      </footer>
    </div>
    </>
  );
}
