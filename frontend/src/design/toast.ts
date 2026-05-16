/** Lightweight SSR-safe localStorage event bus for achievements toasts. */
import { useEffect } from "react";

export type Toast = {
  id: string | number;
  title: string;
  sub?: string;
  message?: string;
  tone?: "amber" | "cyan" | "violet" | "green";
};

const KEY = "av_toast_bus";
type Listener = (t: Toast) => void;
const listeners = new Set<Listener>();

export function emitToast(t: Toast) {
  listeners.forEach((l) => l(t));
  // Also dispatch as event so cross-component code can observe.
  try {
    window.dispatchEvent(new CustomEvent(KEY, { detail: t }));
  } catch {
    /* ignore */
  }
}

export function useToastListener(fn: Listener) {
  useEffect(() => {
    listeners.add(fn);
    const handler = (e: Event) => fn((e as CustomEvent<Toast>).detail);
    window.addEventListener(KEY, handler);
    return () => {
      listeners.delete(fn);
      window.removeEventListener(KEY, handler);
    };
  }, [fn]);
}
