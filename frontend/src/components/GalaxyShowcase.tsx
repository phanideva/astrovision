import { useEffect, useMemo, useState } from "react";
import { CuratedItem, spaceMediaApi } from "../api/spaceMedia";

type GalaxyClass = "Spiral" | "Elliptical" | "Lenticular" | "Irregular";

type GalaxyEntry = {
  title: string;
  imageUrl: string;
  sourceUrl: string;
  credit: string;
  description: string;
};

const CLASSES: GalaxyClass[] = ["Spiral", "Elliptical", "Lenticular", "Irregular"];

const CLASS_META: Record<GalaxyClass, { color: string; description: string; curatedIds: string[] }> = {
  Spiral: {
    color: "#6ab0ff",
    description:
      "Spiral galaxies have winding arms around a bright center where gas, dust, and young stars are common.",
    curatedIds: ["whirlpool", "ngc-1300", "andromeda"],
  },
  Elliptical: {
    color: "#ffdc82",
    description:
      "Elliptical galaxies are smooth and rounded, with older stars and little active star formation.",
    curatedIds: ["deep-field", "andromeda", "whirlpool"],
  },
  Lenticular: {
    color: "#d0aaff",
    description:
      "Lenticular galaxies are disk-shaped with a central bulge, bridging spiral and elliptical structures.",
    curatedIds: ["sombrero", "andromeda", "deep-field"],
  },
  Irregular: {
    color: "#7de0a0",
    description:
      "Irregular galaxies have no clear shape, often because of gravitational interactions and turbulent star birth.",
    curatedIds: ["stephans-quintet", "webb-deep-field", "deep-field"],
  },
};

function toEntry(cls: GalaxyClass, item: CuratedItem): GalaxyEntry {
  return {
    title: item.title || `${cls} galaxy`,
    imageUrl: item.full,
    sourceUrl: item.source_url,
    credit: item.credit,
    description: CLASS_META[cls].description,
  };
}

export default function GalaxyShowcase() {
  const [activeClass, setActiveClass] = useState<GalaxyClass>("Spiral");
  const [entries, setEntries] = useState<Partial<Record<GalaxyClass, GalaxyEntry>>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    spaceMediaApi
      .curated()
      .then((items) => {
        if (cancelled) return;
        const next: Partial<Record<GalaxyClass, GalaxyEntry>> = {};
        CLASSES.forEach((cls) => {
          const selected = CLASS_META[cls].curatedIds
            .map((id) => items.find((it) => it.id === id))
            .find(Boolean);
          if (selected) {
            next[cls] = toEntry(cls, selected);
          }
        });
        setEntries(next);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveClass((prev) => {
        const idx = CLASSES.indexOf(prev);
        return CLASSES[(idx + 1) % CLASSES.length];
      });
    }, 6000);
    return () => clearInterval(id);
  }, []);

  const current = useMemo(() => entries[activeClass], [entries, activeClass]);

  return (
    <div>
      <div className="galaxy-showcase-tabs">
        {CLASSES.map((cls) => {
          const color = CLASS_META[cls].color;
          return (
            <button
              key={cls}
              className="galaxy-showcase-tab"
              onClick={() => setActiveClass(cls)}
              style={{
                borderColor: color,
                color,
                background: activeClass === cls ? `${color}30` : "transparent",
                fontWeight: activeClass === cls ? 700 : 500,
              }}
            >
              {cls}
            </button>
          );
        })}
      </div>

      <div className="card galaxy-showcase-card">
        {loading && !current && (
          <p className="galaxy-showcase-meta">Loading real telescope imagery...</p>
        )}

        {!loading && !current && (
          <p className="galaxy-showcase-meta">
            Real-image preview is temporarily unavailable. Visit the Samples tab for curated images.
          </p>
        )}

        {current && (
          <>
            <img
              className="galaxy-showcase-image"
              src={spaceMediaApi.proxyUrl(current.imageUrl)}
              alt={`${activeClass} galaxy example`}
            />
            <div className="galaxy-showcase-footer">
              <div>
                <div className="galaxy-showcase-title">{current.title}</div>
                <div className="galaxy-showcase-meta">{current.description}</div>
                <div className="galaxy-showcase-meta">Credit: {current.credit}</div>
              </div>
              <a href={current.sourceUrl} target="_blank" rel="noreferrer noopener">
                Source
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
