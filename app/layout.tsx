import type React from "react";
import type { Metadata } from "next";
import { Inter, Roboto_Mono, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari", "latin"],
  variable: "--font-noto-devanagari",
});

export const metadata: Metadata = {
  title: "Flute Notes - Learn and Practice",
  description:
    "A multilingual flute learning app for structured note-taking with lyrics and notations",
  generator: "v0.app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${robotoMono.variable} ${notoSansDevanagari.variable} antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}
