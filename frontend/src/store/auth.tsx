import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api, tokens } from "../api/client";

interface User {
  id: number;
  email: string;
  persona: "enthusiast" | "student" | "researcher";
  display_name: string;
  avatar_seed: string;
  bio: string;
  onboarded_at: string | null;
  timezone: string;
}

interface RegisterPayload {
  email: string;
  password: string;
  persona?: "enthusiast" | "student" | "researcher";
  display_name?: string;
}

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  refreshMe: () => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);
const AUTH_REQUEST_TIMEOUT_MS = 60_000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    if (!tokens.access) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const r = await api.get<User>("/auth/me/");
      setUser(r.data);
    } catch {
      tokens.clear();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  async function login(email: string, password: string) {
    const r = await api.post(
      "/auth/login/",
      { email, password },
      { timeout: AUTH_REQUEST_TIMEOUT_MS }
    );
    tokens.set(r.data.access, r.data.refresh);
    await fetchMe();
  }

  async function register(payload: RegisterPayload) {
    await api.post(
      "/auth/register/",
      payload,
      { timeout: AUTH_REQUEST_TIMEOUT_MS }
    );
    await login(payload.email, payload.password);
  }

  function logout() {
    tokens.clear();
    setUser(null);
  }

  return (
    <Ctx.Provider value={{ user, loading, login, register, logout, refreshMe: fetchMe }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
