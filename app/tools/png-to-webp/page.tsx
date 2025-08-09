"use client";

import HeroConverter from "@/components/HeroConverter";
import { Navbar } from "@/components/Navbar";

export default function Page() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <HeroConverter title="PNG to WebP" subtitle="Convert PNG images to WebP format." from="png" to="webp" />
      </main>
    </>
  );
}