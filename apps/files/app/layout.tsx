import { AppLayout } from "@serp-tools/app-core/components/app-layout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Serp Files",
  description: "Description of Serp Files",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppLayout>{children}</AppLayout>;
}
