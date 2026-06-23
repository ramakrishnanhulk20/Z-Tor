import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shield tokens | Z-Tor",
  description:
    "Mint test WETH or USDC, shield into confidential cWETH or cUSDC, and decrypt your encrypted ERC-7984 balance in your browser.",
};

export default function ShieldLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
