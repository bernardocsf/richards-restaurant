'use client';

import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { formatDate, isMondayDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

type Props = {
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  className?: string;
};

const dayLabels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateValue(value?: string) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

function getCalendarDays(monthDate: Date) {
  const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const startWeekDay = start.getDay();
  const totalDays = end.getDate();
  const cells: Array<{ date: Date; inMonth: boolean }> = [];

  for (let index = 0; index < startWeekDay; index += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() - (startWeekDay - index));
    cells.push({ date, inMonth: false });
  }

  for (let day = 1; day <= totalDays; day += 1) {
    cells.push({
      date: new Date(monthDate.getFullYear(), monthDate.getMonth(), day),
      inMonth: true
    });
  }

  while (cells.length % 7 !== 0) {
    const lastDate = cells[cells.length - 1]?.date ?? end;
    const date = new Date(lastDate);
    date.setDate(lastDate.getDate() + 1);
    cells.push({ date, inMonth: false });
  }

  return cells;
}

export function ReservationDatePicker({ value, onChange, onBlur, className }: Props) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const selectedDate = parseDateValue(value);
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => selectedDate ?? today);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedDate) {
      setVisibleMonth(selectedDate);
    }
  }, [selectedDate]);

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

  const monthLabel = new Intl.DateTimeFormat('pt-PT', {
    month: 'long',
    year: 'numeric'
  }).format(visibleMonth);

  const days = getCalendarDays(visibleMonth);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          'flex w-full items-center justify-between rounded-2xl border border-white/10 bg-[#151819] px-4 py-3 text-sm text-ink outline-none transition duration-300 focus:border-champagne/60 focus:ring-2 focus:ring-champagne/15',
          !value && 'text-mist/35',
          className
        )}
      >
        <span>{selectedDate ? formatDate(value!) : 'Seleciona uma data'}</span>
        <CalendarDays className="h-4 w-4 text-champagne" />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 z-20 mt-3 w-full min-w-[18rem] max-w-[22rem] rounded-[1.5rem] border border-white/10 bg-[#151819] p-3 shadow-2xl sm:right-auto sm:p-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
              className="rounded-full border border-white/10 p-2 text-mist/70 transition hover:border-champagne/40 hover:text-champagne"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-semibold capitalize text-ink">{monthLabel}</p>
            <button
              type="button"
              onClick={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
              className="rounded-full border border-white/10 p-2 text-mist/70 transition hover:border-champagne/40 hover:text-champagne"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1.5 text-center text-[10px] uppercase tracking-[0.16em] text-mist/45 sm:gap-2 sm:text-xs sm:tracking-[0.18em]">
            {dayLabels.map((label, index) => (
              <span key={`${label}-${index}`}>{label}</span>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1.5 sm:gap-2">
            {days.map(({ date, inMonth }) => {
              const dateValue = formatDateValue(date);
              const isPast = startOfDay(date) < today;
              const isDisabled = !inMonth || isPast || isMondayDate(dateValue);
              const isSelected = value === dateValue;

              return (
                <button
                  key={`${dateValue}-${inMonth ? 'in' : 'out'}`}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => {
                    onChange(dateValue);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex h-9 items-center justify-center rounded-full text-sm transition sm:h-10',
                    inMonth ? 'text-ink' : 'text-mist/20',
                    isSelected && 'bg-champagne font-semibold text-canvas',
                    !isSelected && !isDisabled && 'hover:bg-white/8',
                    isDisabled && 'cursor-not-allowed bg-white/[0.02] text-mist/20 line-through'
                  )}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <p className="mt-4 text-[11px] leading-6 text-mist/55 sm:text-xs">
            As segundas-feiras aparecem desativadas porque o restaurante está fechado.
          </p>
        </div>
      ) : null}
    </div>
  );
}
