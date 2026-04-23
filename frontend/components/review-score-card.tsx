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
    <div className="mt-8 rounded-[28px] border border-borderSoft bg-[rgba(84,121,31,0.08)] p-6 sm:p-7">
      <p className="text-sm uppercase tracking-[0.28em] text-champagne">Pontuação pública</p>
      <div className="mt-5 flex items-end gap-4">
        <span className="font-heading text-6xl text-ink">
          {loading ? '...' : metrics.total ? metrics.rating.toFixed(1) : '0.0'}
        </span>
        <div className="pb-2">
          <StarRating rating={metrics.rating} className="scale-110" />
          <p className="mt-3 text-sm text-mist/70">{loading ? 'A carregar reviews...' : `${metrics.total} reviews escritas no site.`}</p>
        </div>
      </div>
      <p className="mt-5 text-sm leading-7 text-mist/70">
        Todas as reviews submetidas no site ficam visíveis de forma imediata para refletir a experiência real dos clientes.
      </p>
    </div>
  );
}
