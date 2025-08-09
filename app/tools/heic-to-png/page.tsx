import HeroConverter from "@/components/HeroConverter";

export const metadata = {
  title: "HEIC to PNG — SERP Tools",
  description: "Convert HEIC to PNG in your browser — fast, private, and free.",
};

export default function Page() {
  return <HeroConverter from="heic" to="png" title="HEIC to PNG" />;
}