"use client";

import HeroConverter from "@/components/HeroConverter";
import { Navbar } from "@/components/Navbar";

export default function Page() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <HeroConverter title="GIF to JPG" subtitle="Extract first frame from GIF as JPG." from="gif" to="jpg" />
      </main>
    </>
  );
}