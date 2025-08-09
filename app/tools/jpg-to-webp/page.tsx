"use client";

import HeroConverter from "@/components/HeroConverter";
import { Navbar } from "@/components/Navbar";

export default function Page() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <HeroConverter title="JPG to WebP" subtitle="Convert JPG images to WebP format." from="jpg" to="webp" />
      </main>
    </>
  );
}