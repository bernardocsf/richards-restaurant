import type { Metadata } from 'next';
import { AnimatedSection } from '@/components/animated-section';
import { PageHero } from '@/components/page-hero';

export const metadata: Metadata = {
  title: 'Sobre o restaurante',
  description:
    'Conhece o conceito, o ambiente e a proposta do Richard\'s Restaurant Grill em Lisboa.'
};

export default function AboutPage() {
  return (
    <div className="space-y-12 pb-8">
      <PageHero
        badge="Sobre o restaurante"
        title="Uma casa pensada para serviço atento, conforto e uma carta abrangente."
        description="O Richard's Garden Restaurant combina uma sala acolhedora com uma proposta contemporânea que cruza grelhados, peixe, pratos portugueses, massas, saladas, sobremesas e sushi."
        image="/images/mural-room.png"
      />

      <AnimatedSection className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="py-2 sm:py-4">
          <span className="text-xs uppercase tracking-[0.3em] text-champagne">História da experiência</span>
          <h2 className="mt-4 font-heading text-4xl text-ink">Pensado para almoço, jantar e momentos de partilha.</h2>
          <p className="mt-5 text-base leading-8 text-mist/72">
            A identidade do restaurante assenta num equilíbrio claro entre sofisticação e proximidade. O objetivo é oferecer um serviço atencioso, uma apresentação cuidada e um menu suficientemente versátil para acolher almoços executivos, jantares descontraídos e celebrações especiais.
          </p>
          <p className="mt-5 text-base leading-8 text-mist/72">
            O espaço privilegia materiais escuros, detalhes quentes, luz natural e composição visual gastronómica. Esta linguagem cria uma atmosfera confortável, distinta e contemporânea.
          </p>
        </div>

        <div className="border-t border-borderSoft pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <div className="grid gap-5 sm:grid-cols-2">
          {[
            ['Posicionamento', 'Tom acolhedor, visual editorial e atenção aos detalhes sem excesso visual.'],
            ['Gastronomia', 'Cozinha europeia e portuguesa com toques internacionais e secção sushi.'],
            ['Serviço', 'Atendimento atento, experiência de mesa e takeout preparado.'],
            ['Ambiente', 'Ideal para refeições prolongadas, encontros e experiências gastronómicas de valor.']
          ].map(([title, description]) => (
            <article key={title} className="border-b border-white/8 pb-5 last:border-b-0 last:pb-0">
              <h3 className="font-heading text-2xl text-ink">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-mist/72">{description}</p>
            </article>
          ))}
          </div>
        </div>
      </AnimatedSection>
    </div>
  );
}
