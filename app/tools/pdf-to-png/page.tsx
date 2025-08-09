"use client";

import HeroConverter from "@/components/HeroConverter";
import { Navbar } from "@/components/Navbar";

export default function Page() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <HeroConverter title="PDF to PNG" subtitle="No upload. Just convert and download." from="pdf" to="png" />
      </main>
    </>
  );
}