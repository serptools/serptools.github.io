"use client";

import HeroConverter from "@/components/HeroConverter";
import { Navbar } from "@/components/Navbar";

export default function Page() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <HeroConverter title="CR3 to JPG" subtitle="Convert Canon CR3 RAW files to JPG." from="cr3" to="jpg" />
      </main>
    </>
  );
}