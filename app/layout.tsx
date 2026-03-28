import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "YouTube Script Analyzer — Reverse-Engineer Viral Videos",
  description:
    "Paste any YouTube script and get a deep strategic breakdown: hooks, audience psychology, viral mechanics, content gaps, and more.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
