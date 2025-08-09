"use client";

import HeroConverter from "@/components/HeroConverter";
import { Navbar } from "@/components/Navbar";

export default function Page() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <HeroConverter title="JPG to PNG" subtitle="Convert JPG images to PNG with transparency support." from="jpg" to="png" />
      </main>
    </>
  );
}