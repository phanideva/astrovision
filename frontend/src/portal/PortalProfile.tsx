import { FormEvent, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../store/auth";

export default function PortalProfile() {
  const { user, refreshMe } = useAuth();
  const [displayName, setDisplayName] = useState(user?.display_name ?? "");
  const [persona, setPersona] = useState(user?.persona ?? "enthusiast");
  const [timezone, setTimezone] = useState(user?.timezone ?? "UTC");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [message, setMessage] = useState<string | null>(null);

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    try {
      await api.patch("/auth/me/", {
        display_name: displayName,
        persona,
        timezone,
        bio,
      });
      await refreshMe();
      setMessage("Profile updated.");
    } catch {
      setMessage("Could not update profile.");
    }
  }

  return (
    <div>
      <div className="portal-kicker">Identity</div>
      <h2 className="portal-title">Profile Settings</h2>
      <form onSubmit={onSave} className="portal-card">
        <div className="field">
          <label htmlFor="portal-display-name">Display Name</label>
          <input
            id="portal-display-name"
            className="input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="portal-persona">Persona</label>
          <select
            id="portal-persona"
            className="input"
            value={persona}
            onChange={(e) => setPersona(e.target.value as "enthusiast" | "student" | "researcher")}
          >
            <option value="enthusiast">Enthusiast</option>
            <option value="student">Student / Educator</option>
            <option value="researcher">Researcher</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="portal-timezone">Timezone</label>
          <input
            id="portal-timezone"
            className="input"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="portal-bio">Bio</label>
          <textarea
            id="portal-bio"
            className="input"
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>
        <button className="btn">Save</button>
        {message && <div className="portal-profile-message">{message}</div>}
      </form>
    </div>
  );
}
