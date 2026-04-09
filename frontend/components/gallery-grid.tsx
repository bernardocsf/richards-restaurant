'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { galleryImages } from '@/lib/site-data';

export function GalleryGrid() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const prefersReducedMotion = useReducedMotion();

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

  return (
    <>
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:auto-rows-[16rem] md:grid-cols-2 md:overflow-visible md:pb-0 xl:grid-cols-12">
        {galleryImages.map((image, index) => (
          <motion.button
            key={image.src}
            type="button"
            onClick={() => openImage(index)}
            initial={prefersReducedMotion ? undefined : { opacity: 0, y: 24 }}
            whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={prefersReducedMotion ? undefined : { duration: 0.65, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
            whileHover={prefersReducedMotion ? undefined : { y: -4 }}
            className={`group relative min-w-[82vw] snap-center overflow-hidden rounded-[1.75rem] border border-borderSoft bg-white/5 text-left md:min-w-0 ${
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
            <div className="relative h-full min-h-[18rem] md:min-h-[16rem]">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                unoptimized
                sizes="(max-width: 767px) 82vw, (min-width: 1280px) 33vw, 50vw"
                className="object-cover transition duration-700 group-hover:scale-[1.06]"
                style={{ objectPosition: image.position ?? 'center center' }}
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02),rgba(0,0,0,0.46))]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(215,239,57,0.14),transparent_36%)] opacity-100 transition duration-700 md:opacity-0 md:group-hover:opacity-100" />
              <div className="absolute inset-x-0 bottom-0 translate-y-0 p-4 opacity-100 transition duration-500 md:translate-y-3 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100">
                <span className="inline-flex rounded-full border border-white/12 bg-black/35 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white/80 backdrop-blur-sm">
                  Abrir imagem
                </span>
                <p className="mt-3 max-w-[18rem] text-sm text-white/76 md:hidden">{image.alt}</p>
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
                  className="fixed inset-0 z-[80] flex items-center justify-center bg-black/88 p-4 backdrop-blur-md sm:p-6"
                >
                  <div className="relative flex w-full max-w-6xl flex-col items-center gap-4 px-4 sm:px-16">
                    <button
                      type="button"
                      aria-label="Fechar galeria"
                      onClick={closeImage}
                      className="absolute right-0 top-0 z-10 rounded-full border border-white/12 bg-black/55 p-3 text-white transition hover:border-white/24 sm:-translate-y-1/2"
                    >
                      <X className="h-5 w-5" />
                    </button>

                    <div className="relative flex w-full items-center justify-center">
                      <button type="button" aria-label="Imagem anterior" onClick={showPrevious} className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full border border-white/12 bg-black/40 p-3 text-white transition hover:border-white/24 sm:left-0">
                        <ChevronLeft className="h-5 w-5" />
                      </button>

                      <motion.div
                        initial={{ opacity: 0, y: 24, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 18, scale: 0.98 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        className="flex items-center justify-center overflow-hidden rounded-[1.75rem] border border-white/12 bg-[#050605] shadow-luxe"
                      >
                        <Image
                          src={activeImage.src}
                          alt={activeImage.alt}
                          unoptimized
                          sizes="100vw"
                          className="block h-auto max-h-[72vh] w-auto max-w-full"
                        />
                      </motion.div>

                      <button type="button" aria-label="Imagem seguinte" onClick={showNext} className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full border border-white/12 bg-black/40 p-3 text-white transition hover:border-white/24 sm:right-0">
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="mx-auto w-full max-w-3xl rounded-[1.2rem] border border-white/12 bg-black/45 px-5 py-3 text-center text-sm text-white/84 backdrop-blur-md sm:rounded-full">
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
