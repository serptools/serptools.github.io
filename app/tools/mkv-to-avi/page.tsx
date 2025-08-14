"use client";

import HeroConverter from "@/components/HeroConverter";

export default function Page() {
  return (
    <HeroConverter
      title="MKV to AVI"
      subtitle="Convert MKV video files to AVI format. Fast, private, in-browser conversion."
      from="mkv"
      to="avi"
    />
  );
}