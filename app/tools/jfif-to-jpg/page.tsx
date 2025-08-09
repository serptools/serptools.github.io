import HeroConverter from "@/components/HeroConverter";

export const metadata = {
  title: "JFIF to JPG — SERP Tools",
  description: "Convert JFIF to JPG in your browser — fast, private, and free.",
};

export default function Page() {
  return <HeroConverter from="jfif" to="jpg" title="JFIF to JPG" />;
}