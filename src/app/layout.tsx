import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import VisualEditsMessenger from "../visual-edits/VisualEditsMessenger";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "ASCII Video Converter",
  description: "Transform videos into moving ASCII art",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${jetbrainsMono.variable} font-mono antialiased`}>
        <Script
          id="orchids-browser-logs"
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts/orchids-browser-logs.js"
          strategy="afterInteractive"
          data-orchids-project-id="44e9ee92-5f93-4054-b23c-a1624d3127ff"
        />
        <ErrorReporter />
        <Script
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts//route-messenger.js"
          strategy="afterInteractive"
          data-target-origin="*"
          data-message-type="ROUTE_CHANGE"
          data-include-search-params="true"
          data-only-in-iframe="true"
          data-debug="true"
          data-custom-data='{"appName": "YourApp", "version": "1.0.0", "greeting": "hi"}'
        />
        {/* Preload loading GIF for instant display */}
        <img
          src="/loading-ascii.gif"
          alt=""
          className="hidden"
          aria-hidden="true"
          loading="eager"
        />
        {/* Grid background layer */}
        <div className="fixed inset-0 bg-background grid-pattern pointer-events-none z-0" />
        {/* GIF overlay layer */}
        <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
          {/* Left GIF - 75% off screen to the left */}
          <img
            src="/ascii-video-orb-2.gif"
            alt=""
            className="absolute h-[95%] w-auto top-8 left-0 -translate-x-[62%] object-cover opacity-25 md:opacity-50 saturate-150"
            aria-hidden="true"
          />
          {/* Right GIF - 75% off screen to the right, mirrored */}
          <img
            src="/ascii-video-orb-2.gif"
            alt=""
            className="absolute h-[95%] w-auto top-8 right-0 translate-x-[62%] scale-x-[-1] object-cover opacity-25 md:opacity-50 saturate-150"
            aria-hidden="true"
          />
        </div>
        {/* Overlay to dim GIFs when editing - above GIFs (z-10) but below content (z-20) */}
        <div className="fixed inset-0 bg-card/50 backdrop-blur-sm pointer-events-none z-[15] video-editing-overlay" />
        {/* Content layer */}
        <div className="relative z-20">
          {children}
        </div>
        <VisualEditsMessenger />
      </body>
    </html>
  );
}
