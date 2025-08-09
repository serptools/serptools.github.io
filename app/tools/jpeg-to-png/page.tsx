import HeroConverter from "@/components/HeroConverter";

export const metadata = {
  title: "JPEG to PNG — SERP Tools",
  description: "Convert JPEG to PNG in your browser — fast, private, and free.",
};

export default function Page() {
  return <HeroConverter from="jpeg" to="png" title="JPEG to PNG" />;
}