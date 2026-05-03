import { useEffect, useMemo, useState } from "react";
import { NasaSearchItem, spaceMediaApi } from "../api/spaceMedia";

type GalaxyClass = "Spiral" | "Elliptical" | "Lenticular" | "Irregular";

type GalaxyEntry = {
  title: string;
  imageUrl: string;
  sourceUrl: string;
  credit: string;
  description: string;
};

const CLASSES: GalaxyClass[] = ["Spiral", "Elliptical", "Lenticular", "Irregular"];

const CLASS_META: Record<GalaxyClass, { query: string; color: string; description: string }> = {
  Spiral: {
    query: "spiral galaxy hubble visible light",
    color: "#6ab0ff",
    description:
      "Spiral galaxies have winding arms around a bright center where gas, dust, and young stars are common.",
  },
  Elliptical: {
    query: "elliptical galaxy hubble",
    color: "#ffdc82",
    description:
      "Elliptical galaxies are smooth and rounded, with older stars and little active star formation.",
  },
  Lenticular: {
    query: "lenticular galaxy hubble",
    color: "#d0aaff",
    description:
      "Lenticular galaxies are disk-shaped with a central bulge, bridging spiral and elliptical structures.",
  },
  Irregular: {
    query: "irregular galaxy hubble",
    color: "#7de0a0",
    description:
      "Irregular galaxies have no clear shape, often because of gravitational interactions and turbulent star birth.",
  },
};

function extractImage(item: NasaSearchItem): string | null {
  const preferred = item.links?.find((l) => l.render === "image")?.href;
  if (preferred) return preferred;
  const anyImage = item.links?.find((l) => /\.(jpg|jpeg|png)(\?|$)/i.test(l.href))?.href;
  return anyImage ?? null;
}

function toEntry(cls: GalaxyClass, item: NasaSearchItem): GalaxyEntry | null {
  const imageUrl = extractImage(item);
  if (!imageUrl) return null;
  const data = item.data?.[0];
  const nasaId = data?.nasa_id;
  return {
    title: data?.title || `${cls} galaxy`,
    imageUrl,
    sourceUrl: nasaId
      ? `https://images.nasa.gov/details/${encodeURIComponent(nasaId)}`
      : "https://images.nasa.gov/",
    credit: data?.center ? `NASA / ${data.center}` : "NASA Image and Video Library",
    description: CLASS_META[cls].description,
  };
}

export default function GalaxyShowcase() {
  const [activeClass, setActiveClass] = useState<GalaxyClass>("Spiral");
  const [entries, setEntries] = useState<Partial<Record<GalaxyClass, GalaxyEntry>>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      CLASSES.map(async (cls) => {
        const result = await spaceMediaApi.search(CLASS_META[cls].query, 1);
        const entry = result.collection.items.map((it) => toEntry(cls, it)).find(Boolean) ?? null;
        return { cls, entry };
      })
    )
      .then((all) => {
        if (cancelled) return;
        const next: Partial<Record<GalaxyClass, GalaxyEntry>> = {};
        all.forEach(({ cls, entry }) => {
          if (entry) next[cls] = entry;
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
          <p className="galaxy-showcase-meta">Loading real NASA galaxy imagery...</p>
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
