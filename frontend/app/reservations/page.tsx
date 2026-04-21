import type { Metadata } from 'next';
import Link from 'next/link';
import { AnimatedSection } from '@/components/animated-section';
import { OpeningHoursCard } from '@/components/opening-hours-card';
import { ReservationForm } from '@/components/reservation-form';

export const metadata: Metadata = {
  title: 'Reservas',
  description:
    'Reserva mesa online no Richard\'s Restaurant Grill com horários válidos, disponibilidade real e confirmação automática.'
};

export default function ReservationsPage() {
  return (
    <div className="space-y-12 pb-8">
      <AnimatedSection className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <ReservationForm />
        <div className="space-y-6">
          <div className="border-t border-borderSoft pt-6">
            <p className="text-sm uppercase tracking-[0.28em] text-champagne">Notas de serviço</p>
            <h2 className="mt-4 font-heading text-3xl text-ink">Pedido enviado, equipa informada.</h2>
            <p className="mt-4 text-sm leading-7 text-mist/72">
              As reservas online são confirmadas automaticamente quando existe capacidade disponível na zona escolhida. O sistema trabalha com lotação por zona, horários reais e uma margem operacional para manter o serviço simples no dia a dia.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/contact" className="rounded-full border border-borderSoft px-5 py-3 text-sm text-mist/80 transition hover:border-champagne/45 hover:text-champagne">
                Ver contactos
              </Link>
              <a href="tel:+351218537101" className="rounded-full bg-champagne px-5 py-3 text-sm font-semibold text-canvas transition hover:-translate-y-0.5">
                Ligar agora
              </a>
            </div>
          </div>
          <OpeningHoursCard />
        </div>
      </AnimatedSection>
    </div>
  );
}
