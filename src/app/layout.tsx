import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SPHEREX | College Admission CRM",
  description: "SPHEREX - Production-ready College Admission CRM for tracking student recruitment, applications, 10th/12th marks, document verification, and counselor task follow-ups.",
  icons: {
    icon: "/spherex-logo.png",
    shortcut: "/favicon.png",
    apple: "/spherex-logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable}`}>
      <body className={`${dmSans.className} bg-paper text-graphite antialiased selection:bg-ember/20 selection:text-obsidian overflow-x-hidden font-sans`}>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
