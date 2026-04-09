import Image from 'next/image';

export function PageHero({
  title,
  description,
  image,
  badge
}: {
  title: string;
  description: string;
  image: string;
  badge: string;
}) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-borderSoft bg-canvas/80 shadow-luxe sm:rounded-[2.4rem]">
      <div className="absolute inset-0">
        <Image src={image} alt={title} fill unoptimized sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(92deg,rgba(5,8,5,0.9),rgba(5,8,5,0.56),rgba(5,8,5,0.24))]" />
      </div>
      <div className="relative z-10 px-6 py-14 sm:px-10 sm:py-18 lg:px-16 lg:py-20 xl:px-20">
        <span className="inline-flex rounded-full border border-borderSoft bg-[rgba(98,153,38,0.16)] px-4 py-1 text-xs uppercase tracking-[0.35em] text-champagne">
          {badge}
        </span>
        <h1 className="mt-6 max-w-5xl font-heading text-4xl leading-[1.04] text-ink sm:text-5xl lg:text-6xl xl:text-[4.5rem]">
          {title}
        </h1>
        <p className="mt-5 text-base leading-8 text-white/80 sm:text-lg lg:max-w-[52rem]">{description}</p>
      </div>
    </section>
  );
}
