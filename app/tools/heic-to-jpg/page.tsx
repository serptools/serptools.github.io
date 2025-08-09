import HeroConverter from "@/components/HeroConverter";

export const metadata = {
  title: "HEIC to JPG — SERP Tools",
  description: "Convert HEIC photos to JPG privately, in your browser.",
};

export default function Page() {
  return <HeroConverter title="HEIC to JPG" subtitle="No upload. Just convert and download." from="heic" to="jpg" />;
}