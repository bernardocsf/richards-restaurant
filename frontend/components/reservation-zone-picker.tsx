'use client';

import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type Option = {
  value: string;
  label: string;
};

type Props = {
  value?: string;
  options: Option[];
  onChange: (value: string) => void;
  onBlur?: () => void;
};

export function ReservationZonePicker({ value, options, onChange, onBlur }: Props) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((option) => option.value === value);

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

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          'flex w-full items-center justify-between rounded-2xl border border-white/10 bg-[#151819] px-4 py-3 text-sm text-ink outline-none transition duration-300 focus:border-champagne/60 focus:ring-2 focus:ring-champagne/15',
          !selectedOption && 'text-mist/55'
        )}
      >
        <span>{selectedOption?.label ?? 'Seleciona uma zona'}</span>
        <ChevronDown className={cn('h-4 w-4 text-champagne transition', open && 'rotate-180')} />
      </button>

      {open ? (
        <div className="absolute left-0 z-20 mt-3 w-full rounded-[1.25rem] border border-white/10 bg-[#151819] p-2 shadow-2xl">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={cn(
                'flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm text-ink transition hover:bg-white/8',
                value === option.value && 'bg-champagne text-canvas hover:bg-champagne'
              )}
            >
              <span>{option.label}</span>
              <Check className={cn('h-4 w-4 opacity-0', value === option.value && 'opacity-100')} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
