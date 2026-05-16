import { useState } from "react";
import { Navigate, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { IconMenu2, IconX } from "@tabler/icons-react";
import { useAuth } from "./store/auth";
import { ThemeProvider, useTheme } from "./store/theme";
import Footer from "./components/Footer";
import StarfieldBackground from "./components/StarfieldBackground";
import CosmicBackground from "./components/CosmicBackground";
import BootSplash from "./components/BootSplash";
import CosmicClock from "./components/CosmicClock";
import ToastHost from "./design/ToastHost";
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
import Dashboard from "./pages/Dashboard";
import MarsRover from "./pages/MarsRover";
import EpicEarth from "./pages/EpicEarth";
import Exoplanets from "./pages/Exoplanets";
import NeoRadar from "./pages/NeoRadar";
import Compare from "./pages/Compare";
import ConstellationGame from "./pages/ConstellationGame";
import Achievements from "./pages/Achievements";
import PortalLayout from "./portal/PortalLayout";
import PortalOverview from "./portal/PortalOverview";
import PortalJournal from "./portal/PortalJournal";
import PortalCollections from "./portal/PortalCollections";
import PortalMissions from "./portal/PortalMissions";
import PortalNotifications from "./portal/PortalNotifications";
import PortalProfile from "./portal/PortalProfile";
import PortalModules from "./portal/PortalModules";

import "./design/hud.css";
import "@fontsource/orbitron/400.css";
import "@fontsource/orbitron/700.css";
import "@fontsource/orbitron/800.css";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/600.css";

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

function HudNavbar() {
  const { user, logout, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <header className="hud-nav">
      <NavLink to="/" className="brand" onClick={close}>
        <span className="ring" aria-hidden />
        ASTROVISION
      </NavLink>
      <div className={`hud-nav-links ${open ? "open" : ""}`}>
        <div className="hud-nav-group">
          <NavLink to="/" end onClick={close}>Home</NavLink>
          <NavLink to="/dashboard" onClick={close}>Mission</NavLink>
          <NavLink to="/about" onClick={close}>About</NavLink>
        </div>
        <div className="hud-nav-group">
          <NavLink to="/solar-system" onClick={close}>Solar</NavLink>
          <NavLink to="/iss-live" onClick={close}>ISS</NavLink>
          <NavLink to="/sky-map" onClick={close}>Sky</NavLink>
          <NavLink to="/epic-earth" onClick={close}>Earth</NavLink>
          <NavLink to="/mars-rover" onClick={close}>Mars</NavLink>
          <NavLink to="/exoplanets" onClick={close}>Exo</NavLink>
          <NavLink to="/neo-radar" onClick={close}>NEO</NavLink>
          <NavLink to="/space-weather" onClick={close}>Sun</NavLink>
          <NavLink to="/nasa-tv" onClick={close}>TV</NavLink>
        </div>
        <div className="hud-nav-group">
          <NavLink to="/samples" onClick={close}>Library</NavLink>
          <NavLink to="/gallery" onClick={close}>Gallery</NavLink>
          <NavLink to="/compare" onClick={close}>Compare</NavLink>
          <NavLink to="/constellation-game" onClick={close}>Stars</NavLink>
          {user && <NavLink to="/portal" onClick={close}>Portal</NavLink>}
          {user && <NavLink to="/predict" onClick={close}>Classify</NavLink>}
          {user && <NavLink to="/history" onClick={close}>Log</NavLink>}
          {user && <NavLink to="/achievements" onClick={close}>Badges</NavLink>}
        </div>
        <div className="hud-nav-aux">
          {user && <span className="user-chip">◉ {user.email.split("@")[0]}</span>}
          {!user && !loading && (
            <>
              <NavLink to="/login" onClick={close} style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--av-cyan)" }}>
                Login
              </NavLink>
              <NavLink to="/register" onClick={close} style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--av-violet)" }}>
                Enlist
              </NavLink>
            </>
          )}
          {user && (
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); close(); logout(); }}
              style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--av-pink)" }}
            >
              Logout
            </a>
          )}
          <ThemeToggle />
        </div>
      </div>
      <button
        className="hud-nav-mobile-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle navigation"
      >
        {open ? <IconX size={20} /> : <IconMenu2 size={20} />}
      </button>
    </header>
  );
}

function Protected({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="hud-page">Initializing…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PortalClassify() {
  return <Predict />;
}

function PortalHistory() {
  return <History />;
}

function PortalAchievements() {
  return <Achievements />;
}

function PortalOutlet() {
  return (
    <Protected>
      <PortalLayout />
    </Protected>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  const reduced = useReducedMotion();
  const transition = reduced
    ? { duration: 0 }
    : { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -10, filter: "blur(8px)" }}
        transition={transition}
      >
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
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
          <Route path="/mars-rover" element={<MarsRover />} />
          <Route path="/epic-earth" element={<EpicEarth />} />
          <Route path="/exoplanets" element={<Exoplanets />} />
          <Route path="/neo-radar" element={<NeoRadar />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/constellation-game" element={<ConstellationGame />} />
          <Route path="/portal" element={<PortalOutlet />}>
            <Route index element={<PortalOverview />} />
            <Route path="classify" element={<PortalClassify />} />
            <Route path="journal" element={<PortalJournal />} />
            <Route path="collections" element={<PortalCollections />} />
            <Route path="missions" element={<PortalMissions />} />
            <Route path="inbox" element={<PortalNotifications />} />
            <Route path="history" element={<PortalHistory />} />
            <Route path="achievements" element={<PortalAchievements />} />
            <Route path="modules" element={<PortalModules />} />
            <Route path="profile" element={<PortalProfile />} />
            <Route path="*" element={<Navigate to="/portal" replace />} />
          </Route>
          <Route path="/predict" element={<Navigate to="/portal/classify" replace />} />
          <Route path="/history" element={<Navigate to="/portal/history" replace />} />
          <Route path="/achievements" element={<Navigate to="/portal/achievements" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function AppShell() {
  const location = useLocation();
  const inPortal = location.pathname.startsWith("/portal");

  return (
    <>
      <BootSplash />
      <StarfieldBackground />
      <CosmicBackground />
      {!inPortal && <HudNavbar />}
      <main className="app-main">
        <AnimatedRoutes />
      </main>
      <Footer />
      <CosmicClock />
      <ToastHost />
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
