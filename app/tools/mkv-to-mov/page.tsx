"use client";

import HeroConverter from "@/components/HeroConverter";

export default function Page() {
  return (
    <HeroConverter
      title="MKV to MOV"
      subtitle="Convert MKV video files to QuickTime MOV format. Fast, private, in-browser conversion."
      from="mkv"
      to="mov"
    />
  );
}