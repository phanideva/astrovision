import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { portalApi, PortalSummary } from "../api/portal";
import { useAuth } from "../store/auth";

export default function PortalOverview() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<PortalSummary | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    portalApi
      .summary()
      .then(setSummary)
      .catch(() => setErr("Failed to load portal summary."));
  }, []);

  return (
    <div>
      <div className="portal-kicker">Persona: {user?.persona ?? "enthusiast"}</div>
      <h1 className="portal-title">Welcome back, {user?.display_name || user?.email.split("@")[0]}</h1>
      {err && <div className="error">{err}</div>}

      <div className="portal-cards">
        <div className="portal-card">
          <div className="portal-kicker">Predictions</div>
          <h3>{summary?.counts.predictions ?? "--"}</h3>
        </div>
        <div className="portal-card">
          <div className="portal-kicker">Achievements</div>
          <h3>{summary?.counts.achievements ?? "--"}</h3>
        </div>
        <div className="portal-card">
          <div className="portal-kicker">Visited Pages</div>
          <h3>{summary?.counts.pages_visited ?? "--"}</h3>
        </div>
        <div className="portal-card">
          <div className="portal-kicker">Unread Alerts</div>
          <h3>{summary?.unread_notifications ?? "--"}</h3>
        </div>
      </div>

      <div className="portal-two">
        <div className="portal-card">
          <div className="portal-kicker">Today's Missions</div>
          <div className="portal-list">
            {(summary?.missions_today ?? []).slice(0, 4).map((m) => (
              <div className="portal-item" key={m.id}>
                <h4>{m.mission.title}</h4>
                <div>{m.count}/{m.mission.target_count} progress</div>
                <div style={{ opacity: 0.75, fontSize: 12 }}>
                  {m.is_claimed ? "Claimed" : m.is_completed ? "Ready to claim" : "In progress"}
                </div>
              </div>
            ))}
            {!summary?.missions_today?.length && <div style={{ opacity: 0.8 }}>No missions active yet.</div>}
          </div>
          <div style={{ marginTop: 10 }}>
            <Link className="btn secondary" to="/portal/missions">Open Missions</Link>
          </div>
        </div>

        <div className="portal-card">
          <div className="portal-kicker">Continue Activity</div>
          <div className="portal-list">
            {(summary?.recent_journal ?? []).map((j) => (
              <div className="portal-item" key={j.id}>
                <h4>{j.title}</h4>
                <div style={{ opacity: 0.8, fontSize: 12 }}>{j.mood}</div>
              </div>
            ))}
            {!summary?.recent_journal?.length && <div style={{ opacity: 0.8 }}>No journal entries yet.</div>}
          </div>
          <div className="portal-row" style={{ marginTop: 10 }}>
            <Link className="btn secondary" to="/portal/journal">Write Journal</Link>
            <Link className="btn" to={summary?.suggested_module ?? "/portal/modules"}>Suggested Module</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
