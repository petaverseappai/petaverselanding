import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/sections/landing/Hero";
import { Features } from "@/sections/landing/Features";
import { Showcase } from "@/sections/landing/Showcase";
import { PawCareHighlight } from "@/sections/landing/PawCareHighlight";
import { CommunityHighlight } from "@/sections/landing/CommunityHighlight";
import { HowItWorks } from "@/sections/landing/HowItWorks";
import { Waitlist } from "@/sections/landing/Waitlist";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
        <Showcase />
        <PawCareHighlight />
        <CommunityHighlight />
        <HowItWorks />
        <Waitlist />
      </main>
      <Footer />
    </div>
  );
}
