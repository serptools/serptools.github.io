"use client";

import HeroConverter from "@/components/HeroConverter";
import { Navbar } from "@/components/Navbar";

export default function Page() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <HeroConverter title="GIF to PNG" subtitle="No upload. Just convert and download." from="gif" to="png" />
      </main>
    </>
  );
}