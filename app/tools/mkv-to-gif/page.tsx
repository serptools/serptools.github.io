"use client";

import HeroConverter from "@/components/HeroConverter";

export default function Page() {
  return (
    <HeroConverter
      title="MKV to GIF"
      subtitle="Convert MKV video files to animated GIF. Fast, private, in-browser conversion."
      from="mkv"
      to="gif"
    />
  );
}