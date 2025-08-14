"use client";

import HeroConverter from "@/components/HeroConverter";

export default function Page() {
  return (
    <HeroConverter
      title="MKV to WAV"
      subtitle="Extract audio from MKV video files to WAV format. Fast, private, in-browser conversion."
      from="mkv"
      to="wav"
    />
  );
}