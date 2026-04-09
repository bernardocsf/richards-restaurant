'use client';

import { useEffect, useMemo, useState } from 'react';
import { menuCategories } from '@/lib/menu-data';
import { cn, euro } from '@/lib/utils';

export function MenuBrowser() {
  const [activeCategory, setActiveCategory] = useState(menuCategories[0]?.id ?? '');

  const active = useMemo(
    () => menuCategories.find((category) => category.id === activeCategory) ?? menuCategories[0],
    [activeCategory]
  );

  const groupedItems = useMemo(() => {
    const groups = new Map<string, typeof active.items>();

    for (const item of active.items) {
      const key = item.label ?? 'Sugestões';
      const current = groups.get(key) ?? [];
      current.push(item);
      groups.set(key, current);
    }

    return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
  }, [active]);

  const [activeGroup, setActiveGroup] = useState('');

  useEffect(() => {
    setActiveGroup(groupedItems[0]?.label ?? '');
  }, [groupedItems]);

  const visibleGroups = useMemo(() => {
    if (!activeGroup) return groupedItems;
    return groupedItems.filter((group) => group.label === activeGroup);
  }, [activeGroup, groupedItems]);

  const shouldShowDivider = (items: typeof active.items, index: number) => {
    if (index >= items.length - 1) return false;

    const item = items[index];
    const nextItem = items[index + 1];
    const isPenultimateCompactPair =
      index === items.length - 2 && !item.description && !nextItem?.description;

    return !isPenultimateCompactPair;
  };

  const shouldHideDividerOnDesktop = (items: typeof active.items, index: number) => {
    const isPenultimateItem = index === items.length - 2;
    const isEvenGridEnding = items.length % 2 === 0;

    return isPenultimateItem && isEvenGridEnding;
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr]">
      <aside className="top-24 self-start lg:sticky">
        <div className="border-t border-borderSoft pt-4">
          <p className="pb-4 text-xs uppercase tracking-[0.3em] text-champagne">Categorias</p>
          <div className="space-y-1.5">
            {menuCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                className={cn(
                  'w-full border-l px-4 py-3 text-left text-sm transition duration-300',
                  activeCategory === category.id
                    ? 'border-champagne text-ink'
                    : 'border-white/8 text-mist/75 hover:border-champagne/35 hover:text-ink'
                )}
              >
                {category.title}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <section>
        <div className="border-t border-borderSoft pt-6 sm:pt-8">
          {groupedItems.length > 1 ? (
            <div className="mb-8 flex flex-wrap gap-3 border-b border-white/8 pb-6">
              {groupedItems.map((group) => (
                <button
                  key={`${active.id}-${group.label}-tab`}
                  type="button"
                  onClick={() => setActiveGroup(group.label)}
                  className={cn(
                    'rounded-full border px-4 py-2 text-sm transition',
                    activeGroup === group.label
                      ? 'border-champagne bg-champagne text-canvas'
                      : 'border-white/10 text-mist/75 hover:border-champagne/35 hover:text-ink'
                  )}
                >
                  {group.label}
                </button>
              ))}
            </div>
          ) : null}

          <div className="space-y-10">
            {visibleGroups.map((group) => (
              <section key={`${active.id}-${group.label}`} className="space-y-5">
                <div className="grid gap-x-8 gap-y-6 xl:grid-cols-2">
                  {group.items.map((item, index) => (
                    <article
                      key={`${active.id}-${group.label}-${item.name}`}
                      className={cn(
                        'group pb-6 transition duration-300',
                        index < group.items.length - 1 ? 'border-b border-white/8' : '',
                        shouldShowDivider(group.items, index) ? '' : 'xl:border-b-0',
                        shouldHideDividerOnDesktop(group.items, index) ? 'xl:border-b-0' : ''
                      )}
                    >
                      <div className={cn('flex justify-between gap-4', item.description ? 'items-start' : 'items-center')}>
                        <div>
                          <h4 className="font-heading text-2xl text-ink">{item.name}</h4>
                          {item.description ? <p className="mt-3 text-sm leading-7 text-mist/72">{item.description}</p> : null}
                        </div>
                        <span className="border-l border-borderSoft pl-4 text-right text-sm font-semibold text-champagne">
                          {(item.priceLabel ?? euro(item.price)).split('\n').map((line) => (
                            <span key={`${item.name}-${line}`} className="block whitespace-nowrap">
                              {line}
                            </span>
                          ))}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
