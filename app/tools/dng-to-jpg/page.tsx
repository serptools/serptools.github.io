"use client";

import HeroConverter from "@/components/HeroConverter";
import { Navbar } from "@/components/Navbar";

export default function Page() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <HeroConverter title="DNG to JPG" subtitle="Convert Adobe DNG RAW files to JPG." from="dng" to="jpg" />
      </main>
    </>
  );
}