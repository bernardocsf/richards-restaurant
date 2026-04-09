import { ReactNode } from 'react';

export function SectionHeading({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div className="flex-1">
        <span className="inline-flex rounded-full border border-borderSoft bg-[rgba(94,145,35,0.16)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.34em] text-champagne">
          {eyebrow}
        </span>
        {title ? <h2 className="mt-3 font-heading text-3xl text-ink sm:text-4xl lg:text-[2.9rem]">{title}</h2> : null}
        {description ? <p className={`${title ? 'mt-4' : 'mt-3'} text-base leading-8 text-mist/72 md:max-w-3xl`}>{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
