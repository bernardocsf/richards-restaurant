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
