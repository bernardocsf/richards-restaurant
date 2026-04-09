'use client';

import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  value?: string;
  options: Array<{ time: string }>;
  disabled?: boolean;
  loading?: boolean;
  onChange: (value: string) => void;
  onBlur?: () => void;
};

export function ReservationTimePicker({ value, options, disabled, loading, onChange, onBlur }: Props) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
        onBlur?.();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onBlur]);

  useEffect(() => {
    if (disabled) {
      setOpen(false);
    }
  }, [disabled]);

  const label = loading
    ? 'A carregar...'
    : !options.length
      ? 'Sem horários disponíveis'
      : value || 'Seleciona uma hora';

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setOpen((current) => !current);
          }
        }}
        className={cn(
          'flex w-full items-center justify-between rounded-2xl border border-white/10 bg-[#151819] px-4 py-3 text-sm text-ink outline-none transition duration-300 focus:border-champagne/60 focus:ring-2 focus:ring-champagne/15',
          !value && 'text-mist/55',
          disabled && 'cursor-not-allowed opacity-70'
        )}
      >
        <span>{label}</span>
        <ChevronDown className={cn('h-4 w-4 text-champagne transition', open && 'rotate-180')} />
      </button>

      {open ? (
        <div className="absolute left-0 z-20 mt-3 max-h-64 w-full overflow-y-auto rounded-[1.25rem] border border-white/10 bg-[#151819] p-2 shadow-2xl">
          {options.map((slot) => (
            <button
              key={slot.time}
              type="button"
              onClick={() => {
                onChange(slot.time);
                setOpen(false);
              }}
              className={cn(
                'w-full rounded-xl px-4 py-3 text-left text-sm text-ink transition hover:bg-white/8',
                value === slot.time && 'bg-champagne text-canvas hover:bg-champagne'
              )}
            >
              {slot.time}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
