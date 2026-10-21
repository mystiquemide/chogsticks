import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Koulen } from "next/font/google";
import "./globals.css";

const koulen = Koulen({ variable: "--font-koulen", subsets: ["latin"], weight: "400" });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"], weight: "700" });

export const metadata: Metadata = {
  title: "Chogsticks",
  description: "Your Chog gets paid when the internet uses it.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${koulen.variable} ${inter.variable} ${jetbrains.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
