"use client";

import HeroConverter from "@/components/HeroConverter";

export default function Page() {
  return (
    <HeroConverter
      title="MKV to MP3"
      subtitle="Extract audio from MKV video files to MP3 format. Fast, private, in-browser conversion."
      from="mkv"
      to="mp3"
    />
  );
}