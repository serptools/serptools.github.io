"use client";

import HeroConverter from "@/components/HeroConverter";
import { Navbar } from "@/components/Navbar";

export default function Page() {
  // We currently render pages as PNG from pdf.js worker;
  // if you want real JPG output, change worker to encode JPG instead of PNG.
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <HeroConverter
          title="PDF to JPG"
          subtitle="Convert each PDF page into a JPG. Runs 100% in your browser."
          from="pdf"
          to="png" // use "png" for now; switch to "jpg" after we add JPG encode in pdf.ts
        />
      </main>
    </>
  );
}