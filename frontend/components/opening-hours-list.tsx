'use client';

import { openingHours } from '@/lib/site-data';
import { cn } from '@/lib/utils';

type Props = {
  variant?: 'footer' | 'card';
};

const dayIndexByLabel: Record<string, number> = {
  Domingo: 0,
  Segunda: 1,
  Terça: 2,
  Quarta: 3,
  Quinta: 4,
  Sexta: 5,
  Sábado: 6
};

export function OpeningHoursList({ variant = 'card' }: Props) {
  const todayIndex = new Date().getDay();
  const orderedHours = [
    ...openingHours.slice(todayIndex),
    ...openingHours.slice(0, todayIndex)
  ];

  if (variant === 'footer') {
    return (
      <div className="mt-4 space-y-2 text-sm leading-7 text-mist/70">
        {orderedHours.map((entry) => {
          const isToday = dayIndexByLabel[entry.day] === todayIndex;

          return (
            <p
              key={entry.day}
              className={cn(
                'rounded-xl px-2 py-1 transition',
                isToday && 'bg-[rgba(94,145,35,0.14)] text-ink'
              )}
            >
              <span className={cn('font-medium text-ink', isToday && 'text-champagne')}>{entry.day}:</span> {entry.hours}
            </p>
          );
        })}
      </div>
    );
  }

  return (
    <div className="mt-5 space-y-3 text-sm text-mist/78">
      {orderedHours.map((entry) => {
        const isToday = dayIndexByLabel[entry.day] === todayIndex;

        return (
          <div
            key={entry.day}
            className={cn(
              'flex flex-col gap-1 border-b border-borderSoft pb-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4',
              isToday && 'rounded-2xl border border-[rgba(170,255,80,0.18)] bg-[rgba(94,145,35,0.12)] px-4 py-3'
            )}
          >
            <span className={cn('font-medium text-ink', isToday && 'text-champagne')}>{entry.day}</span>
            <span className="text-left sm:text-right">{entry.hours}</span>
          </div>
        );
      })}
    </div>
  );
}
