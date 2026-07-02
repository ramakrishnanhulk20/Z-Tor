import { AppHeader } from "@/components/AppHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppHeader />
      <main id="main-content" className="min-h-[calc(100vh-12rem)]">{children}</main>
      <SiteFooter variant="app" />
    </>
  );
}
