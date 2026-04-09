'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Phone, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { createPortal } from 'react-dom';
import { restaurantInfo } from '@/lib/site-data';
import { cn } from '@/lib/utils';

const baseLinks = [
  { href: '/menu', label: 'Menu' },
  { href: '/reviews', label: 'Reviews' },
  { href: '/contact', label: 'Contactos' }
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const isHome = pathname === '/';
  const menuLinks = isHome ? baseLinks : [{ href: '/', label: 'Home' }, ...baseLinks];
  const mobileMenuLinks = baseLinks;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open]);

  return (
    <header
      className={cn(
        'z-50',
        isHome
          ? 'absolute inset-x-0 top-0'
          : 'sticky top-0 border-b border-white/6 bg-[#0f1213]/88 backdrop-blur-xl'
      )}
    >
      <div
        className={cn(
          'content-shell grid grid-cols-[auto_1fr_auto] items-center gap-3 py-4 sm:gap-4 sm:py-5 xl:grid-cols-[1fr_auto_1fr]',
          isHome ? 'pt-[max(1rem,env(safe-area-inset-top))]' : ''
        )}
      >
        <nav className="hidden items-center gap-5 xl:flex">
          {menuLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-sm transition',
                pathname === link.href
                  ? 'text-champagne'
                  : isHome
                    ? 'text-white/78 hover:text-white'
                    : 'text-mist/80 hover:text-champagne'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/"
          className={cn(
            'flex justify-start xl:justify-center',
            isHome ? 'rounded-full border border-white/10 bg-black/24 px-2.5 py-1.5 shadow-[0_16px_44px_rgba(0,0,0,0.2)] backdrop-blur-xl xl:border-transparent xl:bg-transparent xl:px-0 xl:py-0 xl:shadow-none' : ''
          )}
        >
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.22)] sm:h-24 sm:w-24">
            <Image src="/images/logo.png" alt={restaurantInfo.name} fill unoptimized className="object-cover" />
          </div>
        </Link>

        <div className="flex items-center justify-end gap-3">
          <a
            href={`tel:${restaurantInfo.phonePrimary.replace(/\s+/g, '')}`}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/22 text-white shadow-[0_12px_28px_rgba(0,0,0,0.16)] backdrop-blur-md transition hover:border-white/20 xl:hidden"
            aria-label="Ligar para o restaurante"
          >
            <Phone className="h-4 w-4" />
          </a>

          <div className="hidden items-center gap-3 xl:flex">
            <a href={`tel:${restaurantInfo.phonePrimary}`} className="button-secondary">
              Reservar por telefone
            </a>
            <Link href="/reservations" className="button-primary">
              Reservar mesa
            </Link>
          </div>

          <motion.button
            type="button"
            onClick={() => setOpen(true)}
            className="relative inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/22 p-1 text-white shadow-[0_12px_28px_rgba(0,0,0,0.16)] backdrop-blur-md xl:hidden"
            aria-label="Abrir menu"
            initial={false}
            animate={prefersReducedMotion ? undefined : open ? { scale: 1, rotate: 0, y: 0 } : { scale: [1, 1.04, 1], y: [0, -2, 0] }}
            transition={prefersReducedMotion ? undefined : {
              duration: 2.2,
              ease: 'easeInOut',
              repeat: open ? 0 : Infinity,
              repeatDelay: 0.9
            }}
            whileTap={{ scale: 0.92 }}
          >
            <motion.span
              className="absolute inset-0 rounded-full bg-white/10 blur-md"
              animate={prefersReducedMotion ? { opacity: open ? 0 : 0.12 } : open ? { opacity: 0 } : { opacity: [0.1, 0.18, 0.1], scale: [0.96, 1.08, 0.96] }}
              transition={prefersReducedMotion ? undefined : {
                duration: 2.2,
                ease: 'easeInOut',
                repeat: open ? 0 : Infinity,
                repeatDelay: 0.9
              }}
            />
            <span className="relative inline-flex h-5 w-6 flex-col items-center justify-center gap-[0.26rem]">
              {[0, 1, 2].map((line) => (
                <motion.span
                  key={line}
                  className="block h-[2px] w-6 rounded-full bg-current"
                  animate={
                    open
                      ? { x: 0, opacity: 1, width: 24 }
                      : prefersReducedMotion
                        ? { x: 0, opacity: 1, width: 24 }
                        : line === 0
                        ? { x: [0, 3, 0], width: [24, 16, 24] }
                        : line === 1
                          ? { x: [0, -2, 0], width: [18, 24, 18] }
                          : { x: [0, 4, 0], width: [24, 14, 24] }
                  }
                  transition={prefersReducedMotion ? undefined : {
                    duration: 1.3,
                    ease: 'easeInOut',
                    repeat: open ? 0 : Infinity,
                    repeatDelay: 0.5,
                    delay: line * 0.08
                  }}
                />
              ))}
            </span>
          </motion.button>
        </div>
      </div>

      {mounted
        ? createPortal(
            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-md xl:hidden"
                >
                  <motion.div
                    initial={prefersReducedMotion ? { opacity: 0 } : { y: '100%' }}
                    animate={prefersReducedMotion ? { opacity: 1 } : { y: 0 }}
                    exit={prefersReducedMotion ? { opacity: 0 } : { y: '100%' }}
                    transition={{ duration: 0.32, ease: 'easeOut' }}
                    className="absolute inset-x-0 bottom-0 flex max-h-[86vh] w-full flex-col rounded-t-[2rem] border-t border-white/10 bg-[linear-gradient(180deg,#15191a,#0c0f10)] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 shadow-luxe sm:px-6"
                  >
                    <div className="mb-6 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.28em] text-white/48">Menu</p>
                        <p className="mt-2 font-heading text-2xl text-ink">Richard&apos;s Garden</p>
                      </div>
                      <motion.button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="relative rounded-full border border-white/12 bg-black/35 p-2.5 text-white transition hover:border-white/24"
                        aria-label="Fechar menu"
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={prefersReducedMotion ? { opacity: 1, scale: 1 } : { opacity: 1, scale: [1, 1.04, 1] }}
                        transition={prefersReducedMotion ? { duration: 0.2 } : {
                          opacity: { duration: 0.2, ease: 'easeOut' },
                          scale: {
                            duration: 1.8,
                            ease: 'easeInOut',
                            repeat: Infinity,
                            repeatDelay: 0.7
                          }
                        }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <motion.span
                          className="absolute inset-0 rounded-full bg-white/10 blur-md"
                          animate={prefersReducedMotion ? { opacity: 0.08, scale: 1 } : { opacity: [0.08, 0.18, 0.08], scale: [0.96, 1.08, 0.96] }}
                          transition={prefersReducedMotion ? undefined : {
                            duration: 1.8,
                            ease: 'easeInOut',
                            repeat: Infinity,
                            repeatDelay: 0.7
                          }}
                        />
                        <span className="relative inline-flex">
                          <X className="h-5 w-5" />
                        </span>
                      </motion.button>
                    </div>

                    <div className="space-y-3 overflow-y-auto pb-4">
                      {mobileMenuLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            'block rounded-[1.4rem] border px-4 py-4 text-lg transition',
                            pathname === link.href
                              ? 'border-champagne/35 bg-[rgba(215,239,57,0.12)] text-champagne'
                              : 'border-white/6 bg-white/[0.03] text-mist/90 hover:border-champagne/30 hover:text-champagne'
                          )}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>

                    <div className="mt-auto grid grid-cols-1 gap-3 border-t border-white/8 pt-4">
                      <Link href="/reservations" onClick={() => setOpen(false)} className="button-primary w-full">
                        Reservar mesa
                      </Link>
                      <a href={`tel:${restaurantInfo.phonePrimary.replace(/\s+/g, '')}`} className="button-secondary w-full">
                        Ligar agora
                      </a>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>,
            document.body
          )
        : null}
    </header>
  );
}
