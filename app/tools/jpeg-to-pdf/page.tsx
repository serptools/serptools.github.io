import HeroConverter from "@/components/HeroConverter";

export const metadata = {
  title: "JPG to PDF — SERP Tools",
  description: "Convert JPG to PDF in your browser — fast, private, and free.",
};

export default function Page() {
  return <HeroConverter from="jpg" to="pdf" title="JPG to PDF" />;
}