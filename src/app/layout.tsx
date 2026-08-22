import type { Metadata } from "next";
import { Poppins } from "next/font/google";
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
      <body className={`${poppins.className} bg-[#0b0f19] text-slate-100 antialiased selection:bg-indigo-500 selection:text-white overflow-x-hidden`}>
        {children}
      </body>
    </html>
  );
}
