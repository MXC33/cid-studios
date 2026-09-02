import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { StatusBar } from "@/components/layout/StatusBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CID STUDIOS — Local-First AI Movie Studio",
  description: "Production-grade local AI filmmaking suite with multi-shot directorial scripts, character consistency, and integrated FFmpeg timeline.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#09090b] text-[#fafafa] font-sans selection:bg-[#3b82f6] selection:text-white">
        <Header />
        <main className="flex-1 flex flex-col w-full overflow-x-hidden">
          {children}
        </main>
        <StatusBar />
      </body>
    </html>
  );
}
