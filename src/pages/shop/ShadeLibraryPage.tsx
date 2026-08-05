import { useMemo } from 'react';
import { Link } from 'react-router';
import { useProducts } from '@/features/catalog/useCatalog';
import { ShadeSwatch } from '@/components/shade/ShadeSwatch';
import { GoldRule } from '@/components/brand/GoldRule';
import { hueAngle } from '@/lib/shade';

/**
 * The one deliberately polychrome page: every shade as a large gloss dome,
 * sorted by hue angle. It earns its color by being the only page like it.
 */
export function ShadeLibraryPage() {
  const { data, isPending } = useProducts({ limit: 60 });

  const shades = useMemo(() => {
    const all = (data?.products ?? []).flatMap((p) =>
      p.swatches
        .filter((s) => s.hexColor)
        .map((s) => ({ ...s, productName: p.name, productSlug: p.slug })),
    );
    return all.sort((a, b) => hueAngle(a.hexColor!) - hueAngle(b.hexColor!));
  }, [data]);

  return (
    <div className="mx-auto max-w-[1440px] px-gutter py-12">
      <div className="text-center">
        <p className="eyebrow text-gold-950">Every color we make</p>
        <h1 className="display text-display-2 text-ink mt-4">The shade library</h1>
        <GoldRule ornament className="w-44 mt-8 mx-auto" />
      </div>

      {isPending ? (
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="skeleton aspect-square rounded-full" />
          ))}
        </div>
      ) : (
        <ul className="mt-16 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-8 gap-y-12">
          {shades.map((s) => (
            <li key={s.id} className="flex flex-col items-center text-center">
              <Link
                to={`/product/${s.productSlug}?shade=${s.slug}`}
                className="group flex flex-col items-center gap-4"
              >
                <ShadeSwatch
                  hex={s.hexColor!}
                  hexSecondary={s.hexColorSecondary}
                  name={s.name}
                  size={120}
                  interactive={false}
                  className="group-hover:scale-105 transition-transform duration-500"
                />
                <span className="shade-name text-h3 text-ink">{s.name}</span>
                <span className="eyebrow text-[0.6rem] text-ink-muted">{s.productName}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
