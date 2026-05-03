import { useEffect, useState } from "react";

type KpRow = string[];

export default function SpaceWeather() {
  const [kp, setKp] = useState<{ time: string; value: number }[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json")
      .then((r) => r.json() as Promise<KpRow[]>)
      .then((rows) => {
        if (cancelled) return;
        const data = rows
          .slice(1)
          .slice(-24)
          .map((r) => ({
            time: r[0],
            value: parseFloat(r[1]),
          }))
          .filter((d) => Number.isFinite(d.value));
        if (!data.length) {
          setErr("Space weather data is temporarily unavailable.");
          setKp([]);
          return;
        }
        setErr(null);
        setKp(data);
      })
      .catch(() => !cancelled && setErr("NOAA SWPC is unreachable right now."));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const latest = kp && kp.length ? kp[kp.length - 1] : null;
  const latestValue = latest && Number.isFinite(latest.value) ? latest.value : null;
  const stamp = Date.now();

  return (
    <div className="container">
      <h1 className="page-title">☀️ Space Weather</h1>
      <p style={{ color: "var(--muted)", marginTop: -10 }}>
        Live solar imagery from NASA SDO and the planetary K-index from NOAA SWPC.
      </p>

      <div className="grid">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>NASA SDO — Sun (HMI Intensitygram)</h3>
          <img
            key={tick}
            src={`https://sdo.gsfc.nasa.gov/assets/img/latest/latest_512_HMIIC.jpg?t=${stamp}`}
            alt="Latest SDO HMI image of the Sun"
            style={{ width: "100%", borderRadius: 10 }}
          />
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 0 }}>
            Refreshes every 60 seconds · credit: NASA / SDO / HMI team
          </p>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>NASA SDO — AIA 304 Å</h3>
          <img
            key={`a-${tick}`}
            src={`https://sdo.gsfc.nasa.gov/assets/img/latest/latest_512_0304.jpg?t=${stamp}`}
            alt="Latest SDO AIA 304 image"
            style={{ width: "100%", borderRadius: 10 }}
          />
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 0 }}>
            Chromosphere &amp; transition region — credit: NASA / SDO / AIA
          </p>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Planetary K-index (last 24 readings)</h3>
        {err && <div className="error">{err}</div>}
        {!err && !kp && <p style={{ color: "var(--muted)" }}>Loading...</p>}
        {!err && kp?.length === 0 && (
          <p style={{ color: "var(--muted)" }}>No recent K-index readings available.</p>
        )}
        {kp && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
              <div>
                <div className="stat-label">Latest Kp</div>
                <div style={{ fontSize: 36, fontWeight: 800, color: kpColor(latestValue ?? 0) }}>
                  {latestValue !== null ? latestValue.toFixed(2) : "--"}
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>
                  {latestValue !== null
                    ? kpDescription(latestValue)
                    : "Space weather summary unavailable."}
                </div>
              </div>
              <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 2, height: 80 }}>
                {kp.map((d, i) => (
                  <div
                    key={i}
                    title={`${d.time} -> Kp ${d.value.toFixed(2)}`}
                    style={{
                      flex: 1,
                      height: `${Math.min(100, (d.value / 9) * 100)}%`,
                      background: kpColor(d.value),
                      borderRadius: 2,
                    }}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function kpColor(v: number): string {
  if (v < 4) return "#7de0a0";
  if (v < 5) return "#ffd76b";
  if (v < 7) return "#ff9a55";
  return "#ff5060";
}

function kpDescription(v: number): string {
  if (v < 4) return "Quiet — auroras unlikely.";
  if (v < 5) return "Unsettled.";
  if (v < 6) return "Minor geomagnetic storm (G1).";
  if (v < 7) return "Moderate storm (G2) — auroras visible at high latitudes.";
  if (v < 8) return "Strong storm (G3).";
  return "Severe / extreme storm (G4–G5).";
}
