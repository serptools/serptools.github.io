"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { saveBlob } from "@/components/saveAs";

type Props = {
  title: string;              // e.g., "PDF to JPG"
  subtitle?: string;          // e.g., "Convert each PDF page into a JPG…"
  from: string;               // "pdf"
  to: string;                 // "jpg"
  accept?: string;            // optional override accept attr
  videoEmbedId: string;       // YouTube embed ID for video
};

export default function LanderHeroTwoColumn({
  title,
  subtitle = "Fast, private, in-browser conversion.",
  from,
  to,
  accept,
  videoEmbedId,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropRef = useRef<HTMLDivElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState("or drop files here");
  const [dropEffect, setDropEffect] = useState<string>("");
  // Generate stable color based on tool properties
  const colors = [
    "#ef4444", // red-500
    "#f59e0b", // amber-500  
    "#22c55e", // green-500
    "#3b82f6", // blue-500
    "#a855f7", // purple-500
    "#ec4899", // pink-500
    "#14b8a6", // teal-500
    "#f97316", // orange-500
    "#6366f1", // indigo-500
    "#f43f5e", // rose-500
    "#0ea5e9", // sky-500
    "#84cc16", // lime-500
  ];
  
  // Use a stable hash based on from/to combination
  const hashCode = (from + to).split('').reduce((hash, char) => {
    return char.charCodeAt(0) + ((hash << 5) - hash);
  }, 0);
  const randomColor = colors[Math.abs(hashCode) % colors.length];

  function ensureWorker() {
    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL("../workers/convert.worker.ts", import.meta.url),
        { type: "module" }
      );
    }
    return workerRef.current;
  }

  function onPick() {
    inputRef.current?.click();
  }

  async function handleFiles(files: FileList | null) {
    if (!files || !files.length) return;
    const w = ensureWorker();
    setBusy(true);
    for (const file of Array.from(files)) {
      const buf = await file.arrayBuffer();
      await new Promise<void>((resolve, reject) => {
        w.onmessage = (ev: MessageEvent<any>) => {
          if (!ev.data?.ok) return reject(new Error(ev.data?.error || "Convert failed"));
          
          // Handle PDF pages (returns multiple blobs)
          if (ev.data.blobs) {
            const mimeType = to === "png" ? "image/png" : to === "jpg" || to === "jpeg" ? "image/jpeg" : "image/webp";
            ev.data.blobs.forEach((buf: ArrayBuffer, i: number) => {
              const blob = new Blob([buf], { type: mimeType });
              const name = file.name.replace(/\.[^.]+$/, "") + `_page${i + 1}.${to}`;
              saveBlob(blob, name);
            });
          } else {
            // Handle single image conversion
            const blob = new Blob([ev.data.blob], { type: to === "png" ? "image/png" : "image/jpeg" });
            const name = file.name.replace(/\.[^.]+$/, "") + "." + to;
            saveBlob(blob, name);
          }
          resolve();
        };
        const op = from === "pdf" ? "pdf-pages" : "raster";
        w.postMessage(op === "raster"
          ? { op, from, to, buf }
          : { op, to, buf }, // pdf -> jpg/png pages
        [buf]);
      });
    }
    setBusy(false);
  }

  // simple drag/drop
  function onDrag(e: React.DragEvent) {
    e.preventDefault();
    if (e.type === "dragenter" || e.type === "dragover") setHint("Drop to convert");
    if (e.type === "dragleave") setHint("or drop files here");
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    
    // Trigger fun effect - cycle through based on time
    const effects = [
      "splash",
      "bounce", 
      "spin",
      "pulse",
      "shake",
      "flip",
      "zoom",
      "confetti",
      "rejected"
    ];
    // Use timestamp to cycle through effects deterministically
    const effectIndex = Math.floor(Date.now() / 1000) % effects.length;
    setDropEffect(effects[effectIndex]);
    
    // Clear effect after animation
    setTimeout(() => setDropEffect(""), 1000);
    
    setHint("Converting…");
    handleFiles(e.dataTransfer.files).finally(() => setHint("or drop files here"));
  }
  
  // Clear drop effect when component unmounts or effect changes
  useEffect(() => {
    if (dropEffect) {
      const timer = setTimeout(() => setDropEffect(""), 1000);
      return () => clearTimeout(timer);
    }
  }, [dropEffect]);

  const acceptAttr =
    accept ??
    (from === "pdf" ? ".pdf"
     : from === "jpg" ? ".jpg,.jpeg"
     : from === "jpeg" ? ".jpeg,.jpg"
     : `.${from}`);

  return (
    <section className="w-full bg-white">
      <div className="mx-auto max-w-[1400px] px-6 py-12">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-center mb-12">{title}</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
          {/* Video Column */}
          <div className="order-2 lg:order-1">
            <div className="relative w-full rounded-xl overflow-hidden bg-gray-900" style={{ aspectRatio: '16/9' }}>
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src={`https://www.youtube.com/embed/${videoEmbedId}`}
                title="How It Works"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>

          {/* Dropzone Column */}
          <div className="order-1 lg:order-2">
            <div
              ref={dropRef}
              onDragEnter={onDrag}
              onDragOver={onDrag}
              onDragLeave={onDrag}
              onDrop={onDrop}
              className={`border-2 border-dashed rounded-xl p-12 hover:border-opacity-80 transition-colors cursor-pointer w-full flex items-center justify-center ${
                dropEffect ? `animate-${dropEffect}` : ""
              }`}
              style={{
                backgroundColor: randomColor + "15", // 15 is ~8% opacity
                borderColor: randomColor,
                aspectRatio: '16/9',
              }}
              onClick={onPick}
            >
              <div className="flex flex-col items-center space-y-6">
                <svg
                  className="w-12 h-12"
                  fill="none"
                  stroke="currentColor"
                  style={{ color: randomColor }}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                
                <Button
                  size="lg"
                  className="h-12 px-8 rounded-xl text-white shadow-lg"
                  style={{
                    backgroundColor: randomColor,
                    borderColor: randomColor,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPick();
                  }}
                  disabled={busy}
                >
                  {busy ? "Working…" : `CHOOSE FILES`}
                </Button>

                <div className="text-sm" style={{ color: randomColor }}>
                  <p className="font-medium">{hint}</p>
                </div>
              </div>

              <input
                ref={inputRef}
                type="file"
                multiple
                accept={acceptAttr}
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}