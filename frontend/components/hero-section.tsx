'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

export function HeroSection() {
  return (
    <section className="relative -mx-5 -mt-8 overflow-hidden sm:-mx-8 sm:-mt-10 lg:-mx-12 2xl:-mx-16">
      <div className="absolute inset-0">
        <motion.div
          initial={{ scale: 1.12, y: 18 }}
          animate={{ scale: [1.12, 1.06, 1.1], y: [18, 0, 12] }}
          transition={{
            duration: 16,
            ease: 'easeInOut',
            times: [0, 0.55, 1],
            repeat: Infinity,
            repeatType: 'reverse'
          }}
          className="absolute inset-0"
        >
          <Image
            src="/images/home-hero-food.jpg"
            alt="Seleção de pratos do restaurante com carne, peixe, sushi e massa"
            fill
            priority
            unoptimized
            sizes="100vw"
            className="object-cover object-center"
          />
        </motion.div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,3,4,0.8),rgba(3,3,4,0.42)_24%,rgba(3,3,4,0.58)_62%,rgba(4,4,5,0.94))]" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, ease: 'easeOut', delay: 0.2 }}
          className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(215,239,57,0.22),rgba(215,239,57,0))] blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.6, ease: 'easeOut', delay: 0.35 }}
          className="absolute bottom-10 right-0 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(31,95,31,0.28),rgba(31,95,31,0))] blur-3xl"
        />
      </div>

      <div className="relative z-10 flex min-h-[100svh] items-center justify-center px-5 pb-12 pt-28 text-center sm:px-8 sm:pb-14 sm:pt-32 lg:items-end lg:justify-start lg:px-12 lg:pb-16 lg:pt-36 lg:text-left 2xl:px-16">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto flex min-h-[calc(100svh-10rem)] w-full max-w-3xl flex-col items-center justify-end lg:mx-0 lg:min-h-0 lg:items-start lg:justify-end"
        >
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-center text-[11px] uppercase tracking-[0.34em] text-white/68 sm:text-xs lg:text-left"
          >
            Richard&apos;s Garden Restaurant
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.42 }}
            className="mt-6 flex w-full items-center justify-center gap-3 sm:gap-4 lg:mt-8 lg:w-auto lg:justify-start"
          >
            <Link
              href="/menu"
              className="inline-flex min-w-[9.5rem] items-center justify-center rounded-full border border-white/14 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition duration-300 hover:border-white/28 hover:bg-white/16"
            >
              Ver menu
            </Link>
            <Link
              href="/contact"
              className="inline-flex min-w-[9.5rem] items-center justify-center rounded-full border border-white/14 px-6 py-3 text-sm font-semibold text-white/82 transition duration-300 hover:border-white/28 hover:text-white"
            >
              Contactos
            </Link>
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
}
