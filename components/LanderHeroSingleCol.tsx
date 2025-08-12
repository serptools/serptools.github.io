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
};

export default function LanderHeroSingleCol({
  title,
  subtitle = "Fast, private, in-browser conversion.",
  from,
  to,
  accept,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropRef = useRef<HTMLDivElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState("or drop files here");
  const [dropEffect, setDropEffect] = useState<string>("");
  const [randomColor] = useState(() => {
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
    return colors[Math.floor(Math.random() * colors.length)];
  });

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
          const blob = new Blob([ev.data.blob], { type: to === "png" ? "image/png" : "image/jpeg" });
          const name = file.name.replace(/\.[^.]+$/, "") + "." + to;
          saveBlob(blob, name);
          resolve();
        };
        const op = from === "pdf" ? "pdf-pages" : "raster";
        w.postMessage(op === "raster"
          ? { op, from, to, buf }
          : { op, buf }, // pdf -> png pages
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
    
    // Trigger random fun effect
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
    const randomEffect = effects[Math.floor(Math.random() * effects.length)];
    setDropEffect(randomEffect);
    
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
      <div className="mx-auto max-w-7xl px-6 py-8 text-center">
        <div
          ref={dropRef}
          onDragEnter={onDrag}
          onDragOver={onDrag}
          onDragLeave={onDrag}
          onDrop={onDrop}
          className={`mt-8 mx-auto max-w-6xl border-2 border-dashed rounded-2xl p-12 hover:border-opacity-80 transition-colors cursor-pointer ${
            dropEffect ? `animate-${dropEffect}` : ""
          }`}
          style={{
            backgroundColor: randomColor + "15", // 15 is ~8% opacity
            borderColor: randomColor,
          }}
          onClick={onPick}
        >
          <div className="flex flex-col items-center space-y-6">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{title}</h1>
            
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
    </section>
  );
}