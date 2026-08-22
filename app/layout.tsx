import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Medora — Your Health Deserves The Best Care",
    template: "%s — Medora",
  },
  description:
    "Get genuine medicines delivered safely to your doorstep — with trusted quality, expert guidance, and care you can rely on.",
  keywords: [
    "online pharmacy", "medicine delivery", "prescription medicines",
    "vitamins", "healthcare", "pharmacy", "Medora",
  ],
  openGraph: {
    type: "website",
    siteName: "Medora",
    title: "Medora — Care, delivered",
    description:
      "Licensed online pharmacy — genuine medicines, pharmacist-verified orders and doorstep delivery.",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "Medora — Care, delivered",
    description: "Licensed online pharmacy — genuine medicines, delivered to your doorstep.",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,400;1,9..144,500;1,9..144,600&family=Manrope:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
