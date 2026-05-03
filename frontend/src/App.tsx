import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import { useAuth } from "./store/auth";
import { ThemeProvider, useTheme } from "./store/theme";
import Footer from "./components/Footer";
import StarfieldBackground from "./components/StarfieldBackground";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Predict from "./pages/Predict";
import History from "./pages/History";
import Samples from "./pages/Samples";
import About from "./pages/About";
import SolarSystem from "./pages/SolarSystem";
import SkyMap from "./pages/SkyMap";
import ISSLive from "./pages/ISSLive";
import NasaTV from "./pages/NasaTV";
import SpaceWeather from "./pages/SpaceWeather";
import Gallery from "./pages/Gallery";

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      className="theme-toggle"
      onClick={toggle}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? "☀" : "☾"}
    </button>
  );
}

function Navbar() {
  const { user, logout, loading } = useAuth();
  return (
    <header className="navbar">
      <NavLink to="/" className="brand">🌌 ASTROVISION</NavLink>
      <nav>
        <NavLink to="/" end>Home</NavLink>
        <NavLink to="/samples">Library</NavLink>
        <NavLink to="/solar-system">Solar</NavLink>
        <NavLink to="/iss-live">ISS</NavLink>
        <NavLink to="/sky-map">Sky</NavLink>
        <NavLink to="/nasa-tv">NASA TV</NavLink>
        <NavLink to="/space-weather">Sun</NavLink>
        <NavLink to="/gallery">Gallery</NavLink>
        {user && <NavLink to="/predict">Classify</NavLink>}
        {user && <NavLink to="/history">History</NavLink>}
        <NavLink to="/about">About</NavLink>
        {!user && !loading && <NavLink to="/login">Login</NavLink>}
        {!user && !loading && <NavLink to="/register">Sign up</NavLink>}
        {user && (
          <a href="#" onClick={(e) => { e.preventDefault(); logout(); }}>
            Logout ({user.email})
          </a>
        )}
        <ThemeToggle />
      </nav>
    </header>
  );
}

function Protected({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="container">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppShell() {
  return (
    <>
      <StarfieldBackground />
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/samples" element={<Samples />} />
          <Route path="/solar-system" element={<SolarSystem />} />
          <Route path="/sky-map" element={<SkyMap />} />
          <Route path="/iss-live" element={<ISSLive />} />
          <Route path="/nasa-tv" element={<NasaTV />} />
          <Route path="/space-weather" element={<SpaceWeather />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/about" element={<About />} />
          <Route path="/predict" element={<Protected><Predict /></Protected>} />
          <Route path="/history" element={<Protected><History /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}
