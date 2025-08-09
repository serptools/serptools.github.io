"use client";

import HeroConverter from "@/components/HeroConverter";
import { Navbar } from "@/components/Navbar";

export default function Page() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <HeroConverter title="PNG Optimizer" subtitle="Compress and optimize PNG files." from="png" to="png" />
      </main>
    </>
  );
}