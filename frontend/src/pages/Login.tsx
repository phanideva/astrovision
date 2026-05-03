import { FormEvent, useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../store/auth";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [slow, setSlow] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    setSlow(false);
    const slowTimer = window.setTimeout(() => setSlow(true), 5000);
    try {
      await login(email, password);
      nav("/predict");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.code === "ECONNABORTED") {
          setErr("Login timed out. The server may be waking up. Please try again.");
        } else if (!error.response) {
          setErr("Could not reach the server. Check your internet and try again.");
        } else if (error.response.status === 401) {
          setErr("Invalid email or password.");
        } else {
          setErr("Login failed. Please try again in a moment.");
        }
      } else {
        setErr("Login failed. Please try again.");
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
            {busy
              ? slow
                ? "Waking server up... this can take ~30s"
                : "Logging in..."
              : "Log in"}
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
