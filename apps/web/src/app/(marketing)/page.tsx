import { CtaBanner } from "@/components/home/CtaBanner";
import { Features } from "@/components/home/Features";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Manifesto } from "@/components/home/Manifesto";
import { PoolsShowcase } from "@/components/home/PoolsShowcase";
import { PrivacyLayers } from "@/components/home/PrivacyLayers";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Manifesto />
      <HowItWorks />
      <PrivacyLayers />
      <Features />
      <PoolsShowcase />
      <CtaBanner />
    </>
  );
}
