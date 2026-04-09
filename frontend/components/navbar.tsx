'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
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
  const isHome = pathname === '/';
  const menuLinks = isHome ? baseLinks : [{ href: '/', label: 'Home' }, ...baseLinks];
  const mobileMenuLinks = baseLinks;

  useEffect(() => {
    setMounted(true);
  }, []);

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
        className="content-shell grid grid-cols-[auto_1fr_auto] items-center gap-4 py-4 sm:py-5 xl:grid-cols-[1fr_auto_1fr]"
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

        <Link href="/" className="flex justify-start xl:justify-center">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.22)] sm:h-24 sm:w-24">
            <Image src="/images/logo.png" alt={restaurantInfo.name} fill className="object-cover" />
          </div>
        </Link>

        <div className="flex items-center justify-end gap-3">
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
            className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center p-1 text-white xl:hidden"
            aria-label="Abrir menu"
            initial={false}
            animate={
              open
                ? { scale: 1, rotate: 0, y: 0 }
                : {
                    scale: [1, 1.08, 1],
                    rotate: [0, 4, 0],
                    y: [0, -3, 0]
                  }
            }
            transition={{
              duration: 2.2,
              ease: 'easeInOut',
              repeat: open ? 0 : Infinity,
              repeatDelay: 0.6
            }}
            whileTap={{ scale: 0.92 }}
          >
            <motion.span
              className="absolute inset-0 rounded-full bg-white/10 blur-md"
              animate={open ? { opacity: 0 } : { opacity: [0.12, 0.26, 0.12], scale: [0.92, 1.14, 0.92] }}
              transition={{
                duration: 2.2,
                ease: 'easeInOut',
                repeat: open ? 0 : Infinity,
                repeatDelay: 0.6
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
                      : line === 0
                        ? { x: [0, 3, 0], width: [24, 16, 24] }
                        : line === 1
                          ? { x: [0, -2, 0], width: [18, 24, 18] }
                          : { x: [0, 4, 0], width: [24, 14, 24] }
                  }
                  transition={{
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
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col border-l border-white/10 bg-[#121516] p-5 shadow-luxe sm:p-6"
                  >
                    <div className="mb-8 flex items-center justify-end">
                      <motion.button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="relative rounded-full border border-white/12 bg-black/35 p-2 text-white transition hover:border-white/24"
                        aria-label="Fechar menu"
                        initial={{ opacity: 0, scale: 0.86, rotate: -18 }}
                        animate={{
                          opacity: 1,
                          scale: [1, 1.08, 1],
                          rotate: [0, 8, 0]
                        }}
                        transition={{
                          opacity: { duration: 0.2, ease: 'easeOut' },
                          scale: {
                            duration: 1.8,
                            ease: 'easeInOut',
                            repeat: Infinity,
                            repeatDelay: 0.5
                          },
                          rotate: {
                            duration: 1.8,
                            ease: 'easeInOut',
                            repeat: Infinity,
                            repeatDelay: 0.5
                          }
                        }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <motion.span
                          className="absolute inset-0 rounded-full bg-white/10 blur-md"
                          animate={{ opacity: [0.08, 0.22, 0.08], scale: [0.94, 1.12, 0.94] }}
                          transition={{
                            duration: 1.8,
                            ease: 'easeInOut',
                            repeat: Infinity,
                            repeatDelay: 0.5
                          }}
                        />
                        <span className="relative inline-flex">
                          <X className="h-5 w-5" />
                        </span>
                      </motion.button>
                    </div>

                    <div className="space-y-4">
                      {mobileMenuLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            'block rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-4 text-lg transition hover:border-champagne/30 hover:text-champagne',
                            pathname === link.href ? 'text-champagne' : 'text-mist/90'
                          )}
                        >
                          {link.label}
                        </Link>
                      ))}
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
