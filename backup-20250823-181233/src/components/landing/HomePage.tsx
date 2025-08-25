import { Suspense, lazy } from 'react';
import Header from './Header';
import Hero from './Hero';

// Lazy loading para seções da landing page
const LearningTracks = lazy(() => import('./LearningTracks'));
const CertificationsSection = lazy(() => import('./CertificationsSection'));
const MissionsSection = lazy(() => import('./MissionsSection'));
const PricingPlans = lazy(() => import('./PricingPlans'));
const EnterpriseSection = lazy(() => import('./EnterpriseSection'));
const FinalCTA = lazy(() => import('./FinalCTA'));
const Footer = lazy(() => import('./Footer'));

// Componente de loading para seções da landing
const SectionLoader = () => (
  <div className="flex justify-center py-8">
    <div className="animate-pulse bg-gray-200 h-32 w-full rounded-lg"></div>
  </div>
);

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <Hero />
        <Suspense fallback={<SectionLoader />}>
          <LearningTracks />
        </Suspense>
        <Suspense fallback={<SectionLoader />}>
          <CertificationsSection />
        </Suspense>
        <Suspense fallback={<SectionLoader />}>
          <MissionsSection />
        </Suspense>
        <Suspense fallback={<SectionLoader />}>
          <PricingPlans />
        </Suspense>
        <Suspense fallback={<SectionLoader />}>
          <EnterpriseSection />
        </Suspense>
        <Suspense fallback={<SectionLoader />}>
          <FinalCTA />
        </Suspense>
      </main>
      <Suspense fallback={<SectionLoader />}>
        <Footer />
      </Suspense>
    </div>
  );
}