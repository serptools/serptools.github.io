"use client";

import HeroConverter from "@/components/HeroConverter";
import { Navbar } from "@/components/Navbar";

export default function Page() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <HeroConverter title="JFIF to PDF" subtitle="Convert JFIF images to PDF documents." from="jfif" to="pdf" />
      </main>
    </>
  );
}