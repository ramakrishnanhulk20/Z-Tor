import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter, Source_Serif_4 } from "next/font/google";
import { PhaseBanner } from "@/components/PhaseBanner";
import { ToastProvider } from "@/components/toast/ToastProvider";
import { Web3Provider } from "@/providers/Web3Provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Z-Tor | Private transfers on Ethereum",
  description:
    "Z-Tor is a privacy tool on Ethereum. Shield into confidential cUSDC or cWETH, deposit into a shared pool, keep your secret note, and withdraw later with no public link back to you.",
  icons: {
    icon: [
      { url: "/favicon/favicon.ico", sizes: "any" },
      { url: "/favicon/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [{ url: "/favicon/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/favicon/site.webmanifest",
  appleWebApp: {
    title: "Z-Tor",
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
      className={`${inter.variable} ${sourceSerif.variable} ${plexMono.variable}`}
    >
      <body>
        <Web3Provider>
          <ToastProvider>
            <PhaseBanner />
            {children}
          </ToastProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
