import Image from 'next/image';
import Link from 'next/link';
import { categoryShowcase } from '@/lib/site-data';

export function HighlightCards() {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {categoryShowcase.map((card) => (
        <Link
          key={card.title}
          href="/menu"
          className="group relative overflow-hidden rounded-[2rem] border border-borderSoft bg-[#121415] shadow-soft"
        >
          <div className="relative h-64 overflow-hidden sm:h-72">
            <Image
              src={card.image}
              alt={card.title}
              fill
              unoptimized
              sizes="(min-width: 1280px) 30vw, (min-width: 768px) 50vw, 100vw"
              className="object-cover transition duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(8,8,8,0.85))]" />
          </div>
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
            <p className="font-heading text-2xl text-ink">{card.title}</p>
            <p className="mt-3 text-sm leading-7 text-white/72">{card.description}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
