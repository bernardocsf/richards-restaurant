'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { fetchReviews } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { SectionHeading } from '@/components/section-heading';
import { StarRating } from '@/components/star-rating';

type Review = {
  _id: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export function HomeReviewPreview() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedReviews, setExpandedReviews] = useState<Record<string, boolean>>({});

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

  const displayedReviews = useMemo(() => reviews.slice(0, 3), [reviews]);

  const toggleReview = (id: string) => {
    setExpandedReviews((current) => ({
      ...current,
      [id]: !current[id]
    }));
  };

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Reviews"
        title="Feedback recente escrito diretamente pelos clientes."
        description="Uma leitura rápida da experiência no restaurante, com opiniões reais submetidas no site e acesso à coleção completa."
        action={
          <Link href="/reviews" className="button-primary inline-flex items-center gap-2">
            Ver todas as reviews
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-[2rem] border border-borderSoft bg-[linear-gradient(180deg,rgba(84,121,31,0.12),rgba(84,121,31,0.05))] p-6 shadow-soft sm:p-7"
        >
          <p className="text-xs uppercase tracking-[0.28em] text-champagne">Pontuação pública</p>
          <div className="mt-6 flex items-end gap-4">
            <span className="font-heading text-6xl text-ink">{metrics.total ? metrics.rating.toFixed(1) : '0.0'}</span>
            <div className="pb-1">
              <StarRating rating={metrics.rating} className="scale-110" />
              <p className="mt-3 text-sm text-mist/70">{metrics.total} reviews escritas no site.</p>
            </div>
          </div>
          <p className="mt-6 max-w-md text-sm leading-7 text-mist/72">
            Uma secção pensada para dar prova social imediata sem perder o lado editorial da homepage.
          </p>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="rounded-[1.75rem] border border-borderSoft bg-[rgba(255,255,255,0.03)] p-5 shadow-soft"
              >
                <div className="h-6 w-24 rounded bg-[rgba(108,158,42,0.2)]" />
                <div className="mt-4 h-20 rounded bg-[rgba(89,128,32,0.12)]" />
              </div>
            ))
          ) : error ? (
            <div className="rounded-[1.75rem] border border-rose-300/20 bg-rose-400/10 p-6 text-sm text-rose-100 md:col-span-2 xl:col-span-3">
              {error}
            </div>
          ) : reviews.length === 0 ? (
            <div className="rounded-[1.75rem] border border-borderSoft bg-[rgba(84,121,31,0.1)] p-6 text-sm text-mist/72 md:col-span-2 xl:col-span-3">
              Ainda não existem reviews escritas no site.
            </div>
          ) : (
            displayedReviews.map((review, index) => (
              <motion.article
                key={review._id}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.65, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -4 }}
                className="rounded-[1.75rem] border border-borderSoft bg-[rgba(255,255,255,0.03)] p-5 shadow-soft"
              >
                <div>
                  <p className="font-heading text-2xl text-ink">{review.customerName}</p>
                  <div className="mt-4">
                    <StarRating rating={review.rating} />
                  </div>
                  <p className="mt-4 text-sm text-mist/55">{formatDate(review.createdAt)}</p>
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
              </motion.article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
