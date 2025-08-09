"use client";

import HeroConverter from "@/components/HeroConverter";
import { Navbar } from "@/components/Navbar";

export default function Page() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <HeroConverter title="JPG to PDF" subtitle="Convert JPG images to PDF documents." from="jpg" to="pdf" />
      </main>
    </>
  );
}