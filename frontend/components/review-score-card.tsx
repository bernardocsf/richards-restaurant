'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchReviews } from '@/lib/api';
import { StarRating } from '@/components/star-rating';

type Review = {
  _id: string;
  rating: number;
};

export function ReviewScoreCard() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadReviews() {
      try {
        const response = await fetchReviews();
        if (mounted) {
          setReviews(response.reviews as Review[]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadReviews();
    return () => {
      mounted = false;
    };
  }, []);

  const metrics = useMemo(() => {
    if (!reviews.length) {
      return {
        rating: 0,
        total: 0
      };
    }

    const ratingSum = reviews.reduce((sum, review) => sum + review.rating, 0);
    const total = reviews.length;
    const average = ratingSum / total;

    return {
      rating: Number(average.toFixed(1)),
      total
    };
  }, [reviews]);

  return (
    <div className="mt-6 rounded-[24px] border border-borderSoft bg-[rgba(84,121,31,0.08)] p-5 text-center sm:mt-8 sm:rounded-[28px] sm:p-7 sm:text-left">
      <p className="text-xs uppercase tracking-[0.28em] text-champagne sm:text-sm">Pontuação pública</p>
      <div className="mt-4 flex flex-col items-center gap-2.5 sm:mt-5 sm:flex-row sm:items-end sm:gap-4">
        <span className="font-heading text-5xl text-ink sm:text-6xl">
          {loading ? '...' : metrics.total ? metrics.rating.toFixed(1) : '0.0'}
        </span>
        <div className="flex flex-col items-center pb-0 sm:items-start sm:pb-2">
          <StarRating rating={metrics.rating} className="scale-110" />
          <p className="mt-2 text-sm text-mist/70 sm:mt-3">{loading ? 'A carregar reviews...' : `${metrics.total} reviews escritas no site.`}</p>
        </div>
      </div>
      <p className="mt-5 hidden text-sm leading-7 text-mist/70 sm:block">
        Todas as reviews submetidas no site ficam visíveis de forma imediata para refletir a experiência real dos clientes.
      </p>
    </div>
  );
}
