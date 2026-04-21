import { Instagram } from 'lucide-react';
import Link from 'next/link';
import { restaurantInfo } from '@/lib/site-data';
import { OpeningHoursList } from '@/components/opening-hours-list';

export function Footer() {
  return (
    <footer className="mt-20 border-t border-borderSoft bg-[linear-gradient(180deg,#0a0d09,#0c1309)]">
      <div className="content-shell grid gap-10 py-14 md:grid-cols-2 xl:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div>
          <p className="font-heading text-2xl text-ink">{restaurantInfo.name}</p>
          <p className="mt-4 max-w-sm text-sm leading-7 text-mist/68">
            Experiência gastronómica cuidada em Lisboa, com grelha, cozinha portuguesa, peixe e secção sushi.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-champagne">Explorar</p>
          <div className="mt-4 space-y-3 text-sm text-mist/70">
            <Link href="/about" className="block transition hover:text-champagne">Sobre</Link>
            <Link href="/menu" className="block transition hover:text-champagne">Menu</Link>
            <Link href="/reservations" className="block transition hover:text-champagne">Reservas</Link>
            <Link href="/reviews" className="block transition hover:text-champagne">Reviews</Link>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-champagne">Contactos</p>
          <div className="mt-4 space-y-3 text-sm leading-7 text-mist/70">
            <p>{restaurantInfo.address}</p>
            <a href={`tel:${restaurantInfo.phonePrimary.replace(/\s+/g, '')}`} className="block transition hover:text-champagne">
              {restaurantInfo.phonePrimary}
            </a>
            <a href={`tel:${restaurantInfo.phoneSecondary.replace(/\s+/g, '')}`} className="block transition hover:text-champagne">
              {restaurantInfo.phoneSecondary}
            </a>
            <a
              href={`https://instagram.com/${restaurantInfo.instagram}`}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-borderSoft transition hover:border-champagne hover:text-champagne"
              aria-label="Instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-champagne">Horário</p>
          <OpeningHoursList variant="footer" />
        </div>
      </div>
      <div className="border-t border-borderSoft px-5 py-5 text-center text-[11px] uppercase tracking-[0.18em] text-mist/40 sm:text-xs sm:tracking-[0.22em]">
        © {new Date().getFullYear()} Richard&apos;s Garden Restaurant. Todos os direitos reservados.
      </div>
    </footer>
  );
}
