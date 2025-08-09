"use client";

import HeroConverter from "@/components/HeroConverter";
import { Navbar } from "@/components/Navbar";

export default function Page() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <HeroConverter title="WEBP to PNG" subtitle="Convert WEBP images to PNG in your browser." from="webp" to="png" />
      </main>
    </>
  );
}