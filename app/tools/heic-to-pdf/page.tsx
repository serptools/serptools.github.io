import HeroConverter from "@/components/HeroConverter";

export const metadata = {
  title: "HEIC to PDF — SERP Tools",
  description: "Convert HEIC to PDF in your browser — fast, private, and free.",
};

export default function Page() {
  return <HeroConverter from="heic" to="pdf" title="HEIC to PDF" />;
}