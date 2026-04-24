import { FormEvent, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../store/auth";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await login(email, password);
      nav("/predict");
    } catch {
      setErr("Invalid credentials.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container form-narrow">
      <div className="card">
        <h2>Log in</h2>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label>Email</label>
            <input
              className="input" type="email" required
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              className="input" type="password" required
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button className="btn" disabled={busy}>
            {busy ? "Logging in…" : "Log in"}
          </button>
          {err && <div className="error">{err}</div>}
        </form>
        <p style={{ marginTop: 16 }}>
          No account? <Link to="/register">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
