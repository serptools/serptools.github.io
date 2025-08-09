"use client";

import HeroConverter from "@/components/HeroConverter";
import { Navbar } from "@/components/Navbar";

export default function Page() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <HeroConverter title="GIF to WebP" subtitle="Convert animated GIFs to WebP format." from="gif" to="webp" />
      </main>
    </>
  );
}