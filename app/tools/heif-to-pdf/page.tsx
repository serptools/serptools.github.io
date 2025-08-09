"use client";

import HeroConverter from "@/components/HeroConverter";
import { Navbar } from "@/components/Navbar";

export default function Page() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <HeroConverter title="HEIF to PDF" subtitle="Convert HEIF images to PDF documents." from="heif" to="pdf" />
      </main>
    </>
  );
}