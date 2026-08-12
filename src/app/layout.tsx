import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en" className="dark">
      <body className="bg-[#0b0f19] text-slate-100 antialiased selection:bg-indigo-500 selection:text-white overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
