/// <reference lib="webworker" />
import { decodeToRGBA } from "../lib/convert/decode";
import { encodeFromRGBA } from "../lib/convert/encode";

type RasterJob = { op: "raster"; from: string; to: string; quality?: number; buf: ArrayBuffer };
type PdfJob    = { op: "pdf-pages"; page?: number; to?: string; buf: ArrayBuffer };
type VideoJob  = { op: "video"; from: string; to: string; quality?: number; buf: ArrayBuffer };
type Job = RasterJob | PdfJob | VideoJob;

declare const self: DedicatedWorkerGlobalScope;

self.onmessage = async (e: MessageEvent<Job>) => {
  try {
    const job = e.data;

    if (job.op === "raster") {
      const rgba = await decodeToRGBA(job.from, job.buf);
      const blob = await encodeFromRGBA(job.to, rgba, job.quality ?? 0.85);
      const arr = await blob.arrayBuffer();
      // transfer the ArrayBuffer to avoid copying
      self.postMessage({ ok: true, blob: arr }, [arr]);
      return;
    }

    if (job.op === "pdf-pages") {
      const { renderPdfPages } = await import("../lib/convert/pdf");
      const bufs = await renderPdfPages(job.buf, job.page, job.to);
      self.postMessage({ ok: true, blobs: bufs }, bufs as unknown as Transferable[]);
      return;
    }

    if (job.op === "video") {
      try {
        const { convertVideo } = await import("../lib/convert/video");
        const outputBuffer = await convertVideo(job.buf, job.from, job.to, { quality: job.quality });
        self.postMessage({ ok: true, blob: outputBuffer }, [outputBuffer]);
      } catch (videoErr: any) {
        console.error('Video conversion error:', videoErr);
        self.postMessage({ ok: false, error: `Video conversion failed: ${videoErr?.message || videoErr}` });
      }
      return;
    }

    self.postMessage({ ok: false, error: "Unknown op" });
  } catch (err: any) {
    self.postMessage({ ok: false, error: err?.message || String(err) });
  }
};