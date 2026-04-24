import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

export const api = axios.create({ baseURL, withCredentials: false });

const ACCESS_KEY = "av_access";
const REFRESH_KEY = "av_refresh";

export const tokens = {
  get access() { return localStorage.getItem(ACCESS_KEY); },
  get refresh() { return localStorage.getItem(REFRESH_KEY); },
  set(access: string, refresh?: string) {
    localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const t = tokens.access;
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

let refreshInflight: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!tokens.refresh) throw new Error("no refresh token");
  if (!refreshInflight) {
    refreshInflight = axios
      .post(`${baseURL}/auth/refresh/`, { refresh: tokens.refresh })
      .then((r) => {
        const access = r.data.access as string;
        tokens.set(access);
        return access;
      })
      .finally(() => {
        refreshInflight = null;
      });
  }
  return refreshInflight;
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !original.url?.includes("/auth/")
    ) {
      try {
        original._retry = true;
        const access = await refreshAccessToken();
        original.headers.Authorization = `Bearer ${access}`;
        return api.request(original);
      } catch {
        tokens.clear();
      }
    }
    return Promise.reject(error);
  }
);
