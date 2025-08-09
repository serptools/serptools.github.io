"use client";

import { useRef, useState } from "react";
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
    setHint("Converting…");
    handleFiles(e.dataTransfer.files).finally(() => setHint("or drop files here"));
  }

  const acceptAttr =
    accept ??
    (from === "pdf" ? ".pdf"
     : from === "jpg" ? ".jpg,.jpeg"
     : from === "jpeg" ? ".jpeg,.jpg"
     : `.${from}`);

  return (
    <section className="min-h-[70vh] w-full bg-white">
      <div className="mx-auto max-w-3xl px-6 pt-16 text-center">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-3 text-muted-foreground">{subtitle}</p>

        <div
          ref={dropRef}
          onDragEnter={onDrag}
          onDragOver={onDrag}
          onDragLeave={onDrag}
          onDrop={onDrop}
          className="mt-10 flex flex-col items-center"
        >
          <Button
            size="lg"
            className="h-14 px-8 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-lg"
            onClick={onPick}
            disabled={busy}
          >
            {busy ? "Working…" : `Select ${from.toUpperCase()} files`}
          </Button>

          <input
            ref={inputRef}
            type="file"
            multiple
            accept={acceptAttr}
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          <div className="mt-3 text-xs text-muted-foreground">{hint}</div>
        </div>
      </div>
    </section>
  );
}