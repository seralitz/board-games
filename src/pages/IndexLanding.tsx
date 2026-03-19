import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import LiveTicker from "@/components/LiveTicker";
import GamesSection from "@/components/GamesSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import PanopticonSection from "@/components/PanopticonSection";
import StakesSection from "@/components/StakesSection";
import WaitlistSection from "@/components/WaitlistSection";
import Footer from "@/components/Footer";

const IndexLanding = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <HeroSection />
    <LiveTicker />
    <GamesSection />
    <HowItWorksSection />
    <PanopticonSection />
    <StakesSection />
    <WaitlistSection />
    <Footer />
  </div>
);

export default IndexLanding;
