"use client";

import HeroConverter from "@/components/HeroConverter";
import { Navbar } from "@/components/Navbar";

export default function Page() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <HeroConverter title="HEIF to PNG" subtitle="Convert HEIF images to PNG format." from="heif" to="png" />
      </main>
    </>
  );
}