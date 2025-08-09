import HeroConverter from "@/components/HeroConverter";

export const metadata = {
  title: "GIF to PNG — SERP Tools",
  description: "Convert GIF to PNG in your browser — fast, private, and free.",
};

export default function Page() {
  return <HeroConverter from="gif" to="png" title="GIF to PNG" />;
}