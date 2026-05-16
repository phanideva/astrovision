import { FormEvent, useMemo, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../store/auth";

type Persona = "enthusiast" | "student" | "researcher";

function seedFromEmail(email: string) {
  const base = email.split("@")[0] || "stargazer";
  return `${base}-${Date.now().toString(36)}`;
}

export default function Onboarding() {
  const { user, refreshMe } = useAuth();
  const [displayName, setDisplayName] = useState(user?.display_name || "");
  const [persona, setPersona] = useState<Persona>(user?.persona || "enthusiast");
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const avatarSeed = useMemo(() => user?.avatar_seed || seedFromEmail(user?.email || ""), [user?.avatar_seed, user?.email]);

  async function finish(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.patch("/auth/me/", {
        display_name: displayName,
        persona,
        avatar_seed: avatarSeed,
        onboarded_at: new Date().toISOString(),
      });
      await refreshMe();
    } catch {
      setError("Could not complete onboarding. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="portal-modal-backdrop" role="dialog" aria-modal="true" aria-label="Portal onboarding">
      <form className="portal-modal" onSubmit={finish}>
        <div className="portal-kicker">First Login Setup</div>
        <h3>Welcome to Mission Portal</h3>
        {step === 0 && (
          <div className="portal-list">
            <div className="portal-item">
              <strong>Unified command center</strong>
              <p>Classify, track missions, and monitor your progress in one place.</p>
            </div>
            <div className="portal-item">
              <strong>Live data deck</strong>
              <p>Orbital and NASA feeds remain available across your personalized workspace.</p>
            </div>
            <div className="portal-row">
              <button type="button" className="btn" onClick={() => setStep(1)}>Continue</button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="portal-list">
            <div className="field">
              <label htmlFor="onboard-display-name">Display Name</label>
              <input
                id="onboard-display-name"
                className="input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How should Mission Control identify you?"
              />
            </div>
            <div className="field">
              <label htmlFor="onboard-persona">Persona</label>
              <select
                id="onboard-persona"
                className="input"
                value={persona}
                onChange={(e) => setPersona(e.target.value as Persona)}
              >
                <option value="enthusiast">Astronomy Enthusiast</option>
                <option value="student">Student / Educator</option>
                <option value="researcher">Researcher</option>
              </select>
            </div>
            <div className="portal-row">
              <button type="button" className="btn secondary" onClick={() => setStep(0)}>Back</button>
              <button type="button" className="btn" onClick={() => setStep(2)}>Continue</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="portal-list">
            <div className="portal-item">
              <strong>Mission Modes</strong>
              <p>Enthusiast: exploration-first. Student: learning-first. Researcher: analysis-first.</p>
            </div>
            <div className="portal-item">
              <strong>Profile seed</strong>
              <p>Avatar seed prepared: {avatarSeed}</p>
            </div>
            {error && <div className="error">{error}</div>}
            <div className="portal-row">
              <button type="button" className="btn secondary" onClick={() => setStep(1)} disabled={busy}>Back</button>
              <button className="btn" disabled={busy}>{busy ? "Finishing..." : "Launch Portal"}</button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
