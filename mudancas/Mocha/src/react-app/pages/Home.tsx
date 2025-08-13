import Header from '../components/Header';
import Hero from '../components/Hero';
import LearningTracks from '../components/LearningTracks';
import CertificationsSection from '../components/CertificationsSection';
import MissionsSection from '../components/MissionsSection';
import PricingPlans from '../components/PricingPlans';
import EnterpriseSection from '../components/EnterpriseSection';
import FinalCTA from '../components/FinalCTA';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <LearningTracks />
      <CertificationsSection />
      <MissionsSection />
      <PricingPlans />
      <EnterpriseSection />
      <FinalCTA />
      <Footer />
    </div>
  );
}
