'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import Image from 'next/image';
import { type UIEvent, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { galleryImages } from '@/lib/site-data';
import { cn } from '@/lib/utils';

export function GalleryGrid() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [mobileIndex, setMobileIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  const activeImage = useMemo(
    () => (activeIndex === null ? null : galleryImages[activeIndex]),
    [activeIndex]
  );

  const openImage = (index: number) => setActiveIndex(index);
  const closeImage = () => setActiveIndex(null);
  const showPrevious = () => setActiveIndex((current) => (current === null ? current : (current - 1 + galleryImages.length) % galleryImages.length));
  const showNext = () => setActiveIndex((current) => (current === null ? current : (current + 1) % galleryImages.length));

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (activeIndex === null) {
      return;
    }

    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    return () => {
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overflow = originalOverflow;
    };
  }, [activeIndex]);

  function handleMobileScroll(event: UIEvent<HTMLDivElement>) {
    const container = event.currentTarget;
    const cards = Array.from(container.children) as HTMLElement[];

    if (!cards.length) return;

    const containerCenter = container.scrollLeft + container.clientWidth / 2;
    let nearestIndex = 0;
    let smallestDistance = Number.POSITIVE_INFINITY;

    cards.forEach((card, index) => {
      const cardCenter = card.offsetLeft + card.clientWidth / 2;
      const distance = Math.abs(cardCenter - containerCenter);

      if (distance < smallestDistance) {
        smallestDistance = distance;
        nearestIndex = index;
      }
    });

    setMobileIndex(nearestIndex);
  }

  return (
    <>
      <div className="relative md:hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 px-2">
          <div className="h-24 w-16 bg-[radial-gradient(circle_at_left,rgba(215,239,57,0.16),transparent_68%)] blur-2xl" />
        </div>

        <div className="mb-5 flex items-center justify-between px-1 pt-1">
          <span className="inline-flex rounded-full border border-borderSoft bg-[rgba(94,145,35,0.16)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.34em] text-champagne">
            Galeria
          </span>
          <span className="text-[11px] uppercase tracking-[0.28em] text-white/58">
            {String(mobileIndex + 1).padStart(2, '0')} / {String(galleryImages.length).padStart(2, '0')}
          </span>
        </div>

        <div
          onScroll={handleMobileScroll}
          className="scrollbar-none -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {galleryImages.map((image, index) => {
            const isActive = index === mobileIndex;
            const distance = Math.abs(index - mobileIndex);

            return (
              <motion.button
                key={image.src}
                type="button"
                onClick={() => openImage(index)}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.55, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  'group relative h-[26rem] w-[84vw] max-w-[24rem] shrink-0 snap-center overflow-hidden rounded-[2rem] border border-white/12 bg-[#0b100c] text-left shadow-[0_30px_80px_rgba(0,0,0,0.35)] transition duration-500',
                  isActive ? 'opacity-100' : 'opacity-70'
                )}
                style={{
                  transform: `perspective(1400px) scale(${isActive ? 1 : 0.94}) rotateY(${isActive ? 0 : index < mobileIndex ? 8 : -8}deg) translateY(${Math.min(distance, 2) * 8}px)`
                }}
              >
                <div className="absolute inset-0">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    unoptimized
                    sizes="84vw"
                    className="object-cover transition duration-700 group-active:scale-[1.02]"
                    style={{ objectPosition: image.position ?? 'center center' }}
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,6,5,0.08),rgba(4,6,5,0.26)_38%,rgba(4,6,5,0.82))]" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(215,239,57,0.22),transparent_34%)] opacity-80" />
                </div>

                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="max-w-[16rem] font-heading text-[1.9rem] leading-[1.02] text-white">
                    {image.alt}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="hidden auto-rows-[16rem] gap-4 md:grid md:grid-cols-2 xl:grid-cols-12">
        {galleryImages.map((image, index) => (
          <motion.button
            key={image.src}
            type="button"
            onClick={() => openImage(index)}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.65, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -4 }}
            className={`group relative overflow-hidden rounded-[1.75rem] border border-borderSoft bg-white/5 text-left ${
              index === 0
                ? 'md:col-span-2 xl:col-span-7 xl:row-span-2'
                : index === 1
                  ? 'xl:col-span-5'
                  : index === 2
                    ? 'xl:col-span-5'
                    : index === 3
                      ? 'xl:col-span-3'
                      : index === 4
                        ? 'xl:col-span-4'
                        : 'xl:col-span-5'
            }`}
          >
            <div className="relative h-full min-h-[16rem]">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                unoptimized
                className="object-cover transition duration-700 group-hover:scale-[1.06]"
                style={{ objectPosition: image.position ?? 'center center' }}
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02),rgba(0,0,0,0.46))]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(215,239,57,0.14),transparent_36%)] opacity-0 transition duration-700 group-hover:opacity-100" />
              <div className="absolute inset-x-0 bottom-0 translate-y-3 p-4 opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                <span className="inline-flex rounded-full border border-white/12 bg-black/35 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white/80 backdrop-blur-sm">
                  Abrir imagem
                </span>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {mounted
        ? createPortal(
            <AnimatePresence>
              {activeImage ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[80] flex items-center justify-center bg-black/88 px-3 py-4 backdrop-blur-md sm:px-5 sm:py-5"
                >
                  <div className="relative flex w-full max-w-7xl flex-col items-center gap-3 px-3 sm:gap-4 sm:px-6">
                    <button
                      type="button"
                      aria-label="Fechar galeria"
                      onClick={closeImage}
                      className="absolute right-0 top-0 z-10 -translate-y-[125%] p-2 text-white transition hover:text-white/78 sm:-translate-y-[140%]"
                    >
                      <X className="h-5 w-5" />
                    </button>

                    <div className="relative flex w-full items-center justify-center">
                      <button
                        type="button"
                        aria-label="Imagem anterior"
                        onClick={showPrevious}
                        className="absolute left-1 top-1/2 z-10 -translate-y-1/2 p-1 text-white/90 transition hover:text-white sm:left-3"
                      >
                        <ChevronLeft className="h-8 w-8 sm:h-10 sm:w-10" />
                      </button>

                      <motion.div
                        initial={{ opacity: 0, y: 24, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 18, scale: 0.98 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        className="flex w-full items-center justify-center overflow-hidden rounded-[1.75rem] border border-white/12 bg-[#050605] shadow-luxe"
                      >
                        <Image
                          src={activeImage.src}
                          alt={activeImage.alt}
                          width={1600}
                          height={1067}
                          unoptimized
                          sizes="100vw"
                          className="block h-auto max-h-[82vh] w-auto max-w-full"
                        />
                      </motion.div>

                      <button
                        type="button"
                        aria-label="Imagem seguinte"
                        onClick={showNext}
                        className="absolute right-1 top-1/2 z-10 -translate-y-1/2 p-1 text-white/90 transition hover:text-white sm:right-3"
                      >
                        <ChevronRight className="h-8 w-8 sm:h-10 sm:w-10" />
                      </button>
                    </div>

                    <div className="mx-auto w-full max-w-3xl rounded-full border border-white/12 bg-black/45 px-5 py-3 text-center text-sm text-white/84 backdrop-blur-md">
                      {activeImage.alt}
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body
          )
        : null}
    </>
  );
}
