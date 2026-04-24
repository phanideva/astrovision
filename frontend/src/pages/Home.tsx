import { Link } from "react-router-dom";
import GalaxyViewer3D from "../components/GalaxyViewer3D";
import { useAuth } from "../store/auth";

export default function Home() {
  const { user, loading } = useAuth();

  return (
    <>
      <section className="hero">
        <h1>Classify Galaxies. Visualize the Cosmos.</h1>
        <p>
          AstroVision is a deep-learning powered web app that classifies
          deep-space galaxy images into morphological types — Spiral,
          Elliptical, Irregular, and Lenticular — and renders an
          interactive 3D representation of the prediction.
        </p>
        {!loading && (
          <p style={{ marginTop: 16 }}>
            {user ? (
              <>
                <Link to="/predict" className="btn" style={{ marginRight: 12 }}>
                  Classify a Galaxy
                </Link>
                <Link to="/samples" className="btn secondary">Browse Samples</Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn" style={{ marginRight: 12 }}>
                  Get started
                </Link>
                <Link to="/login" className="btn secondary">Log in</Link>
              </>
            )}
          </p>
        )}
      </section>
      <div className="container">
        <div className="card" style={{ height: 420 }}>
          <GalaxyViewer3D galaxyClass="Spiral" />
        </div>
      </div>
    </>
  );
}
