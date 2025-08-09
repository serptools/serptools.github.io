"use client";

import HeroConverter from "@/components/HeroConverter";
import { Navbar } from "@/components/Navbar";

export default function Page() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <HeroConverter title="JFIF to JPEG" subtitle="Convert JFIF images to standard JPEG format." from="jfif" to="jpeg" />
      </main>
    </>
  );
}