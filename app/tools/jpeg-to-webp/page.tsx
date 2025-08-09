"use client";

import HeroConverter from "@/components/HeroConverter";
import { Navbar } from "@/components/Navbar";

export default function Page() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <HeroConverter title="JPEG to WebP" subtitle="Convert JPEG images to WebP format." from="jpeg" to="webp" />
      </main>
    </>
  );
}