import { Clock3, MapPin, Phone } from 'lucide-react';
import { openingHours, restaurantInfo } from '@/lib/site-data';

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
          <div className="mt-5 space-y-3 text-sm text-mist/78">
            {openingHours.map((entry) => (
              <div key={entry.day} className="flex flex-col gap-1 border-b border-borderSoft pb-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <span className="font-medium text-ink">{entry.day}</span>
                <span className="text-left sm:text-right">{entry.hours}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
