'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { fetchReviews } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { StarRating } from '@/components/star-rating';

type Review = {
  _id: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

type ReviewListProps = {
  refreshKey?: number;
};

export function ReviewList({ refreshKey = 0 }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedReviews, setExpandedReviews] = useState<Record<string, boolean>>({});
  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => {
    let mounted = true;

    async function loadReviews() {
      try {
        const response = await fetchReviews();
        if (mounted) {
          setReviews(response.reviews as Review[]);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Não foi possível carregar as reviews.');
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
  }, [refreshKey]);

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

  const toggleReview = (id: string) => {
    setExpandedReviews((current) => ({
      ...current,
      [id]: !current[id]
    }));
  };

  const visibleReviews = useMemo(() => reviews.slice(0, visibleCount), [reviews, visibleCount]);
  const hasMoreReviews = visibleCount < reviews.length;

  return (
    <div className="space-y-8">
      <div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
        <div className="rounded-[28px] border border-borderSoft bg-[rgba(84,121,31,0.08)] p-6 sm:p-7">
          <p className="text-sm uppercase tracking-[0.28em] text-champagne">Pontuação pública</p>
          <div className="mt-5 flex items-end gap-4">
            <span className="font-heading text-6xl text-ink">{metrics.total ? metrics.rating.toFixed(1) : '0.0'}</span>
            <div className="pb-2">
              <StarRating rating={metrics.rating} className="scale-110" />
              <p className="mt-3 text-sm text-mist/70">{metrics.total} reviews escritas no site.</p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-7 text-mist/70">
            Todas as reviews submetidas no site ficam visíveis de forma imediata para refletir a experiência real dos clientes.
          </p>
        </div>

        <div className="flex items-end justify-between gap-4 rounded-[28px] border border-borderSoft bg-[rgba(255,255,255,0.02)] p-6 sm:p-7">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-champagne">Leitura rápida</p>
            <h2 className="mt-4 font-heading text-3xl text-ink sm:text-4xl">Reviews recentes do site.</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-mist/70">
              A lista abre com um conjunto mais curto para navegação confortável. Se quiseres, podes carregar mais reviews logo abaixo.
            </p>
          </div>
          {metrics.total ? (
            <div className="hidden text-right sm:block">
              <p className="text-xs uppercase tracking-[0.24em] text-mist/52">A mostrar</p>
              <p className="mt-2 font-heading text-3xl text-ink">
                {Math.min(visibleCount, metrics.total)}
                <span className="ml-2 text-base text-mist/54">de {metrics.total}</span>
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="border-t border-borderSoft pt-6">
        <div className="space-y-4">
          {loading ? (
            <div className="border border-borderSoft bg-[rgba(84,121,31,0.1)] p-8 text-sm text-mist/72">A carregar reviews...</div>
          ) : error ? (
            <div className="border border-rose-300/20 bg-rose-400/10 p-8 text-sm text-rose-100">{error}</div>
          ) : reviews.length === 0 ? (
            <div className="border border-borderSoft bg-[rgba(84,121,31,0.1)] p-8 text-sm text-mist/72">
              Ainda não existem reviews no site. Sê o primeiro a partilhar a tua experiência.
            </div>
          ) : (
            visibleReviews.map((review) => (
              <article key={review._id} className="border-b border-borderSoft pb-6 last:border-b-0 last:pb-0">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-heading text-2xl text-ink">{review.customerName}</p>
                    <p className="text-sm text-mist/55">{formatDate(review.createdAt)}</p>
                  </div>
                  <StarRating rating={review.rating} />
                </div>
                <p className="mt-4 text-sm leading-7 text-mist/74">
                  {review.comment.length > 220 && !expandedReviews[review._id]
                    ? `${review.comment.slice(0, 220)}...`
                    : review.comment}
                </p>
                {review.comment.length > 220 ? (
                  <button
                    type="button"
                    onClick={() => toggleReview(review._id)}
                    className="mt-2 text-sm font-semibold text-champagne transition hover:text-ink"
                  >
                    {expandedReviews[review._id] ? 'Ver menos' : 'Ver mais'}
                  </button>
                ) : null}
              </article>
            ))
          )}
        </div>

        {hasMoreReviews && !loading && !error ? (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => setVisibleCount((current) => current + 12)}
              className="inline-flex items-center gap-2 rounded-full border border-borderSoft bg-[rgba(84,121,31,0.12)] px-6 py-3 text-sm font-semibold text-ink transition duration-300 hover:border-champagne/45 hover:text-champagne"
            >
              <ChevronDown className="h-4 w-4" />
              Ver mais reviews
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
