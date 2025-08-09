import HeroConverter from "@/components/HeroConverter";

export const metadata = {
  title: "JPG to SVG — SERP Tools",
  description: "Convert JPG to SVG in your browser — fast, private, and free.",
};

export default function Page() {
  return <HeroConverter from="jpg" to="svg" title="JPG to SVG" />;
}