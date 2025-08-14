"use client";

import HeroConverter from "@/components/HeroConverter";

export default function Page() {
  return (
    <HeroConverter
      title="MKV to OGG"
      subtitle="Extract audio from MKV video files to OGG Vorbis format. Fast, private, in-browser conversion."
      from="mkv"
      to="ogg"
    />
  );
}