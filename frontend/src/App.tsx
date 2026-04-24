import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import { useAuth } from "./store/auth";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Predict from "./pages/Predict";
import History from "./pages/History";
import Samples from "./pages/Samples";

function Navbar() {
  const { user, logout, loading } = useAuth();
  return (
    <header className="navbar">
      <div className="brand">🌌 ASTROVISION</div>
      <nav>
        <NavLink to="/" end>Home</NavLink>
        <NavLink to="/samples">Samples</NavLink>
        {user && <NavLink to="/predict">Classify</NavLink>}
        {user && <NavLink to="/history">History</NavLink>}
        {!user && !loading && <NavLink to="/login">Login</NavLink>}
        {!user && !loading && <NavLink to="/register">Sign up</NavLink>}
        {user && (
          <a href="#" onClick={(e) => { e.preventDefault(); logout(); }}>
            Logout ({user.email})
          </a>
        )}
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

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/samples" element={<Samples />} />
        <Route
          path="/predict"
          element={<Protected><Predict /></Protected>}
        />
        <Route
          path="/history"
          element={<Protected><History /></Protected>}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
