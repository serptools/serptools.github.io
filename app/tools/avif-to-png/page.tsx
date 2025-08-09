import HeroConverter from "@/components/HeroConverter";

export const metadata = {
  title: "AVIF to PNG — SERP Tools",
  description: "Convert AVIF to PNG in your browser — fast, private, and free.",
};

export default function Page() {
  return <HeroConverter from="avif" to="png" title="AVIF to PNG" />;
}