import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "College Admission CRM | Counselor Dashboard",
  description: "Production-ready College Admission CRM for tracking student recruitment, applications, 10th/12th marks, document verification, and counselor task follow-ups.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${poppins.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,600&display=swap" rel="stylesheet" />
      </head>
      <body className={`${poppins.className} bg-[#0b0f19] text-slate-100 antialiased selection:bg-indigo-500 selection:text-white overflow-x-hidden font-sans`}>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
