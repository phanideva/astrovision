import { useEffect, useMemo, useState } from "react";
import { spaceMediaApi } from "../api/spaceMedia";

type GalaxyClass = "Spiral" | "Elliptical" | "Lenticular" | "Irregular";

type GalaxyEntry = {
  title: string;
  imageUrl: string;
  sourceUrl: string;
  credit: string;
  description: string;
};

const CLASSES: GalaxyClass[] = ["Spiral", "Elliptical", "Lenticular", "Irregular"];

const CLASS_META: Record<GalaxyClass, { color: string; description: string }> = {
  Spiral: {
    color: "#6ab0ff",
    description:
      "Spiral galaxies have winding arms around a bright center where gas, dust, and young stars are common.",
  },
  Elliptical: {
    color: "#ffdc82",
    description:
      "Elliptical galaxies are smooth and rounded, with older stars and little active star formation.",
  },
  Lenticular: {
    color: "#d0aaff",
    description:
      "Lenticular galaxies are disk-shaped with a central bulge, bridging spiral and elliptical structures.",
  },
  Irregular: {
    color: "#7de0a0",
    description:
      "Irregular galaxies have no clear shape, often because of gravitational interactions and turbulent star birth.",
  },
};

const REAL_GALAXY_EXAMPLES: Record<GalaxyClass, GalaxyEntry> = {
  Spiral: {
    title: "Whirlpool Galaxy (M51)",
    imageUrl: "https://cdn.esahubble.org/archives/images/large/heic0506a.jpg",
    sourceUrl: "https://esahubble.org/images/heic0506a/",
    credit: "NASA, ESA, S. Beckwith (STScI), and the Hubble Heritage Team",
    description: CLASS_META.Spiral.description,
  },
  Elliptical: {
    title: "M87 – Elliptical Galaxy",
    imageUrl: "https://cdn.eso.org/images/screen/eso0846a.jpg",
    sourceUrl: "https://www.eso.org/public/images/eso0846a/",
    credit: "ESO / NASA / JPL-Caltech",
    description: CLASS_META.Elliptical.description,
  },
  Lenticular: {
    title: "Sombrero Galaxy (M104)",
    imageUrl: "https://cdn.esahubble.org/archives/images/large/opo0328a.jpg",
    sourceUrl: "https://esahubble.org/images/opo0328a/",
    credit: "NASA / Hubble Heritage Team",
    description: CLASS_META.Lenticular.description,
  },
  Irregular: {
    title: "Small Magellanic Cloud",
    imageUrl: "https://cdn.eso.org/images/large/eso9820d.jpg",
    sourceUrl: "https://www.eso.org/public/images/eso9820d/",
    credit: "ESO / Digitized Sky Survey 2",
    description: CLASS_META.Irregular.description,
  },
};

export default function GalaxyShowcase() {
  const [activeClass, setActiveClass] = useState<GalaxyClass>("Spiral");
  const entries = REAL_GALAXY_EXAMPLES;

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
        {current && (
          <>
            <div className="galaxy-showcase-cinematic-glow" />
            <img
              className="galaxy-showcase-image"
              src={current.imageUrl}
              alt={`${activeClass} galaxy example`}
              crossOrigin="anonymous"
              onError={(e) => {
                const img = e.currentTarget;
                if (!img.dataset.fallback) {
                  img.dataset.fallback = "1";
                  img.src = spaceMediaApi.proxyUrl(current.imageUrl);
                }
              }}
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
