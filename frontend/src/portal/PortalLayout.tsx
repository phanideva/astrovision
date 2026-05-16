import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../store/auth";
import Onboarding from "./Onboarding";
import "./portal.css";

export default function PortalLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="portal-shell">
      <div className="portal-topbar">
        <div>
          <div className="portal-kicker">Authenticated Command Center</div>
          <strong>Mission Portal</strong>
        </div>
        <div className="portal-row">
          <span className="user-chip">◉ {user?.display_name || user?.email.split("@")[0]}</span>
          <button className="btn secondary" onClick={logout}>Logout</button>
        </div>
      </div>
      <div className="portal-grid">
        <nav className="portal-rail">
          <NavLink to="/portal" end>Overview</NavLink>
          <NavLink to="/portal/classify">Classify</NavLink>
          <NavLink to="/portal/journal">Journal</NavLink>
          <NavLink to="/portal/collections">Collections</NavLink>
          <NavLink to="/portal/missions">Missions</NavLink>
          <NavLink to="/portal/inbox">Inbox</NavLink>
          <NavLink to="/portal/history">History</NavLink>
          <NavLink to="/portal/achievements">Achievements</NavLink>
          <NavLink to="/portal/modules">Modules</NavLink>
          <NavLink to="/portal/profile">Profile</NavLink>
        </nav>
        <section className="portal-content">
          <Outlet />
        </section>
      </div>
      {user && !user.onboarded_at && <Onboarding />}
    </div>
  );
}
