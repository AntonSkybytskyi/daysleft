import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "daysleft",
  description: "Track visa day-counts and plan visa runs",
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
