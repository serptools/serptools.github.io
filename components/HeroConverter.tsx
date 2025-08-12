"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { saveBlob } from "@/components/saveAs"; // you already added this earlier

type Props = {
  title: string;              // e.g., "PDF to JPG"
  subtitle?: string;          // e.g., "Convert each PDF page into a JPG…"
  from: string;               // "pdf"
  to: string;                 // "jpg"
  accept?: string;            // optional override accept attr
};

export default function HeroConverter({
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
    <section className="min-h-[60vh] w-full bg-white">
      <div className="mx-auto max-w-4xl px-6 pt-12 pb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-3 text-muted-foreground">{subtitle}</p>

        <div
          ref={dropRef}
          onDragEnter={onDrag}
          onDragOver={onDrag}
          onDragLeave={onDrag}
          onDrop={onDrop}
          className={`mt-8 mx-auto max-w-2xl border-2 border-dashed border-gray-300 rounded-2xl p-12 hover:border-gray-400 transition-colors cursor-pointer bg-gray-50/50 ${
            dropEffect ? `animate-${dropEffect}` : ""
          }`}
          onClick={onPick}
        >
          <div className="flex flex-col items-center space-y-6">
            <svg
              className="w-16 h-16 text-gray-400"
              fill="none"
              stroke="currentColor"
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
              className="h-14 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                onPick();
              }}
              disabled={busy}
            >
              {busy ? "Working…" : `Select ${from.toUpperCase()} files`}
            </Button>

            <div className="text-sm text-muted-foreground">
              <p className="font-medium">{hint}</p>
              <p className="mt-1 text-xs">or click anywhere in this box</p>
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