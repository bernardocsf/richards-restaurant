'use client';

import { motion } from 'framer-motion';
import { AnimatedSection } from '@/components/animated-section';
import { GalleryGrid } from '@/components/gallery-grid';
import { HeroSection } from '@/components/hero-section';
import { HomeReviewPreview } from '@/components/home-review-preview';
import { SectionHeading } from '@/components/section-heading';

export default function HomePage() {
  return (
    <div className="space-y-14 pb-10 sm:space-y-18">
      <HeroSection />

      <AnimatedSection className="grid gap-8 border-t border-borderSoft pt-10 xl:grid-cols-[1.05fr_0.95fr]">
        <motion.div
          initial={{ opacity: 0, x: -28 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="inline-flex rounded-full border border-borderSoft bg-[rgba(94,145,35,0.16)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.34em] text-champagne">
            Sobre nós
          </span>
          <h2 className="mt-5 font-heading text-3xl leading-[1.12] text-ink sm:text-4xl lg:text-[2.9rem] lg:leading-[1.1]">
            Um restaurante com história, natureza e uma casa aberta a todos.
          </h2>
          <div className="mt-7 space-y-4 text-base leading-8 text-mist/72">
            <p>
              O Richard&apos;s nasceu em 1999 e cresceu em Lisboa com uma proposta centrada em boa comida e serviço próximo.
            </p>
            <p>
              Hoje, o Richard&apos;s Garden junta sala acolhedora, muito verde e uma carta pensada para diferentes momentos, do almoço ao jantar.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 28 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
          className="border-t border-borderSoft pt-6 xl:border-l xl:border-t-0 xl:pl-8 xl:pt-0"
        >
          <div className="space-y-4 text-base leading-8 text-mist/72">
            <p>Um espaço tranquilo no bairro da Encarnação, pensado para refeições demoradas e encontros sem pressa.</p>
            <p>
              A esplanada é animal friendly e a atmosfera combina conforto, detalhe e um ritmo mais leve.
            </p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.08,
                  delayChildren: 0.15
                }
              }
            }}
            className="mt-8 grid gap-4 sm:grid-cols-2"
          >
            {[
              { label: 'Ambiente', value: 'Calmo e acolhedor' },
              { label: 'Desde', value: '1999' },
              { label: 'Localização', value: 'Bairro da Encarnação' },
              { label: 'Esplanada', value: 'Animal friendly' }
            ].map((item) => (
              <motion.div
                key={item.label}
                variants={{
                  hidden: { opacity: 0, y: 18, scale: 0.97 },
                  visible: { opacity: 1, y: 0, scale: 1 }
                }}
                whileHover={{ y: -4, scale: 1.01 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="rounded-[1.4rem] border border-borderSoft bg-[linear-gradient(180deg,rgba(84,121,31,0.1),rgba(84,121,31,0.04))] p-5 shadow-soft"
              >
                <p className="text-xs uppercase tracking-[0.25em] text-champagne">{item.label}</p>
                <p className="mt-3 font-heading text-2xl text-ink">{item.value}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </AnimatedSection>

      <AnimatedSection className="-mt-2 pt-0 sm:-mt-4">
        <div className="hidden md:block">
          <SectionHeading
            eyebrow="Galeria"
            title=""
            description=""
          />
        </div>
        <GalleryGrid />
      </AnimatedSection>

      <AnimatedSection className="pt-4 sm:pt-8">
        <HomeReviewPreview />
      </AnimatedSection>
    </div>
  );
}
