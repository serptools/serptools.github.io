"use client";

import HeroConverter from "@/components/HeroConverter";

export default function Page() {
  return (
    <HeroConverter
      title="MKV to MP4"
      subtitle="Convert MKV video files to MP4 format. Fast, private, in-browser conversion."
      from="mkv"
      to="mp4"
    />
  );
}