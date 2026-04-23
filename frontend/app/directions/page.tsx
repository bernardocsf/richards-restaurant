import { MapPinned, Navigation, Phone } from 'lucide-react';
import type { Metadata } from 'next';
import { AnimatedSection } from '@/components/animated-section';
import { restaurantInfo } from '@/lib/site-data';

export const metadata: Metadata = {
  title: 'Direções',
  description:
    'Localização, mapa, acesso rápido e direções para chegar ao Richard\'s Garden Restaurant em Lisboa.'
};

export default function DirectionsPage() {
  const mapQuery = encodeURIComponent(restaurantInfo.address);

  return (
    <div className="space-y-12 pb-8">
      <AnimatedSection className="grid gap-8 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-borderSoft bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-6 shadow-soft sm:p-7">
            <p className="text-sm uppercase tracking-[0.28em] text-champagne">Como chegar</p>
            <h1 className="mt-4 font-heading text-4xl text-ink">Direções e acesso rápido ao restaurante.</h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-mist/72">
              Tudo o que precisas para chegar sem esforço: localização exata, botão direto para o Google Maps
              e números de contacto prontos a ligar.
            </p>

            <div className="mt-7 space-y-4">
              <div className="rounded-[1.5rem] border border-borderSoft bg-white/[0.03] p-4">
                <div className="flex items-start gap-3">
                  <MapPinned className="mt-0.5 h-5 w-5 text-champagne" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-mist/50">Morada</p>
                    <p className="mt-2 text-sm leading-7 text-ink">{restaurantInfo.address}</p>
                  </div>
                </div>
              </div>

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-3 rounded-[1.4rem] bg-champagne px-5 py-4 text-sm font-semibold text-canvas transition hover:-translate-y-0.5"
              >
                <Navigation className="h-4 w-4" />
                Abrir no Google Maps
              </a>

              <div className="rounded-[1.5rem] border border-borderSoft bg-white/[0.03] p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-5 w-5 text-champagne" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs uppercase tracking-[0.24em] text-mist/50">Contactos para ligar</p>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <a
                        href={`tel:${restaurantInfo.phonePrimary.replace(/\s+/g, '')}`}
                        className="block w-full rounded-[1rem] border border-borderSoft px-4 py-3 text-sm text-ink transition hover:border-champagne/45 hover:text-champagne"
                      >
                        {restaurantInfo.phonePrimary}
                      </a>
                      <a
                        href={`tel:${restaurantInfo.phoneSecondary.replace(/\s+/g, '')}`}
                        className="block w-full rounded-[1rem] border border-borderSoft px-4 py-3 text-sm text-ink transition hover:border-champagne/45 hover:text-champagne"
                      >
                        {restaurantInfo.phoneSecondary}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
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
