import HeroConverter from "@/components/HeroConverter";

export const metadata = {
  title: "WEBP to PNG — SERP Tools",
  description: "Convert WEBP images to PNG in your browser.",
};

export default function Page() {
  return <HeroConverter title="WEBP to PNG" from="webp" to="png" />;
}