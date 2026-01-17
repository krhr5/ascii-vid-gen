"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, Download, Loader2, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ASCIISettings,
  convertFrameToASCII,
  renderASCIIToCanvas,
} from "@/lib/ascii-converter";
import GIF from "gif.js";

const MAX_PREVIEW_WIDTH = 800;
const MAX_PREVIEW_HEIGHT = 500;

interface GifFrame {
  patch: Uint8ClampedArray;
  dims: { top: number; left: number; width: number; height: number };
  delay: number;
  disposalType: number;
}

interface ASCIIPreviewProps {
  video: HTMLVideoElement | HTMLImageElement;
  gifFrames?: GifFrame[];
  settings: ASCIISettings;
  originalWidth: number;
  originalHeight: number;
}

type ExportFormat = "gif" | "mp4" | "webm";

export function ASCIIPreview({
  video,
  gifFrames,
  settings,
  originalWidth,
  originalHeight,
}: ASCIIPreviewProps) {
  const isVideo = video instanceof HTMLVideoElement;
  const isAnimatedGif = !isVideo && gifFrames && gifFrames.length > 1;
  const sourceCanvasRef = useRef<HTMLCanvasElement>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement>(null);
  const gifCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const gifFrameIndexRef = useRef(0);
  const lastGifFrameTimeRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("gif");
  const [previewScale, setPreviewScale] = useState(50);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportWidthOverride, setExportWidthOverride] = useState("");
  const [exportHeightOverride, setExportHeightOverride] = useState("");

  const aspectRatio = originalWidth / originalHeight;
  const previewWidth = Math.round(originalWidth * (previewScale / 100));
  const previewHeight = Math.round(originalHeight * (previewScale / 100));

  const needsScroll = previewWidth > MAX_PREVIEW_WIDTH || previewHeight > MAX_PREVIEW_HEIGHT;

  const getExportDimensions = () => {
    const overrideW = parseInt(exportWidthOverride, 10);
    const overrideH = parseInt(exportHeightOverride, 10);
    
    if (!isNaN(overrideW) && overrideW > 0 && !isNaN(overrideH) && overrideH > 0) {
      return { width: overrideW, height: overrideH };
    }
    if (!isNaN(overrideW) && overrideW > 0) {
      return { width: overrideW, height: Math.round(overrideW / aspectRatio) };
    }
    if (!isNaN(overrideH) && overrideH > 0) {
      return { width: Math.round(overrideH * aspectRatio), height: overrideH };
    }
    return { width: previewWidth, height: previewHeight };
  };

  const renderGifFrame = useCallback((frameIndex: number) => {
    if (!gifFrames || !gifCanvasRef.current) return;
    
    const gifCanvas = gifCanvasRef.current;
    const gifCtx = gifCanvas.getContext("2d");
    if (!gifCtx) return;

    const frame = gifFrames[frameIndex];
    if (!frame) return;

    // Handle disposal type
    if (frame.disposalType === 2) {
      gifCtx.clearRect(0, 0, originalWidth, originalHeight);
    }

    // Create ImageData from the frame patch
    const imageData = new ImageData(frame.patch, frame.dims.width, frame.dims.height);
    gifCtx.putImageData(imageData, frame.dims.left, frame.dims.top);
  }, [gifFrames, originalWidth, originalHeight]);

  const renderFrame = useCallback(() => {
    const sourceCanvas = sourceCanvasRef.current;
    const outputCanvas = outputCanvasRef.current;
    if (!sourceCanvas || !outputCanvas) return;

    const sourceCtx = sourceCanvas.getContext("2d", { willReadFrequently: true });
    const outputCtx = outputCanvas.getContext("2d");
    if (!sourceCtx || !outputCtx) return;

    if (isAnimatedGif && gifCanvasRef.current) {
      sourceCtx.drawImage(gifCanvasRef.current, 0, 0, originalWidth, originalHeight);
    } else {
      sourceCtx.drawImage(video, 0, 0, originalWidth, originalHeight);
    }
    
    const asciiChars = convertFrameToASCII(
      sourceCtx,
      originalWidth,
      originalHeight,
      settings
    );
    renderASCIIToCanvas(outputCtx, asciiChars, settings, originalWidth, originalHeight);
  }, [video, settings, originalWidth, originalHeight, isAnimatedGif]);

  const animate = useCallback((timestamp: number) => {
    if (isAnimatedGif && gifFrames) {
      const frame = gifFrames[gifFrameIndexRef.current];
      const delay = frame?.delay || 100;
      
      if (timestamp - lastGifFrameTimeRef.current >= delay) {
        gifFrameIndexRef.current = (gifFrameIndexRef.current + 1) % gifFrames.length;
        renderGifFrame(gifFrameIndexRef.current);
        lastGifFrameTimeRef.current = timestamp;
      }
    }
    
    renderFrame();
    animationRef.current = requestAnimationFrame(animate);
  }, [renderFrame, isAnimatedGif, gifFrames, renderGifFrame]);

  // Initialize gif canvas when frames are available
  useEffect(() => {
    if (isAnimatedGif && gifFrames && gifCanvasRef.current) {
      const gifCtx = gifCanvasRef.current.getContext("2d");
      if (gifCtx) {
        gifCtx.clearRect(0, 0, originalWidth, originalHeight);
        renderGifFrame(0);
        renderFrame();
      }
    }
  }, [isAnimatedGif, gifFrames, originalWidth, originalHeight, renderGifFrame, renderFrame]);

  useEffect(() => {
    if (isPlaying) {
      if (isVideo) video.play();
      lastGifFrameTimeRef.current = performance.now();
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (isVideo) video.pause();
      cancelAnimationFrame(animationRef.current);
    }

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, animate, video, isVideo]);

  useEffect(() => {
    renderFrame();
  }, [settings, renderFrame]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    if (isVideo) {
      video.currentTime = 0;
    }
    if (isAnimatedGif) {
      gifFrameIndexRef.current = 0;
      renderGifFrame(0);
    }
    renderFrame();
  };

  const exportAsGIF = async () => {
    const sourceCanvas = sourceCanvasRef.current;
    const outputCanvas = outputCanvasRef.current;
    if (!sourceCanvas || !outputCanvas) return;

    const sourceCtx = sourceCanvas.getContext("2d", { willReadFrequently: true });
    const outputCtx = outputCanvas.getContext("2d");
    if (!sourceCtx || !outputCtx) return;

    const exportDims = getExportDimensions();
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = exportDims.width;
    exportCanvas.height = exportDims.height;
    const exportCtx = exportCanvas.getContext("2d");
    if (!exportCtx) return;

    const gif = new GIF({
      workers: 2,
      quality: 10,
      width: exportDims.width,
      height: exportDims.height,
      workerScript: "/gif.worker.js",
      transparent: settings.transparentBackground ? 0x00000000 : undefined,
    });

    if (isAnimatedGif && gifFrames) {
      const totalFrames = gifFrames.length;
      
      for (let i = 0; i < totalFrames; i++) {
        renderGifFrame(i);
        
        if (gifCanvasRef.current) {
          sourceCtx.drawImage(gifCanvasRef.current, 0, 0, originalWidth, originalHeight);
        }
        
        const asciiChars = convertFrameToASCII(
          sourceCtx,
          originalWidth,
          originalHeight,
          settings
        );
        renderASCIIToCanvas(exportCtx, asciiChars, settings, exportDims.width, exportDims.height);

        const frameCanvas = document.createElement("canvas");
        frameCanvas.width = exportDims.width;
        frameCanvas.height = exportDims.height;
        const frameCtx = frameCanvas.getContext("2d");
        if (frameCtx) {
          frameCtx.drawImage(exportCanvas, 0, 0);
          const delay = gifFrames[i].delay || 100;
          gif.addFrame(frameCanvas, { delay, copy: true });
        }

        setExportProgress(Math.round(((i + 1) / totalFrames) * 100));
      }
    } else if (isVideo) {
      const fps = 15;
      const duration = video.duration;
      const totalFrames = Math.min(Math.floor(duration * fps), 150);

      for (let i = 0; i < totalFrames; i++) {
        video.currentTime = (i / totalFrames) * duration;
        await new Promise((resolve) => {
          video.onseeked = resolve;
        });

        sourceCtx.drawImage(video, 0, 0, originalWidth, originalHeight);
        const asciiChars = convertFrameToASCII(
          sourceCtx,
          originalWidth,
          originalHeight,
          settings
        );
        renderASCIIToCanvas(exportCtx, asciiChars, settings, exportDims.width, exportDims.height);

        const frameCanvas = document.createElement("canvas");
        frameCanvas.width = exportDims.width;
        frameCanvas.height = exportDims.height;
        const frameCtx = frameCanvas.getContext("2d");
        if (frameCtx) {
          frameCtx.drawImage(exportCanvas, 0, 0);
          gif.addFrame(frameCanvas, { delay: 1000 / fps, copy: true });
        }

        setExportProgress(Math.round(((i + 1) / totalFrames) * 100));
      }
    } else {
      sourceCtx.drawImage(video, 0, 0, originalWidth, originalHeight);
      const asciiChars = convertFrameToASCII(
        sourceCtx,
        originalWidth,
        originalHeight,
        settings
      );
      renderASCIIToCanvas(exportCtx, asciiChars, settings, exportDims.width, exportDims.height);

      const frameCanvas = document.createElement("canvas");
      frameCanvas.width = exportDims.width;
      frameCanvas.height = exportDims.height;
      const frameCtx = frameCanvas.getContext("2d");
      if (frameCtx) {
        frameCtx.drawImage(exportCanvas, 0, 0);
        gif.addFrame(frameCanvas, { delay: 100, copy: true });
      }
      setExportProgress(100);
    }

    gif.on("finished", (blob: Blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ascii-video.gif";
      a.click();
      URL.revokeObjectURL(url);
      setIsExporting(false);
      setExportProgress(0);
    });

    gif.render();
  };

  const exportAsVideo = async (format: "mp4" | "webm") => {
    const sourceCanvas = sourceCanvasRef.current;
    if (!sourceCanvas) return;

    const sourceCtx = sourceCanvas.getContext("2d", { willReadFrequently: true });
    if (!sourceCtx) return;

    const exportDims = getExportDimensions();
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = exportDims.width;
    exportCanvas.height = exportDims.height;
    const exportCtx = exportCanvas.getContext("2d");
    if (!exportCtx) return;

    const mimeType = format === "webm" ? "video/webm" : "video/mp4";
    const stream = exportCanvas.captureStream(30);
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : "video/webm",
    });
    const chunks: Blob[] = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ascii-video.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      setIsExporting(false);
      setExportProgress(0);
    };

    if (isVideo) {
      video.currentTime = 0;
      await new Promise((resolve) => {
        video.onseeked = resolve;
      });
    }

    mediaRecorder.start();

    const startTime = Date.now();
    const duration = (isVideo ? video.duration : 2) * 1000;

    const recordFrame = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setExportProgress(Math.round(progress * 100));

      sourceCtx.drawImage(video, 0, 0, originalWidth, originalHeight);
      const asciiChars = convertFrameToASCII(
        sourceCtx,
        originalWidth,
        originalHeight,
        settings
      );
      renderASCIIToCanvas(exportCtx, asciiChars, settings, exportDims.width, exportDims.height);

      if (elapsed < duration) {
        requestAnimationFrame(recordFrame);
      } else {
        mediaRecorder.stop();
      }
    };

    if (isVideo) video.play();
    recordFrame();
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);

    const wasPlaying = isPlaying;
    setIsPlaying(false);
    if (isVideo) video.pause();

    try {
      if (exportFormat === "gif") {
        await exportAsGIF();
      } else {
        await exportAsVideo(exportFormat);
      }
    } catch (error) {
      console.error("Export failed:", error);
      setIsExporting(false);
      setExportProgress(0);
    }

    if (wasPlaying) {
      setIsPlaying(true);
    }
  };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-4 w-full"
      >
        <div className="flex flex-wrap items-center gap-4 p-3 bg-card/50 border border-border rounded-lg">
          <div className="flex items-center gap-2">
            <ZoomOut className="w-4 h-4 text-muted-foreground" />
            <Slider
              value={[previewScale]}
              onValueChange={([v]) => setPreviewScale(v)}
              min={10}
              max={200}
              step={5}
              className="w-32"
            />
            <ZoomIn className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground min-w-[3rem]">{previewScale}%</span>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Size:</Label>
            <span className="text-xs font-mono">{previewWidth} × {previewHeight}px</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPreviewScale(50)}
            className="h-8 text-xs cursor-pointer underline hover:no-underline ml-auto"
          >
            Reset
          </Button>
        </div>

        <div
          ref={containerRef}
          className="relative bg-card border border-border rounded-xl overflow-auto w-full flex items-center justify-center"
          style={{ 
            maxHeight: MAX_PREVIEW_HEIGHT + 40,
            minHeight: Math.min(previewHeight, MAX_PREVIEW_HEIGHT) + 40
          }}
        >
          <div 
            style={{ 
              width: previewWidth, 
              height: previewHeight,
              margin: 'auto'
            }}
          >
            <canvas
              ref={sourceCanvasRef}
              width={originalWidth}
              height={originalHeight}
              className="hidden"
            />
            <canvas
              ref={gifCanvasRef}
              width={originalWidth}
              height={originalHeight}
              className="hidden"
            />
            <canvas
              ref={outputCanvasRef}
              width={originalWidth}
              height={originalHeight}
              style={{ width: previewWidth, height: previewHeight, imageRendering: "pixelated" }}
            />
          </div>
          {isExporting && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <div className="text-sm text-muted-foreground">
                Exporting... {exportProgress}%
              </div>
              <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-200"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePlayPause}
            disabled={isExporting}
            className="cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleReset}
            disabled={isExporting}
            className="cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
            <Select
              value={exportFormat}
              onValueChange={(v) => setExportFormat(v as ExportFormat)}
              disabled={isExporting}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gif">GIF</SelectItem>
                <SelectItem value="mp4">MP4</SelectItem>
                <SelectItem value="webm">WebM</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setShowExportModal(true)} disabled={isExporting} className="cursor-pointer">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          Export size: {previewWidth} × {previewHeight}px
          {needsScroll && " • Scroll to view full preview"}
        </div>

        <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Export Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Default export size: {previewWidth} × {previewHeight}px
                </Label>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Override dimensions (optional)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder={previewWidth.toString()}
                    value={exportWidthOverride}
                    onChange={(e) => setExportWidthOverride(e.target.value)}
                    type="number"
                    className="w-24"
                  />
                  <span className="text-muted-foreground">×</span>
                  <Input
                    placeholder={previewHeight.toString()}
                    value={exportHeightOverride}
                    onChange={(e) => setExportHeightOverride(e.target.value)}
                    type="number"
                    className="w-24"
                  />
                  <span className="text-xs text-muted-foreground">px</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Leave empty to export at preview size. Enter one value to maintain aspect ratio.
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Format</Label>
                <Select
                  value={exportFormat}
                  onValueChange={(v) => setExportFormat(v as ExportFormat)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gif">GIF</SelectItem>
                    <SelectItem value="mp4">MP4</SelectItem>
                    <SelectItem value="webm">WebM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(exportWidthOverride || exportHeightOverride) && (
                <div className="text-sm text-primary">
                  Export size: {getExportDimensions().width} × {getExportDimensions().height}px
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowExportModal(false)} className="cursor-pointer">
                Cancel
              </Button>
              <Button onClick={() => {
                setShowExportModal(false);
                handleExport();
              }} className="cursor-pointer">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </motion.div>
  );
}
