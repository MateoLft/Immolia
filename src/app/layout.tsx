import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Immolia — Le logiciel tout-en-un des agents immobiliers",
    template: "%s · Immolia",
  },
  description:
    "Biens, visites, acquéreurs, vendeurs et mandats réunis dans une seule plateforme, avec une IA qui automatise les tâches répétitives.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
