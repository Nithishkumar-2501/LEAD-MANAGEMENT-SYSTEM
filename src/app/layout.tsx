import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-inter",
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
    <html lang="en" className={`dark ${inter.variable}`} suppressHydrationWarning>
      <body className={`${inter.className} bg-slate-50 text-slate-900 dark:bg-[#070a14] dark:text-slate-100 antialiased selection:bg-indigo-500 selection:text-white overflow-x-hidden font-sans transition-colors duration-200`}>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
