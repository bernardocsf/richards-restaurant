import type { Metadata } from 'next';
import { AnimatedSection } from '@/components/animated-section';
import { MenuBrowser } from '@/components/menu-browser';

export const metadata: Metadata = {
  title: 'Menu',
  description:
    'Explora o menu do Richard\'s Restaurant Grill com peixe, especialidades da casa, carnes, massas, saladas, sobremesas e sushi.'
};

export default function MenuPage() {
  return (
    <div className="space-y-12 pb-8">
      <AnimatedSection>
        <MenuBrowser />
      </AnimatedSection>
    </div>
  );
}
