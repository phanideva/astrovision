import { FormEvent, useState, ChangeEvent } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../store/auth";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [persona, setPersona] = useState<"enthusiast" | "student" | "researcher">("enthusiast");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [slow, setSlow] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErr(null);
    setBusy(true);
    setSlow(false);
    const slowTimer = window.setTimeout(() => setSlow(true), 5000);
    try {
      await register({ email, password, display_name: displayName, persona });
      nav("/portal");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.code === "ECONNABORTED") {
          setErr("Signup timed out. The server may be waking up. Please try again.");
        } else if (!error.response) {
          setErr("Could not reach the server. Check your internet and try again.");
        } else {
          setErr(
            error?.response?.data?.password?.[0] ??
              error?.response?.data?.email?.[0] ??
              "Registration failed."
          );
        }
      } else {
        setErr("Registration failed.");
      }
    } finally {
      window.clearTimeout(slowTimer);
      setBusy(false);
      setSlow(false);
    }
  }

  return (
    <div className="container form-narrow">
      <div className="card">
        <h2>Create your account</h2>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="displayName">Display Name</label>
            <input
              id="displayName"
              className="input"
              type="text"
              placeholder="How should we call you?"
              value={displayName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="persona">Persona</label>
            <select
              id="persona"
              className="input"
              value={persona}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setPersona(e.target.value as "enthusiast" | "student" | "researcher")}
            >
              <option value="enthusiast">Astronomy Enthusiast</option>
              <option value="student">Student / Educator</option>
              <option value="researcher">Researcher / Pro Analyst</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              className="input"
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password (min 8 chars)</label>
            <input
              id="password"
              className="input"
              type="password"
              required
              minLength={8}
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            />
          </div>
          <button className="btn" disabled={busy}>
            {busy
              ? slow
                ? "Waking server up... this can take ~30s"
                : "Creating..."
              : "Sign up"}
          </button>
          {err && <div className="error">{err}</div>}
        </form>
        <p style={{ marginTop: 16 }}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
