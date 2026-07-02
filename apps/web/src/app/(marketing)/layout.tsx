import { MarketingHeader } from "@/components/MarketingHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <MarketingHeader />
      <main id="main-content" className="min-h-[calc(100vh-12rem)]">{children}</main>
      <SiteFooter variant="marketing" />
    </>
  );
}
