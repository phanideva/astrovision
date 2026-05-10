import { useEffect, useState } from "react";

type Launch = { name: string; net: string; provider: string } | null;

function fmtCountdown(target: number) {
  const ms = target - Date.now();
  if (ms <= 0) return "LIVE";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `T-${d}d ${h.toString().padStart(2, "0")}h`;
  return `T-${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

export default function CosmicClock() {
  const [now, setNow] = useState(() => new Date());
  const [iss, setIss] = useState<{ lat: number; lon: number } | null>(null);
  const [launch, setLaunch] = useState<Launch>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function fetchIss() {
      try {
        const r = await fetch("https://api.wheretheiss.at/v1/satellites/25544");
        if (!r.ok) return;
        const d = await r.json();
        if (!cancelled) setIss({ lat: d.latitude, lon: d.longitude });
      } catch { /* ignore */ }
    }
    fetchIss();
    const id = setInterval(fetchIss, 15000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=1&hide_recent_previous=true")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d?.results?.[0]) return;
        const r = d.results[0];
        setLaunch({ name: r.name, net: r.net, provider: r.launch_service_provider?.name ?? "" });
      })
      .catch(() => { /* ignore */ });
    return () => { cancelled = true; };
  }, []);

  const utc = now.toISOString().slice(11, 19);
  const launchT = launch ? fmtCountdown(new Date(launch.net).getTime()) : "—";

  return (
    <div className="cosmic-clock" aria-label="Cosmic clock">
      <div className="row"><span className="lbl">UTC</span><span className="val">{utc}</span></div>
      <div className="row green">
        <span className="lbl">ISS</span>
        <span className="val">{iss ? `${iss.lat.toFixed(1)}°, ${iss.lon.toFixed(1)}°` : "—"}</span>
      </div>
      <div className="row amber">
        <span className="lbl" title={launch?.name}>NEXT</span>
        <span className="val">{launchT}</span>
      </div>
    </div>
  );
}
