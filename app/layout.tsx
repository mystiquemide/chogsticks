import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Koulen } from "next/font/google";
import { Nav } from "@/components/Nav";
import "./globals.css";

const koulen = Koulen({
  variable: "--font-koulen",
  subsets: ["latin"],
  weight: "400",
});
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: "700",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://chogsticks.vercel.app"),
  title: "Chogsticks",
  description: "Your Chog gets paid when the internet uses it.",
  openGraph: {
    title: "Chogsticks",
    description:
      "Every Chog Genesis NFT is an animated sticker pack. Send it with /chog in Discord, and the holder earns $CHOG on Monad.",
    url: "/",
    siteName: "Chogsticks",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${koulen.variable} ${inter.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <Nav />
        {children}
      </body>
    </html>
  );
}
