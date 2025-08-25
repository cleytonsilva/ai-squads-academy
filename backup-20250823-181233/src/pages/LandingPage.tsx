import Header from '@/components/landing/Header';
import Hero from '@/components/landing/Hero';
import LearningTracks from '@/components/landing/LearningTracks';
import CertificationsSection from '@/components/landing/CertificationsSection';
import MissionsSection from '@/components/landing/MissionsSection';
import PricingPlans from '@/components/landing/PricingPlans';
import EnterpriseSection from '@/components/landing/EnterpriseSection';
import FinalCTA from '@/components/landing/FinalCTA';
import Footer from '@/components/landing/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirecionar usuários logados para o dashboard apropriado
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  // Se o usuário está logado, não mostrar a landing page
  if (user) {
    return null;
  }

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