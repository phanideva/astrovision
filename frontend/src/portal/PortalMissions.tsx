import { useEffect, useState } from "react";
import { portalApi, PortalMissionItem } from "../api/portal";

export default function PortalMissions() {
  const [items, setItems] = useState<PortalMissionItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const data = await portalApi.missionsToday();
    setItems(data.items);
  }

  useEffect(() => {
    load().catch(() => setError("Failed to load missions."));
  }, []);

  async function claim(code: string) {
    try {
      await portalApi.claimMission(code);
      await load();
    } catch {
      setError("Could not claim reward yet.");
    }
  }

  return (
    <div>
      <div className="portal-kicker">Daily Objectives</div>
      <h2 className="portal-title">Mission Board</h2>
      {error && <div className="error">{error}</div>}
      <div className="portal-list">
        {items.map((m) => (
          <div className="portal-item" key={m.id}>
            <h4>{m.mission.title}</h4>
            <div style={{ opacity: 0.85, marginBottom: 6 }}>{m.mission.description}</div>
            <div>{m.count}/{m.mission.target_count} complete</div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>Reward: {m.mission.reward_xp} XP</div>
            {!m.is_claimed && m.is_completed && (
              <button className="btn" style={{ marginTop: 8 }} onClick={() => claim(m.mission.code)}>
                Claim Reward
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
