import { FormEvent, useState, ChangeEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../store/auth";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await register(email, password);
      nav("/predict");
    } catch (err: any) {
      setErr(
        err?.response?.data?.password?.[0] ??
          err?.response?.data?.email?.[0] ??
          "Registration failed."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container form-narrow">
      <div className="card">
        <h2>Create your account</h2>
        <form onSubmit={onSubmit}>
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
            {busy ? "Creating…" : "Sign up"}
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
