import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: "LeadForge AI — B2B Lead Intelligence Platform",
  description: "Discover, analyze, and score potential B2B clients for Tech Harbor's services. Find high-quality leads and enable personalized outreach.",
  keywords: "lead generation, B2B leads, lead intelligence, business development, Tech Harbor",
  openGraph: {
    title: "LeadForge AI",
    description: "B2B Lead Intelligence Platform for Tech Harbor",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
