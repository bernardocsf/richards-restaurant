import { Clock3, MapPin, Phone } from 'lucide-react';
import { restaurantInfo } from '@/lib/site-data';
import { OpeningHoursList } from '@/components/opening-hours-list';

export function OpeningHoursCard() {
  return (
    <div className="border-t border-borderSoft pt-6 sm:pt-8">
      <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-champagne">Localização & Contactos</p>
          <div className="mt-6 space-y-6 text-sm leading-7 text-mist/75">
            <div className="flex items-start gap-3 border-b border-borderSoft pb-5">
              <MapPin className="mt-1 h-5 w-5 text-champagne" />
              <p>{restaurantInfo.address}</p>
            </div>
            <div className="flex items-start gap-3 border-b border-borderSoft pb-5">
              <Phone className="mt-1 h-5 w-5 text-champagne" />
              <div>
                <a href={`tel:${restaurantInfo.phonePrimary.replace(/\s+/g, '')}`} className="block transition hover:text-champagne">
                  {restaurantInfo.phonePrimary}
                </a>
                <a href={`tel:${restaurantInfo.phoneSecondary.replace(/\s+/g, '')}`} className="block transition hover:text-champagne">
                  {restaurantInfo.phoneSecondary}
                </a>
              </div>
            </div>
          </div>
        </div>
        <div>
          <p className="flex items-center gap-3 text-sm uppercase tracking-[0.28em] text-champagne">
            <Clock3 className="h-4 w-4" />
            Horário
          </p>
          <OpeningHoursList />
        </div>
      </div>
    </div>
  );
}
