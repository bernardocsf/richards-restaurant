'use client';

import { useState } from 'react';
import { AnimatedSection } from '@/components/animated-section';
import { ReviewForm } from '@/components/review-form';
import { ReviewList } from '@/components/review-list';
import { ReviewScoreCard } from '@/components/review-score-card';

export function ReviewsPageContent() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-12 pb-8">
      <AnimatedSection className="grid gap-0 sm:gap-8 xl:grid-cols-[0.88fr_1.12fr]">
        <div className="py-2 sm:py-4 xl:sticky xl:top-28 xl:self-start">
          <span className="text-xs uppercase tracking-[0.3em] text-champagne">Submeter review</span>
          <h2 className="mt-4 font-heading text-4xl text-ink">Partilha a tua experiência.</h2>
          <div className="hidden xl:block">
            <ReviewScoreCard />
          </div>
        </div>
        <div>
          <div className="xl:hidden pb-6">
            <ReviewScoreCard />
          </div>
          <ReviewForm onSubmitted={() => setRefreshKey((current) => current + 1)} />
        </div>
      </AnimatedSection>

      <AnimatedSection>
        <ReviewList refreshKey={refreshKey} />
      </AnimatedSection>
    </div>
  );
}
