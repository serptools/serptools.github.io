import HeroConverter from "@/components/HeroConverter";

export const metadata = {
  title: "PDF to JPG — SERP Tools",
  description: "Convert each PDF page into a JPG in your browser.",
};

export default function Page() {
  // We currently render pages as PNG from pdf.js worker;
  // if you want real JPG output, change worker to encode JPG instead of PNG.
  return (
    <HeroConverter
      title="PDF to JPG"
      subtitle="Convert each PDF page into a JPG. Runs 100% in your browser."
      from="pdf"
      to="png" // use "png" for now; switch to "jpg" after we add JPG encode in pdf.ts
    />
  );
}