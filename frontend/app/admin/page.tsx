import type { Metadata } from 'next';
import { AdminDashboard } from '@/components/admin-dashboard';
import { AnimatedSection } from '@/components/animated-section';

export const metadata: Metadata = {
  title: 'Admin',
  description:
    'Painel de administração para reservas, reviews e métricas simples do Richard\'s Restaurant Grill.',
  robots: {
    index: false,
    follow: false
  }
};

export default function AdminPage() {
  return (
    <div className="pb-8">
      <AnimatedSection>
        <AdminDashboard />
      </AnimatedSection>
    </div>
  );
}
