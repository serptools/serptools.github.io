"use client";

import HeroConverter from "@/components/HeroConverter";
import { Navbar } from "@/components/Navbar";

export default function Page() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <HeroConverter title="ARW to JPG" subtitle="Convert Sony ARW RAW files to JPG." from="arw" to="jpg" />
      </main>
    </>
  );
}