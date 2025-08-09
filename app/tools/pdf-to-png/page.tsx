import HeroConverter from "@/components/HeroConverter";

export const metadata = {
  title: "PDF to PNG — SERP Tools",
  description: "Convert PDF to PNG in your browser — fast, private, and free.",
};

export default function Page() {
  return <HeroConverter from="pdf" to="png" title="PDF to PNG" />;
}