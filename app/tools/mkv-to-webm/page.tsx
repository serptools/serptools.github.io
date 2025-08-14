"use client";

import HeroConverter from "@/components/HeroConverter";

export default function Page() {
  return (
    <HeroConverter
      title="MKV to WebM"
      subtitle="Convert MKV video files to WebM format. Fast, private, in-browser conversion."
      from="mkv"
      to="webm"
    />
  );
}