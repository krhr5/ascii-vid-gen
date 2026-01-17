"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import Image from "next/image";

interface LoadingScreenProps {
  isLoading: boolean;
}

export function LoadingScreen({ isLoading }: LoadingScreenProps) {
  useEffect(() => {
    // Prevent body scroll when loading
    if (isLoading) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isLoading]);

  if (typeof window === "undefined") return null;

  if (!isLoading) return null;

  return createPortal(
    <motion.div
      key="loading-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="fixed inset-0 bg-card/80 backdrop-blur-sm z-[9999] flex items-center justify-center pointer-events-auto"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="flex flex-col items-center gap-4"
      >
        <Image
          src="/loading-ascii.gif"
          alt="Loading..."
          width={300}
          height={300}
          className="w-auto h-auto max-w-md"
          unoptimized
          priority
        />
      </motion.div>
    </motion.div>,
    document.body
  );
}
