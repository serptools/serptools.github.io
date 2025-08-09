import HeroConverter from "@/components/HeroConverter";

export const metadata = {
  title: "JPEG to JPG — SERP Tools",
  description: "Convert JPEG to JPG in your browser — fast, private, and free.",
};

export default function Page() {
  return <HeroConverter from="jpeg" to="jpg" title="JPEG to JPG" />;
}