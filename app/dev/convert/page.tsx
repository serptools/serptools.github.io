"use client";

import { useRef, useState } from "react";

export default function DevConvert() {
  const workerRef = useRef<Worker | null>(null);
  const [log, setLog] = useState<string>("");

  function ensureWorker() {
    if (!workerRef.current) {
      // relative from this file to /workers/convert.worker.ts
      workerRef.current = new Worker(
        new URL("../../../workers/convert.worker.ts", import.meta.url),
        { type: "module" }
      );
    }
    return workerRef.current;
  }

  async function runRaster(e: React.ChangeEvent<HTMLInputElement>, from: string, to: string) {
    const files = e.target.files;
    if (!files?.length) return;
    const w = ensureWorker();
    const f = files[0];
    const buf = await f.arrayBuffer();
    setLog(`Converting ${f.name} (${from} → ${to})...`);

    w.onmessage = (ev: MessageEvent<any>) => {
      if (!ev.data?.ok) { setLog("Error: " + ev.data?.error); return; }
      const out = new Blob([ev.data.blob]);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(out);
      a.download = f.name.replace(/\.[^.]+$/, "") + "." + to;
      a.click();
      setLog("Done");
    };

    w.postMessage({ op: "raster", from, to, buf }, [buf]);
  }

  async function runPdf(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    const w = ensureWorker();
    const f = files[0];
    const buf = await f.arrayBuffer();
    setLog(`Rendering PDF pages for ${f.name}...`);

    w.onmessage = (ev: MessageEvent<any>) => {
      if (!ev.data?.ok) { setLog("Error: " + ev.data?.error); return; }
      const blobs: ArrayBuffer[] = ev.data.blobs;
      blobs.forEach((ab, i) => {
        const b = new Blob([ab], { type: "image/png" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(b);
        a.download = `${f.name.replace(/\.[^.]+$/, "")}-${i + 1}.png`;
        a.click();
      });
      setLog("Done");
    };

    w.postMessage({ op: "pdf-pages", buf }, [buf]);
  }

  return (
    <main className="p-6 max-w-xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold">Dev Convert (headless)</h1>

      <label className="block">
        <span className="block mb-1">HEIC → JPG</span>
        <input type="file" accept=".heic,.heif" onChange={(e)=>runRaster(e,"heic","jpg")} />
      </label>

      <label className="block">
        <span className="block mb-1">WEBP → PNG</span>
        <input type="file" accept=".webp" onChange={(e)=>runRaster(e,"webp","png")} />
      </label>

      <label className="block">
        <span className="block mb-1">JPG → WEBP</span>
        <input type="file" accept=".jpg,.jpeg" onChange={(e)=>runRaster(e,"jpg","webp")} />
      </label>

      <label className="block">
        <span className="block mb-1">PDF → PNG (all pages)</span>
        <input type="file" accept=".pdf" onChange={runPdf} />
      </label>

      <p className="text-sm opacity-70">{log}</p>
    </main>
  );
}