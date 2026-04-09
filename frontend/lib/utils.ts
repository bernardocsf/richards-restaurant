import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function euro(price?: number | null) {
  if (price === undefined || price === null) return 'Consultar';
  return new Intl.NumberFormat('pt-PT', {
    minimumFractionDigits: Number.isInteger(price) ? 0 : 2,
    maximumFractionDigits: 2
  }).format(price);
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat('pt-PT', {
    dateStyle: 'medium'
  }).format(new Date(date));
}

export function isMondayDate(value: string) {
  if (!value) return false;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day).getDay() === 1;
}
