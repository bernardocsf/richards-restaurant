import type { Metadata } from 'next';
import { AdminDashboard } from '@/components/admin-dashboard';
import { AnimatedSection } from '@/components/animated-section';
import { PageHero } from '@/components/page-hero';

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
    <div className="space-y-12 pb-8">
      <PageHero
        badge="Área admin"
        title="Painel protegido para gerir reservas, reviews e sinais operacionais."
        description="Visual limpo, foco em produtividade e integração direta com o backend Express e MongoDB Atlas."
        image="/images/dining-room.png"
      />

      <AnimatedSection>
        <AdminDashboard />
      </AnimatedSection>
    </div>
  );
}
