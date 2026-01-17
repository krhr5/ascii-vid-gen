"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Sparkles, Plus } from "lucide-react";
import { VideoUploader } from "@/components/video-uploader";
import { ControlPanel } from "@/components/control-panel";
import { ASCIIPreview } from "@/components/ascii-preview";
import { ASCIISettings, DEFAULT_SETTINGS } from "@/lib/ascii-converter";
import { Button } from "@/components/ui/button";

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

  const handleVideoLoad = (loadedVideo: HTMLVideoElement | HTMLImageElement, file: File, frames?: GifFrame[]) => {
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
  };

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

  return (
    <div className="min-h-screen bg-background grid-pattern">
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
              <Terminal className="w-5 h-5 text-primary" />
            </div>
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
          {!video ? (
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
              <VideoUploader onVideoLoad={handleVideoLoad} />
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
          ) : (
            <motion.div
              key="editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
          )}
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
  );
}
