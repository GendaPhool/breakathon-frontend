import { useEffect } from "react";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import StatsTicker from "@/components/landing/StatsTicker";
import AboutSection from "@/components/landing/AboutSection";
import ModulesSection from "@/components/landing/ModulesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import PointsSystemSection from "@/components/landing/PointsSystemSection";
import LeaderboardPreviewSection from "@/components/landing/LeaderboardPreviewSection";
import MarshalsSection from "@/components/landing/MarshalsSection";
import FAQSection from "@/components/landing/FAQSection";
import FinalCTASection from "@/components/landing/FinalCTASection";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  // Enable smooth in-page anchor scrolling for nav links.
  useEffect(() => {
    const prev = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = prev;
    };
  }, []);

  return (
    <div className="bg-background text-foreground antialiased">
      <Navbar />
      <main>
        <HeroSection />
        <StatsTicker />
        <AboutSection />
        <ModulesSection />
        <HowItWorksSection />
        <PointsSystemSection />
        <LeaderboardPreviewSection />
        <MarshalsSection />
        <FAQSection />
        <FinalCTASection />
      </main>
      <Footer />
    </div>
  );
}
