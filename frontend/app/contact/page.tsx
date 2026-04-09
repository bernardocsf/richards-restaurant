import { Instagram } from 'lucide-react';
import type { Metadata } from 'next';
import { AnimatedSection } from '@/components/animated-section';
import { OpeningHoursCard } from '@/components/opening-hours-card';
import { restaurantInfo } from '@/lib/site-data';

export const metadata: Metadata = {
  title: 'Contactos',
  description:
    'Morada, telefones, horário, mapa e acesso rápido ao Richard\'s Garden Restaurant em Lisboa.'
};

export default function ContactPage() {
  const mapQuery = encodeURIComponent(restaurantInfo.address);

  return (
    <div className="space-y-12 pb-8">
      <AnimatedSection className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <OpeningHoursCard />
          <div className="border-t border-borderSoft pt-6">
            <p className="text-sm uppercase tracking-[0.28em] text-champagne">Ações rápidas</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={`tel:${restaurantInfo.phonePrimary.replace(/\s+/g, '')}`} className="rounded-full bg-champagne px-5 py-3 text-sm font-semibold text-canvas transition hover:-translate-y-0.5">
                Ligar agora
              </a>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-borderSoft px-5 py-3 text-sm font-semibold text-mist/80 transition hover:border-champagne/45 hover:text-champagne"
              >
                Obter direções
              </a>
              <a
                href={`https://instagram.com/${restaurantInfo.instagram}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-[46px] w-[46px] items-center justify-center rounded-full border border-borderSoft text-mist/80 transition hover:border-champagne/45 hover:text-champagne"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-borderSoft shadow-soft">
          <iframe
            title="Mapa do Richard's Garden Restaurant"
            src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
            className="h-[560px] w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </AnimatedSection>
    </div>
  );
}
