"use client";

import HeroConverter from "@/components/HeroConverter";
import { Navbar } from "@/components/Navbar";

export default function Page() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <HeroConverter title="AVIF to JPEG" subtitle="Convert AVIF images to JPEG format." from="avif" to="jpeg" />
      </main>
    </>
  );
}