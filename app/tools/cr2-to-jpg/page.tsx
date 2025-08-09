"use client";

import HeroConverter from "@/components/HeroConverter";
import { Navbar } from "@/components/Navbar";

export default function Page() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <HeroConverter title="CR2 to JPG" subtitle="Convert Canon CR2 RAW files to JPG." from="cr2" to="jpg" />
      </main>
    </>
  );
}