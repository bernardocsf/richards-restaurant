'use client';

import { useState } from 'react';
import { AnimatedSection } from '@/components/animated-section';
import { ReviewForm } from '@/components/review-form';
import { ReviewList } from '@/components/review-list';

export function ReviewsPageContent() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-12 pb-8">
      <AnimatedSection className="grid gap-8 xl:grid-cols-[0.88fr_1.12fr]">
        <div className="py-2 sm:py-4 xl:sticky xl:top-28 xl:self-start">
          <span className="text-xs uppercase tracking-[0.3em] text-champagne">Submeter review</span>
          <h2 className="mt-4 font-heading text-4xl text-ink">Partilha a tua experiência.</h2>
          <p className="mt-5 text-base leading-8 text-mist/72">
            O formulário fica logo no topo para não dependeres de percorrer dezenas de reviews antes de escrever a tua. Após envio,
            a review aparece logo no website.
          </p>
        </div>
        <ReviewForm onSubmitted={() => setRefreshKey((current) => current + 1)} />
      </AnimatedSection>

      <AnimatedSection>
        <ReviewList refreshKey={refreshKey} />
      </AnimatedSection>
    </div>
  );
}
