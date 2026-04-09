import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StarRating({ rating, className = '' }: { rating: number; className?: string }) {
  return (
    <div className={cn('flex items-center gap-1', className)} aria-label={`${rating} estrelas`}>
      {Array.from({ length: 5 }).map((_, index) => {
        const active = index < Math.round(rating);
        return (
          <Star
            key={index}
            className={cn(
              'h-4 w-4 transition-transform duration-300',
              active ? 'fill-champagne text-champagne' : 'text-white/25'
            )}
          />
        );
      })}
    </div>
  );
}
