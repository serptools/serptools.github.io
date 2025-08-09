"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Upload, Trash2, Image as ImageIcon, FileImage, File as FileIcon, Loader2 } from "lucide-react";
import { saveBlob } from "./saveAs";

type ConvertProps = {
  title: string;              // "HEIC to JPG"
  from: string;               // "heic"
  to: string;                 // "jpg"
  description?: string;       // optional subtitle
  accepts?: string[];         // override accepted extensions
  qualityDefault?: number;    // 0..100 for lossy
};

type Item = {
  id: string;
  file: File;
  status: "queued" | "converting" | "done" | "error";
  message?: string;
};

function extAccept(from: string, extra?: string[]) {
  const map: Record<string, string[]> = {
    heic: [".heic", ".heif"],
    jpeg: [".jpeg", ".jpg"],
    jpg:  [".jpg", ".jpeg"],
    png:  [".png"],
    webp: [".webp"],
    gif:  [".gif"],
    bmp:  [".bmp"],
    pdf:  [".pdf"],
    ico:  [".ico"],
    avif: [".avif"],
    svg:  [".svg"],
    tiff: [".tif", ".tiff"],
  };
  const base = map[from?.toLowerCase()] || ["." + from];
  return [...base, ...(extra || [])].join(",");
}

export default function Converter({
  title,
  from,
  to,
  description = "Fast, private, in-browser conversion. No upload.",
  accepts,
  qualityDefault = 85,
}: ConvertProps) {
  const workerRef = useRef<Worker | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [quality, setQuality] = useState<number>(qualityDefault);
  const [busy, setBusy] = useState(false);
  const [overall, setOverall] = useState(0);

  const acceptAttr = useMemo(
    () => (accepts ? accepts.map(a => (a.startsWith(".") ? a : "." + a)).join(",") : extAccept(from)),
    [from, accepts]
  );

  function ensureWorker() {
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL("../workers/convert.worker.ts", import.meta.url), { type: "module" });
    }
    return workerRef.current;
  }

  const onDrop = useCallback((files: FileList | null | File[]) => {
    const arr = (files instanceof FileList) ? Array.from(files) : (files || []);
    if (!arr.length) return;
    setItems(prev => [
      ...prev,
      ...arr.map((f) => ({
        id: `${f.name}-${f.size}-${f.lastModified}-${crypto.randomUUID()}`,
        file: f,
        status: "queued" as const,
      })),
    ]);
  }, []);

  function removeItem(id: string) {
    setItems(prev => prev.filter(x => x.id !== id));
  }

  function clearAll() {
    setItems([]);
    setOverall(0);
  }

  async function convertAll() {
    if (!items.length) return;
    setBusy(true);
   