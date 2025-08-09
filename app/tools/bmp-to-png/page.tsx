"use client";

import HeroConverter from "@/components/HeroConverter";
import { Navbar } from "@/components/Navbar";

export default function Page() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <HeroConverter title="BMP to PNG" subtitle="Convert BMP images to PNG format." from="bmp" to="png" />
      </main>
    </>
  );
}