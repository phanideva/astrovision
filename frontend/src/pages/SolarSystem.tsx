import SolarSystem3D from "../components/SolarSystem3D";

export default function SolarSystem() {
  return (
    <div className="container">
      <h1 className="page-title">3D Solar System</h1>
      <p style={{ color: "var(--muted)", marginTop: -10 }}>
        Interactive scale-illustrative model of the eight planets. Orbits and
        sizes are <i>schematic</i>, not to scale, so the inner planets remain
        visible alongside the gas giants.
      </p>
      <SolarSystem3D />
    </div>
  );
}
