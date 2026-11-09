/**
 * layout.tsx
 * ----------
 * Root layout for the Next.js App Router. Wraps every page.
 * Defines <html>/<body> and basic page metadata.
 */
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EventHub",
  description: "Event ticketing & booking platform",
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
