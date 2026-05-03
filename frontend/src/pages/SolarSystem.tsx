import SolarSystem3D from "../components/SolarSystem3D";

export default function SolarSystem() {
  return (
    <div className="solar-page">
      <div className="solar-page-header">
        <h1 className="solar-page-title">3D Solar System</h1>
        <p className="solar-page-sub">
          Real 2 K texture maps · accurate axial tilts · asteroid belt · interactive camera
        </p>
      </div>
      <SolarSystem3D />
    </div>
  );
}
