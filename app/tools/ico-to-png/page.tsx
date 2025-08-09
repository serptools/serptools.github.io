"use client";

import HeroConverter from "@/components/HeroConverter";
import { Navbar } from "@/components/Navbar";

export default function Page() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <HeroConverter title="ICO to PNG" subtitle="Convert ICO icons to PNG images." from="ico" to="png" />
      </main>
    </>
  );
}