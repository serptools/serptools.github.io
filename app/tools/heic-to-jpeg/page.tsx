import HeroConverter from "@/components/HeroConverter";

export const metadata = {
  title: "HEIC to JPEG — SERP Tools",
  description: "Convert HEIC to JPEG in your browser — fast, private, and free.",
};

export default function Page() {
  return <HeroConverter from="heic" to="jpeg" title="HEIC to JPEG" />;
}