import type { Metadata } from "next";
import { Anton, Hanken_Grotesk, Geist_Mono } from "next/font/google";
import "./globals.css";

// anton is a heavy condensed display face that reads like a broadcast scorebug
const anton = Anton({
  variable: "--font-anton",
  weight: "400",
  subsets: ["latin"],
});

// hanken grotesk is the clean body face that carries everything else
const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
});

// a mono face for tabular stat figures
const mono = Geist_Mono({
  variable: "--font-mono-stat",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Knicks v Spurs | 2026 NBA Finals Predictor",
  description:
    "Three prediction engines simulating the 2026 NBA Finals between the New York Knicks and San Antonio Spurs. Explore win probabilities and play with injuries and minutes.",
  openGraph: {
    title: "Knicks v Spurs | 2026 NBA Finals Predictor",
    description:
      "Three prediction engines simulating the 2026 NBA Finals. Explore win probabilities and play with injuries and minutes.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${hanken.variable} ${anton.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* fixed wooden floor and grid backdrop that shows through the whole page */}
        <div className="floor-backdrop" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
