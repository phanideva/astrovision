import { useEffect, useState } from "react";

export default function SkyMap() {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [denied, setDenied] = useState(false);
  const [latInput, setLatInput] = useState("");
  const [lonInput, setLonInput] = useState("");

  useEffect(() => {
    if (!navigator.geolocation) {
      setDenied(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => setCoords({ lat: p.coords.latitude, lon: p.coords.longitude }),
      () => setDenied(true),
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }, []);

  const url = coords
    ? `https://stellarium-web.org/?ra=0&dec=0&fov=120&lat=${coords.lat.toFixed(
        3
      )}&lng=${coords.lon.toFixed(3)}&date=now`
    : "https://stellarium-web.org/";

  function applyManual() {
    const lat = parseFloat(latInput);
    const lon = parseFloat(lonInput);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      setCoords({ lat, lon });
      setDenied(false);
    }
  }

  return (
    <div className="container">
      <h1 className="page-title">✨ Sky Map</h1>
      <p style={{ color: "var(--muted)", marginTop: -10 }}>
        Live planetarium view powered by{" "}
        <a href="https://stellarium-web.org/" target="_blank" rel="noreferrer noopener">
          Stellarium Web
        </a>
        . Drag to look around · scroll to zoom.
      </p>

      {denied && !coords && (
        <div className="card" style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div>
            <div className="stat-label">Latitude</div>
            <input className="input" style={{ width: 140 }} value={latInput} onChange={(e) => setLatInput(e.target.value)} placeholder="e.g. 37.77" />
          </div>
          <div>
            <div className="stat-label">Longitude</div>
            <input className="input" style={{ width: 140 }} value={lonInput} onChange={(e) => setLonInput(e.target.value)} placeholder="e.g. -122.42" />
          </div>
          <button className="btn" onClick={applyManual}>Center sky</button>
          <span style={{ color: "var(--muted)", fontSize: 12 }}>
            Browser geolocation declined — enter coordinates manually.
          </span>
        </div>
      )}

      {coords && (
        <div style={{ marginBottom: 8, color: "var(--muted)", fontSize: 13 }}>
          Centered at <b>{coords.lat.toFixed(3)}°, {coords.lon.toFixed(3)}°</b>
        </div>
      )}

      <div className="sky-frame">
        <iframe src={url} title="Stellarium Web" allow="fullscreen" />
      </div>
    </div>
  );
}
